import sql from "@/app/api/utils/sql";

export async function getDonationAggregates(eventId) {
  const donationAgg = await sql`
    WITH seed_orders AS (
      SELECT DISTINCT et."orderId" AS order_id
      FROM public."EventTicket" et
      WHERE et."eventId" = ${eventId}
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
        ) AS donor_key
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
        COALESCE(cs.donor_key, COALESCE(d."donorExternal", d."donorLegal", d."donorName", 'UNKNOWN')) AS donor_key
      FROM dedup d
      LEFT JOIN canonical_subs cs ON cs."subscriptionId" = d."subscriptionId"
    )
    SELECT
      COUNT(*)::int AS "transactionsCount",
      COUNT(DISTINCT donor_key)::int AS "donorsCount",
      COALESCE(SUM(gross), 0)::numeric AS "grossTotal",
      COALESCE(SUM(net), 0)::numeric AS "netTotal",
      COUNT(DISTINCT "subscriptionId") FILTER (WHERE "subscriptionId" IS NOT NULL)::int AS "recurringSubscriptions",
      COUNT(*) FILTER (WHERE "subscriptionId" IS NOT NULL)::int AS "recurringTransactions"
    FROM normalized;
  `;

  return (
    donationAgg?.[0] || {
      transactionsCount: 0,
      donorsCount: 0,
      grossTotal: 0,
      netTotal: 0,
      recurringSubscriptions: 0,
      recurringTransactions: 0,
    }
  );
}

