import sql from "@/app/api/utils/sql";

function clampInt(value, { min, max, fallback }) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, parsed));
}

export async function GET(request, { params: { organizationId, eventId } }) {
  try {
    // Ensure event belongs to organization (cheap guard)
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

    // Dynamic query (function form) to support optional search + pagination
    const values = [];
    let idx = 1;

    const eventIdParam = idx++;
    values.push(eventId);

    let whereSearch = "";
    if (search) {
      const sParam = idx++;
      values.push(`%${search}%`);
      whereSearch = `
        WHERE (
          COALESCE(d."donorName", '') ILIKE $${sParam}
          OR COALESCE(d."donorExternal", '') ILIKE $${sParam}
          OR COALESCE(d."donorLegal", '') ILIKE $${sParam}
        )
      `;
    }

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
      normalized AS (
        SELECT
          d.id,
          d."at",
          d.gross,
          d.net,
          d."subscriptionId",
          COALESCE(cs.donor_key, COALESCE(d."donorExternal", d."donorLegal", d."donorName", 'UNKNOWN')) AS donor_key,
          COALESCE(cs."donorName", d."donorName") AS "donorName",
          COALESCE(cs."donorEmail", cs."donorExternalAny", d."donorExternal") AS "donorExternal",
          COALESCE(cs."donorLegal", NULLIF(d."donorLegal", '')) AS "donorLegal"
        FROM dedup d
        LEFT JOIN canonical_subs cs ON cs."subscriptionId" = d."subscriptionId"
      ),
      donors AS (
        SELECT
          donor_key,
          MAX("donorName") AS "donorName",
          MAX("donorExternal") AS "donorExternal",
          MAX("donorLegal") AS "donorLegal",
          COUNT(*)::int AS "transactionsCount",
          COUNT(*) FILTER (WHERE "subscriptionId" IS NOT NULL)::int AS "recurringTransactionsCount",
          COALESCE(SUM(gross), 0)::numeric AS "grossTotal",
          COALESCE(SUM(net), 0)::numeric AS "netTotal",
          MAX("at") AS "lastDonationAt",
          MIN("at") AS "firstDonationAt",
          BOOL_OR("subscriptionId" IS NOT NULL) AS "hasRecurring",
          COUNT(DISTINCT "subscriptionId") FILTER (WHERE "subscriptionId" IS NOT NULL)::int AS "recurringSubscriptions"
        FROM normalized
        GROUP BY donor_key
      )
      SELECT
        d.*,
        (
          SELECT COUNT(*)::int
          FROM donors d2
          ${whereSearch.replace(/d\./g, "d2.")}
        ) AS "totalCount"
      FROM donors d
      ${whereSearch}
      ORDER BY d."netTotal" DESC, d."lastDonationAt" DESC
      LIMIT $${limitParam}
      OFFSET $${offsetParam};
    `;

    const rows = await sql(query, values);

    const totalCount = rows?.[0]?.totalCount ?? 0;

    const donors = rows.map((r) => ({
      donorKey: r.donor_key,
      donorName: r.donorName,
      donorExternal: r.donorExternal,
      donorLegal: r.donorLegal,
      transactionsCount: Number(r.transactionsCount || 0),
      recurringTransactionsCount: Number(r.recurringTransactionsCount || 0),
      grossTotal: Number(r.grossTotal || 0),
      netTotal: Number(r.netTotal || 0),
      firstDonationAt: r.firstDonationAt,
      lastDonationAt: r.lastDonationAt,
      hasRecurring: Boolean(r.hasRecurring),
      recurringSubscriptions: Number(r.recurringSubscriptions || 0),
    }));

    return Response.json({
      donors,
      page: { limit, offset, totalCount: Number(totalCount || 0) },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Could not load donors" }, { status: 500 });
  }
}
