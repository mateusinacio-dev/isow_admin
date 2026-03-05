import sql from "@/app/api/utils/sql";

export async function getYearlyByCategory(eventId) {
  return await sql`
    WITH tickets AS (
      SELECT
        et."orderId" AS order_id,
        et."eventTicketTypeId" AS ticket_type_id
      FROM public."EventTicket" et
      WHERE et."eventId" = ${eventId}
        AND et."deletedAt" IS NULL
        AND et."orderId" IS NOT NULL
    ),
    order_quota AS (
      SELECT
        t.order_id,
        (MIN(t.ticket_type_id::text))::uuid AS ticket_type_id
      FROM tickets t
      GROUP BY t.order_id
    ),
    seed_tx AS (
      SELECT
        dt."donationTransactionId" AS id,
        dt."acquirerTransactionDate" AS "at",
        dt."donationTransactionNetValue"::numeric AS net,
        dt."subscriptionId" AS "subscriptionId",
        oq.ticket_type_id
      FROM public."Order" o
      JOIN order_quota oq ON oq.order_id = o."orderId"
      JOIN public."DonationTransaction" dt
        ON dt."donationTransactionId" = o."aquisitionTransactionId"
        AND dt."deletedAt" IS NULL
      WHERE o."deletedAt" IS NULL
        AND dt.status = 'CONFIRMED'
    ),
    sub_map AS (
      SELECT DISTINCT "subscriptionId", ticket_type_id
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
        dt."subscriptionId" AS "subscriptionId",
        sm.ticket_type_id
      FROM public."DonationTransaction" dt
      JOIN sub_map sm ON sm."subscriptionId" = dt."subscriptionId"
      WHERE dt."deletedAt" IS NULL
        AND dt.status = 'CONFIRMED'
    ),
    dedup AS (
      SELECT DISTINCT ON (id) id, "at", net, ticket_type_id
      FROM all_tx
      ORDER BY id
    )
    SELECT
      EXTRACT(year FROM d."at")::int AS year,
      ett.name AS category,
      COALESCE(SUM(d.net), 0)::numeric AS net
    FROM dedup d
    LEFT JOIN public."EventTicketType" ett
      ON ett."eventTicketTypeId" = d.ticket_type_id
    GROUP BY year, ett.name
    ORDER BY year ASC, ett.name ASC;
  `;
}

