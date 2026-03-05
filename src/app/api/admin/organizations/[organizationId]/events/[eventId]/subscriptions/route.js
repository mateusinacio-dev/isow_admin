import sql from "@/app/api/utils/sql";

function clampInt(value, { min, max, fallback }) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, parsed));
}

// Returns recurring donors/subscriptions for an event (Programas: STOCKS/CROWDFUNDING)
// Chain:
// EventTicket.orderId -> Order.aquisitionTransactionId -> DonationTransaction (seed)
// Then include all CONFIRMED DonationTransaction rows that share the same subscriptionId.
export async function GET(request, { params: { organizationId, eventId } }) {
  try {
    // Guard: event belongs to organization
    const [evt] = await sql`
      SELECT e."eventId"
      FROM public."Event" e
      WHERE e."eventId" = ${eventId}
        AND e."organizationId" = ${organizationId}
        AND e."deletedAt" IS NULL
      LIMIT 1
    `;

    if (!evt) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim() || "";

    const limit = clampInt(url.searchParams.get("limit"), {
      min: 5,
      max: 100,
      fallback: 25,
    });

    const offset = clampInt(url.searchParams.get("offset"), {
      min: 0,
      max: 100000,
      fallback: 0,
    });

    // Status filter: ALL | AT_RISK | CHURN | INADIMPLENTE
    const statusFilter =
      url.searchParams.get("status")?.trim().toUpperCase() || "ALL";

    // Thresholds (days since last successful charge)
    // Per requirement:
    // - churn: > 30 days without new payment
    // - inadimplente: > 60 days without new payment
    // - em risco: configurable, but default 15 days
    const atRiskDays = clampInt(url.searchParams.get("atRiskDays"), {
      min: 5,
      max: 365,
      fallback: 15,
    });

    const churnDays = clampInt(url.searchParams.get("churnDays"), {
      min: 10,
      max: 365,
      fallback: 30,
    });

    const delinquentDays = clampInt(url.searchParams.get("delinquentDays"), {
      min: 20,
      max: 365,
      fallback: 60,
    });

    // Dynamic query to support optional search + optional status filter + pagination.
    const values = [];
    let idx = 1;

    const eventIdParam = idx++;
    values.push(eventId);

    const atRiskParam = idx++;
    values.push(atRiskDays);

    const churnParam = idx++;
    values.push(churnDays);

    const delinquentParam = idx++;
    values.push(delinquentDays);

    // Build SEARCH-only where clause (used for the summary counters)
    const whereSearchParts = [];
    if (search) {
      const sParam = idx++;
      values.push(`%${search}%`);
      whereSearchParts.push(`(
        COALESCE(s."donorName", '') ILIKE $${sParam}
        OR COALESCE(s."donorExternal", '') ILIKE $${sParam}
        OR COALESCE(s."donorLegal", '') ILIKE $${sParam}
        OR COALESCE(s."subscriptionId"::text, '') ILIKE $${sParam}
      )`);
    }

    const whereSearchSql = whereSearchParts.length
      ? `WHERE ${whereSearchParts.join(" AND ")}`
      : "";

    // Status filter applied on top of the search-filtered result set
    const whereStatusParts = [];
    if (statusFilter && statusFilter !== "ALL") {
      const statusParam = idx++;
      values.push(statusFilter);
      whereStatusParts.push(`s."churnStatus" = $${statusParam}`);
    }
    const whereStatusSql = whereStatusParts.length
      ? `WHERE ${whereStatusParts.join(" AND ")}`
      : "";

    const limitParam = idx++;
    values.push(limit);

    const offsetParam = idx++;
    values.push(offset);

    const query = `
      WITH seed_orders AS (
        SELECT DISTINCT et."orderId" AS order_id
        FROM public."EventTicket" et
        WHERE et."eventId" = $${eventIdParam}
          AND et."deletedAt" IS NULL
          AND et."orderId" IS NOT NULL
      ),
      seed_tx AS (
        SELECT
          dt."donationTransactionId" AS id,
          dt."acquirerTransactionDate" AS "at",
          dt."donationTransactionValue"::numeric AS gross,
          dt."donationTransactionNetValue"::numeric AS net,
          dt."debitPartyPersonLegalName" AS "donorName",
          LOWER(dt."debitPartyExternalUserIdentifier") AS "donorExternal",
          dt."debitPartyPersonLegalIdNumber" AS "donorLegal",
          dt."subscriptionId" AS "subscriptionId"
        FROM public."Order" o
        JOIN seed_orders so ON so.order_id = o."orderId"
        JOIN public."DonationTransaction" dt
          ON dt."donationTransactionId" = o."aquisitionTransactionId"
          AND dt."deletedAt" IS NULL
        WHERE o."deletedAt" IS NULL
          AND dt.status = 'CONFIRMED'
          AND dt."subscriptionId" IS NOT NULL
      ),
      seed_subs AS (
        SELECT DISTINCT "subscriptionId"
        FROM seed_tx
        WHERE "subscriptionId" IS NOT NULL
      ),
      all_tx AS (
        SELECT * FROM seed_tx

        UNION ALL

        SELECT
          dt."donationTransactionId" AS id,
          dt."acquirerTransactionDate" AS "at",
          dt."donationTransactionValue"::numeric AS gross,
          dt."donationTransactionNetValue"::numeric AS net,
          dt."debitPartyPersonLegalName" AS "donorName",
          LOWER(dt."debitPartyExternalUserIdentifier") AS "donorExternal",
          dt."debitPartyPersonLegalIdNumber" AS "donorLegal",
          dt."subscriptionId" AS "subscriptionId"
        FROM public."DonationTransaction" dt
        JOIN seed_subs ss ON ss."subscriptionId" = dt."subscriptionId"
        WHERE dt."deletedAt" IS NULL
          AND dt.status = 'CONFIRMED'
      ),
      dedup AS (
        SELECT DISTINCT ON (id)
          id,
          "at",
          gross,
          net,
          "donorName",
          "donorExternal",
          "donorLegal",
          "subscriptionId"
        FROM all_tx
        ORDER BY id
      ),
      canonical_subs AS (
        -- Canonicalize investor identity per subscriptionId.
        -- This avoids splitting the same investor when their external identifier changes
        -- (e.g. email in early charges and CPF in later charges).
        SELECT
          "subscriptionId",
          COALESCE(
            NULLIF(MAX(NULLIF("donorLegal", '')), ''),
            NULLIF(MAX(CASE WHEN COALESCE("donorExternal", '') LIKE '%@%' THEN "donorExternal" END), ''),
            NULLIF(MAX(NULLIF("donorExternal", '')), ''),
            NULLIF(MAX(NULLIF("donorName", '')), ''),
            'UNKNOWN'
          ) AS donor_key,
          MAX("donorName") AS "donorName",
          MAX(CASE WHEN COALESCE("donorExternal", '') LIKE '%@%' THEN "donorExternal" END) AS "donorEmail",
          MAX(NULLIF("donorLegal", '')) AS "donorLegal",
          MAX(NULLIF("donorExternal", '')) AS "donorExternalAny"
        FROM dedup
        WHERE "subscriptionId" IS NOT NULL
        GROUP BY "subscriptionId"
      ),
      subs AS (
        SELECT
          d."subscriptionId"::text AS "subscriptionId",
          cs.donor_key AS donor_key,
          cs."donorName" AS "donorName",
          COALESCE(cs."donorEmail", cs."donorExternalAny") AS "donorExternal",
          cs."donorLegal" AS "donorLegal",
          COUNT(*)::int AS "installments",
          COALESCE(SUM(d.gross), 0)::numeric AS "grossTotal",
          COALESCE(SUM(d.net), 0)::numeric AS "netTotal",
          MAX(d."at") AS "lastChargeAt",
          MIN(d."at") AS "firstChargeAt",
          EXTRACT(day FROM (NOW() - MAX(d."at")))::int AS "daysSinceLastCharge",
          CASE
            WHEN EXTRACT(day FROM (NOW() - MAX(d."at")))::int >= $${delinquentParam} THEN 'INADIMPLENTE'
            WHEN EXTRACT(day FROM (NOW() - MAX(d."at")))::int >= $${churnParam} THEN 'CHURN'
            WHEN EXTRACT(day FROM (NOW() - MAX(d."at")))::int >= $${atRiskParam} THEN 'AT_RISK'
            ELSE 'ACTIVE'
          END AS "churnStatus"
        FROM dedup d
        JOIN canonical_subs cs ON cs."subscriptionId" = d."subscriptionId"
        GROUP BY d."subscriptionId", cs.donor_key, cs."donorName", cs."donorEmail", cs."donorExternalAny", cs."donorLegal"
      ),
      search_filtered AS (
        SELECT *
        FROM subs s
        ${whereSearchSql}
      ),
      status_counts AS (
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE "churnStatus" = 'ACTIVE')::int AS active,
          COUNT(*) FILTER (WHERE "churnStatus" = 'AT_RISK')::int AS at_risk,
          COUNT(*) FILTER (WHERE "churnStatus" = 'CHURN')::int AS churn,
          COUNT(*) FILTER (WHERE "churnStatus" = 'INADIMPLENTE')::int AS inadimplente
        FROM search_filtered
      )
      SELECT
        s.*, 
        sc.total AS "totalCount",
        sc.active AS "countActive",
        sc.at_risk AS "countAtRisk",
        sc.churn AS "countChurn",
        sc.inadimplente AS "countInadimplente"
      FROM search_filtered s
      CROSS JOIN status_counts sc
      ${whereStatusSql}
      ORDER BY s."lastChargeAt" DESC, s."netTotal" DESC
      LIMIT $${limitParam}
      OFFSET $${offsetParam};
    `;

    const rows = await sql(query, values);
    const totalCount = rows?.[0]?.totalCount ?? 0;

    const statusCounts = {
      total: Number(rows?.[0]?.totalCount ?? 0),
      active: Number(rows?.[0]?.countActive ?? 0),
      atRisk: Number(rows?.[0]?.countAtRisk ?? 0),
      churn: Number(rows?.[0]?.countChurn ?? 0),
      inadimplente: Number(rows?.[0]?.countInadimplente ?? 0),
    };

    const subscriptions = rows.map((r) => ({
      subscriptionId: r.subscriptionId,
      donorKey: r.donor_key,
      donorName: r.donorName,
      donorExternal: r.donorExternal,
      donorLegal: r.donorLegal,
      installments: Number(r.installments || 0),
      grossTotal: Number(r.grossTotal || 0),
      netTotal: Number(r.netTotal || 0),
      firstChargeAt: r.firstChargeAt,
      lastChargeAt: r.lastChargeAt,
      daysSinceLastCharge: Number(r.daysSinceLastCharge || 0),
      churnStatus: r.churnStatus,
    }));

    return Response.json({
      subscriptions,
      meta: {
        limit,
        offset,
        totalCount: Number(totalCount || 0),
        churnDays,
        atRiskDays,
        delinquentDays,
        status: statusFilter,
        statusCounts,
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not load subscriptions" },
      { status: 500 },
    );
  }
}
