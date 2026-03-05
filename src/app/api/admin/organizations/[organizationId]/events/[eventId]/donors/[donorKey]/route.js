import sql from "@/app/api/utils/sql";

function clampInt(value, { min, max, fallback }) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, parsed));
}

export async function GET(
  request,
  { params: { organizationId, eventId, donorKey } },
) {
  try {
    const decodedDonorKey = decodeURIComponent(String(donorKey || ""));

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

    const limit = clampInt(url.searchParams.get("limit"), {
      min: 10,
      max: 500,
      fallback: 200,
    });

    const offset = clampInt(url.searchParams.get("offset"), {
      min: 0,
      max: 100000,
      fallback: 0,
    });

    // Thresholds (same rule as SubscriptionsTable)
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

    const values = [];
    let idx = 1;

    const donorKeyParam = idx++;
    values.push(decodedDonorKey);

    const eventIdParam = idx++;
    values.push(eventId);

    const atRiskParam = idx++;
    values.push(atRiskDays);

    const churnParam = idx++;
    values.push(churnDays);

    const delinquentParam = idx++;
    values.push(delinquentDays);

    const limitParam = idx++;
    values.push(limit);

    const offsetParam = idx++;
    values.push(offset);

    const query = `
      WITH seed_tickets AS (
        SELECT
          et."orderId" AS "orderId",
          et."eventTicketTypeId" AS "ticketTypeId",
          et."eventTicketClusterId" AS "clusterId"
        FROM public."EventTicket" et
        WHERE et."eventId" = $${eventIdParam}
          AND et."deletedAt" IS NULL
          AND et."orderId" IS NOT NULL
      ),
      seed_orders AS (
        SELECT DISTINCT "orderId" AS order_id
        FROM seed_tickets
      ),
      seed_tx AS (
        SELECT
          o."orderId" AS "orderId",
          dt."donationTransactionId" AS id,
          dt."acquirerTransactionDate" AS "at",
          dt."acquirerTransactionType" AS "acquirerType",
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
        SELECT
          st."orderId" AS "orderId",
          st.id,
          st."at",
          st."acquirerType",
          st.gross,
          st.net,
          st."donorName",
          st."donorExternal",
          st."donorLegal",
          st."subscriptionId"
        FROM seed_tx st

        UNION ALL

        SELECT
          NULL::uuid AS "orderId",
          dt."donationTransactionId" AS id,
          dt."acquirerTransactionDate" AS "at",
          dt."acquirerTransactionType" AS "acquirerType",
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
          "orderId",
          id,
          "at",
          "acquirerType",
          gross,
          net,
          "donorName",
          "donorExternal",
          "donorLegal",
          "subscriptionId"
        FROM all_tx
        -- Prefer keeping the seed (order-linked) row when the same donationTransactionId appears twice
        ORDER BY id, ("orderId" IS NULL) ASC
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
          d."orderId",
          d.id,
          d."at",
          d."acquirerType",
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
      donor_tx AS (
        SELECT *
        FROM normalized
        WHERE donor_key = $${donorKeyParam}
      ),
      donor_orders AS (
        SELECT DISTINCT "orderId"
        FROM donor_tx
        WHERE "orderId" IS NOT NULL
      ),
      donor_profile AS (
        SELECT
          MAX("donorName") AS "donorName",
          MAX("donorExternal") AS "donorExternal",
          MAX("donorLegal") AS "donorLegal",
          MIN("at") AS "firstDonationAt",
          MAX("at") AS "lastDonationAt",
          COUNT(*)::int AS "transactionsCount",
          COUNT(*) FILTER (WHERE "subscriptionId" IS NOT NULL)::int AS "recurringTransactionsCount",
          COUNT(DISTINCT "subscriptionId") FILTER (WHERE "subscriptionId" IS NOT NULL)::int AS "subscriptionsCount",
          COUNT(DISTINCT "orderId") FILTER (WHERE "orderId" IS NOT NULL)::int AS "ordersCount",
          COALESCE(SUM(gross), 0)::numeric AS "grossTotal",
          COALESCE(SUM(net), 0)::numeric AS "netTotal"
        FROM donor_tx
      ),
      subs AS (
        SELECT
          "subscriptionId"::text AS "subscriptionId",
          COUNT(*)::int AS "installments",
          COALESCE(SUM(net), 0)::numeric AS "netTotal",
          MIN("at") AS "firstChargeAt",
          MAX("at") AS "lastChargeAt",
          EXTRACT(day FROM (NOW() - MAX("at")))::int AS "daysSinceLastCharge",
          CASE
            WHEN EXTRACT(day FROM (NOW() - MAX("at")))::int >= $${delinquentParam} THEN 'INADIMPLENTE'
            WHEN EXTRACT(day FROM (NOW() - MAX("at")))::int >= $${churnParam} THEN 'CHURN'
            WHEN EXTRACT(day FROM (NOW() - MAX("at")))::int >= $${atRiskParam} THEN 'AT_RISK'
            ELSE 'ACTIVE'
          END AS "churnStatus"
        FROM donor_tx
        WHERE "subscriptionId" IS NOT NULL
        GROUP BY "subscriptionId"
        ORDER BY MAX("at") DESC
      ),
      ticket_breakdown AS (
        SELECT
          st."ticketTypeId" AS "ticketTypeId",
          st."clusterId" AS "clusterId",
          COUNT(*)::int AS "ticketsCount",
          COUNT(DISTINCT st."orderId")::int AS "ordersCount"
        FROM seed_tickets st
        -- rename alias from "do" (reserved) to "dor"
        JOIN donor_orders dor ON dor."orderId" = st."orderId"
        GROUP BY st."ticketTypeId", st."clusterId"
      )
      SELECT
        (SELECT row_to_json(dp) FROM donor_profile dp) AS profile,
        (SELECT COALESCE(json_agg(s), '[]'::json) FROM subs s) AS subscriptions,
        (
          SELECT COALESCE(json_agg(t ORDER BY t."acquirerTransactionDate" DESC), '[]'::json)
          FROM (
            SELECT
              "orderId",
              id AS "donationTransactionId",
              "at" AS "acquirerTransactionDate",
              "acquirerType" AS "acquirerTransactionType",
              gross AS "gross",
              net AS "net",
              "subscriptionId"::text AS "subscriptionId"
            FROM donor_tx
            ORDER BY "at" DESC
            LIMIT $${limitParam}
            OFFSET $${offsetParam}
          ) t
        ) AS transactions,
        (
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'ticketTypeId', tb."ticketTypeId",
                'ticketTypeName', ett.name,
                'clusterId', tb."clusterId",
                'clusterName', etc.name,
                'ticketsCount', tb."ticketsCount",
                'ordersCount', tb."ordersCount"
              )
              ORDER BY tb."ticketsCount" DESC
            ),
            '[]'::json
          )
          FROM ticket_breakdown tb
          LEFT JOIN public."EventTicketType" ett ON ett."eventTicketTypeId" = tb."ticketTypeId"
          LEFT JOIN public."EventTicketCluster" etc ON etc."eventTicketClusterId" = tb."clusterId"
        ) AS tickets;
    `;

    const [row] = await sql(query, values);

    const profile = row?.profile || null;
    if (!profile) {
      return Response.json(
        { error: "Donor not found for this event" },
        { status: 404 },
      );
    }

    return Response.json({
      donorKey: decodedDonorKey,
      profile,
      subscriptions: row?.subscriptions || [],
      transactions: row?.transactions || [],
      tickets: row?.tickets || [],
      meta: { limit, offset, churnDays, atRiskDays, delinquentDays },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not load donor details" },
      { status: 500 },
    );
  }
}