// New: yearly KPI rollup so the dashboard KPIs can switch between years
export async function getProgramPaymentsByYear(eventId, rangeStart, rangeEnd) {
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
        dt."donationTransactionValue"::numeric AS gross,
        dt."donationTransactionNetValue"::numeric AS net,
        COALESCE(dt."acquirerFeesTotalValue", 0)::numeric AS bank_fee,
        COALESCE(dt."isowFeesTotalValue", 0)::numeric AS isow_fee,
        LOWER(dt."debitPartyExternalUserIdentifier") AS "donorExternal",
        dt."debitPartyPersonLegalIdNumber" AS "donorLegal",
        dt."debitPartyPersonLegalName" AS "donorName",
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
        COALESCE(dt."acquirerFeesTotalValue", 0)::numeric AS bank_fee,
        COALESCE(dt."isowFeesTotalValue", 0)::numeric AS isow_fee,
        LOWER(dt."debitPartyExternalUserIdentifier") AS "donorExternal",
        dt."debitPartyPersonLegalIdNumber" AS "donorLegal",
        dt."debitPartyPersonLegalName" AS "donorName",
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
        bank_fee,
        isow_fee,
        "donorExternal",
        "donorLegal",
        "donorName",
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
        d.bank_fee,
        d.isow_fee,
        d."subscriptionId",
        COALESCE(cs.donor_key, COALESCE(d."donorExternal", d."donorLegal", d."donorName", 'UNKNOWN')) AS donor_key
      FROM dedup d
      LEFT JOIN canonical_subs cs ON cs."subscriptionId" = d."subscriptionId"
    ),
    range_tx AS (
      SELECT *
      FROM normalized
      WHERE "at" >= ${rangeStart.toISOString()}
        AND "at" <= ${rangeEnd.toISOString()}
    )
    SELECT
      EXTRACT(year FROM "at")::int AS year,
      COALESCE(SUM(gross), 0)::numeric AS gross_paid,
      COALESCE(SUM(net), 0)::numeric AS net_paid,
      COALESCE(SUM(bank_fee), 0)::numeric AS bank_fee_paid,
      COALESCE(SUM(isow_fee), 0)::numeric AS isow_fee_paid,
      COUNT(DISTINCT donor_key)::int AS investors_paid,
      COUNT(DISTINCT "subscriptionId") FILTER (WHERE "subscriptionId" IS NOT NULL)::int AS recurring_subs_paid
    FROM range_tx
    GROUP BY EXTRACT(year FROM "at")
    ORDER BY year ASC;
  `;
}

export async function getProgramPayments(
  eventId,
  currentYearStart,
  currentYearEnd,
) {
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
        dt."donationTransactionValue"::numeric AS gross,
        dt."donationTransactionNetValue"::numeric AS net,
        COALESCE(dt."acquirerFeesTotalValue", 0)::numeric AS bank_fee,
        COALESCE(dt."isowFeesTotalValue", 0)::numeric AS isow_fee,
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
        COALESCE(dt."acquirerFeesTotalValue", 0)::numeric AS bank_fee,
        COALESCE(dt."isowFeesTotalValue", 0)::numeric AS isow_fee,
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
        bank_fee,
        isow_fee,
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
        d.bank_fee,
        d.isow_fee,
        d."subscriptionId",
        COALESCE(cs.donor_key, COALESCE(d."donorExternal", d."donorLegal", d."donorName", 'UNKNOWN')) AS donor_key
      FROM dedup d
      LEFT JOIN canonical_subs cs ON cs."subscriptionId" = d."subscriptionId"
    ),
    year_tx AS (
      SELECT *
      FROM normalized
      WHERE "at" >= ${currentYearStart.toISOString()}
        AND "at" <= ${currentYearEnd.toISOString()}
    ),
    subs AS (
      SELECT
        "subscriptionId"::text AS "subscriptionId",
        MAX("at") AS "lastChargeAt",
        (ARRAY_AGG(net ORDER BY "at" DESC))[1] AS "lastNet",
        (ARRAY_AGG(gross ORDER BY "at" DESC))[1] AS "lastGross",
        (ARRAY_AGG(bank_fee ORDER BY "at" DESC))[1] AS "lastBankFee",
        (ARRAY_AGG(isow_fee ORDER BY "at" DESC))[1] AS "lastIsowFee",
        EXTRACT(day FROM (NOW() - MAX("at")))::int AS "daysSinceLastCharge"
      FROM normalized
      WHERE "subscriptionId" IS NOT NULL
      GROUP BY "subscriptionId"
    ),
    year_agg AS (
      SELECT
        COALESCE(SUM(gross), 0)::numeric AS gross_paid,
        COALESCE(SUM(net), 0)::numeric AS net_paid,
        COALESCE(SUM(bank_fee), 0)::numeric AS bank_fee_paid,
        COALESCE(SUM(isow_fee), 0)::numeric AS isow_fee_paid,
        COUNT(DISTINCT donor_key)::int AS investors_paid,
        COUNT(DISTINCT "subscriptionId") FILTER (WHERE "subscriptionId" IS NOT NULL)::int AS recurring_subs_paid
      FROM year_tx
    )
    SELECT
      ya.gross_paid,
      ya.net_paid,
      ya.bank_fee_paid,
      ya.isow_fee_paid,
      ya.investors_paid,
      ya.recurring_subs_paid,
      s."subscriptionId",
      s."lastChargeAt",
      s."lastNet",
      s."lastGross",
      s."lastBankFee",
      s."lastIsowFee",
      s."daysSinceLastCharge"
    FROM year_agg ya
    LEFT JOIN subs s ON TRUE;
  `;
}