export async function getQuotaAggregates(eventId) {
  return await sql`
    WITH tickets AS (
      SELECT
        et."orderId" AS order_id,
        et."eventTicketTypeId" AS ticket_type_id,
        et."eventTicketClusterId" AS cluster_id
      FROM public."EventTicket" et
      WHERE et."eventId" = ${eventId}
        AND et."deletedAt" IS NULL
        AND et."orderId" IS NOT NULL
    ),
    order_quota AS (
      SELECT
        t.order_id,
        (MIN(t.ticket_type_id::text))::uuid AS ticket_type_id,
        (MIN(t.cluster_id::text))::uuid AS cluster_id
      FROM tickets t
      GROUP BY t.order_id
    ),
    seed_tx AS (
      SELECT
        dt."donationTransactionId" AS id,
        dt."acquirerTransactionDate" AS "at",
        dt."donationTransactionValue"::numeric AS gross,
        dt."donationTransactionNetValue"::numeric AS net,
        LOWER(dt."debitPartyExternalUserIdentifier") AS "donorExternal",
        dt."debitPartyPersonLegalIdNumber" AS "donorLegal",
        dt."debitPartyPersonLegalName" AS "donorName",
        dt."subscriptionId" AS "subscriptionId",
        oq.ticket_type_id,
        oq.cluster_id
      FROM public."Order" o
      JOIN order_quota oq ON oq.order_id = o."orderId"
      JOIN public."DonationTransaction" dt
        ON dt."donationTransactionId" = o."aquisitionTransactionId"
        AND dt."deletedAt" IS NULL
      WHERE o."deletedAt" IS NULL
        AND dt.status = 'CONFIRMED'
    ),
    sub_map AS (
      SELECT DISTINCT "subscriptionId", ticket_type_id, cluster_id
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
        LOWER(dt."debitPartyExternalUserIdentifier") AS "donorExternal",
        dt."debitPartyPersonLegalIdNumber" AS "donorLegal",
        dt."debitPartyPersonLegalName" AS "donorName",
        dt."subscriptionId" AS "subscriptionId",
        sm.ticket_type_id,
        sm.cluster_id
      FROM public."DonationTransaction" dt
      JOIN sub_map sm ON sm."subscriptionId" = dt."subscriptionId"
      WHERE dt."deletedAt" IS NULL
        AND dt.status = 'CONFIRMED'
    ),
    dedup AS (
      SELECT DISTINCT ON (id)
        id,
        "at",
        gross,
        net,
        "subscriptionId",
        ticket_type_id,
        cluster_id,
        "donorExternal",
        "donorLegal",
        "donorName"
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
        ) AS donor_key
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
        d.ticket_type_id,
        d.cluster_id,
        COALESCE(cs.donor_key, COALESCE(d."donorExternal", d."donorLegal", d."donorName", 'UNKNOWN')) AS donor_key
      FROM dedup d
      LEFT JOIN canonical_subs cs ON cs."subscriptionId" = d."subscriptionId"
    ),
    type_agg AS (
      SELECT
        ticket_type_id AS id,
        COUNT(*)::int AS "transactionsCount",
        COUNT(DISTINCT donor_key)::int AS "donorsCount",
        COALESCE(SUM(gross), 0)::numeric AS "grossTotal",
        COALESCE(SUM(net), 0)::numeric AS "netTotal",
        COUNT(DISTINCT "subscriptionId") FILTER (WHERE "subscriptionId" IS NOT NULL)::int AS "recurringSubscriptions",
        COUNT(*) FILTER (WHERE "subscriptionId" IS NOT NULL)::int AS "recurringTransactions",
        MAX("at") AS "lastChargeAt"
      FROM normalized
      GROUP BY ticket_type_id
    ),
    cluster_agg AS (
      SELECT
        cluster_id AS id,
        COUNT(*)::int AS "transactionsCount",
        COUNT(DISTINCT donor_key)::int AS "donorsCount",
        COALESCE(SUM(gross), 0)::numeric AS "grossTotal",
        COALESCE(SUM(net), 0)::numeric AS "netTotal",
        COUNT(DISTINCT "subscriptionId") FILTER (WHERE "subscriptionId" IS NOT NULL)::int AS "recurringSubscriptions",
        COUNT(*) FILTER (WHERE "subscriptionId" IS NOT NULL)::int AS "recurringTransactions",
        MAX("at") AS "lastChargeAt"
      FROM normalized
      GROUP BY cluster_id
    )
    SELECT
      'TYPE'::text AS kind,
      t."eventTicketTypeId"::text AS id,
      a."transactionsCount",
      a."donorsCount",
      a."grossTotal",
      a."netTotal",
      a."recurringSubscriptions",
      a."recurringTransactions",
      a."lastChargeAt"
    FROM type_agg a
    JOIN public."EventTicketType" t ON t."eventTicketTypeId" = a.id

    UNION ALL

    SELECT
      'CLUSTER'::text AS kind,
      c."eventTicketClusterId"::text AS id,
      a."transactionsCount",
      a."donorsCount",
      a."grossTotal",
      a."netTotal",
      a."recurringSubscriptions",
      a."recurringTransactions",
      a."lastChargeAt"
    FROM cluster_agg a
    JOIN public."EventTicketCluster" c ON c."eventTicketClusterId" = a.id;
  `;
}

export async function getLast30DaysData(eventId) {
  return await sql`
    WITH seed_orders AS (
      SELECT DISTINCT et."orderId" AS order_id
      FROM public."EventTicket" et
      WHERE et."eventId" = ${eventId}
        AND et."deletedAt" IS NULL
        AND et."orderId" IS NOT NULL
    ),
    seed_tx AS (
      SELECT
        dt."donationTransactionId" AS id,
        dt."acquirerTransactionDate" AS "at",
        dt."donationTransactionNetValue"::numeric AS net,
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
        dt."donationTransactionNetValue"::numeric AS net,
        dt."subscriptionId" AS "subscriptionId"
      FROM public."DonationTransaction" dt
      JOIN seed_subs ss ON ss."subscriptionId" = dt."subscriptionId"
      WHERE dt."deletedAt" IS NULL
        AND dt.status = 'CONFIRMED'
    ),
    dedup AS (
      SELECT DISTINCT ON (id) id, "at", net
      FROM all_tx
      ORDER BY id
    )
    SELECT
      DATE_TRUNC('day', "at")::date AS day,
      COALESCE(SUM(net), 0)::numeric AS total
    FROM dedup
    WHERE "at" >= NOW() - INTERVAL '30 days'
    GROUP BY day
    ORDER BY day ASC;
  `;
}
