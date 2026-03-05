import sql from "@/app/api/utils/sql";

function clampInt(value, { min, max, fallback }) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, parsed));
}

// Program investors list.
// Chain:
// EventTicket.orderId -> Order.aquisitionTransactionId -> DonationTransaction (seed)
// Recorrência: todas as DonationTransaction CONFIRMED com o mesmo subscriptionId.
// Categoria: TicketType (atribuída pela compra inicial do subscriptionId).
export async function GET(request, { params: { organizationId, eventId } }) {
  try {
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
          COALESCE(i."investorName", '') ILIKE $${sParam}
          OR COALESCE(i."investorExternal", '') ILIKE $${sParam}
          OR COALESCE(i."investorLegal", '') ILIKE $${sParam}
          OR COALESCE(i.category, '') ILIKE $${sParam}
          OR COALESCE(i.investor_key, '') ILIKE $${sParam}
        )
      `;
    }

    const limitParam = idx++;
    values.push(limit);

    const offsetParam = idx++;
    values.push(offset);

    const query = `
      WITH tickets AS (
        SELECT
          et."orderId" AS order_id,
          et."eventTicketTypeId" AS ticket_type_id
        FROM public."EventTicket" et
        WHERE et."eventId" = $${eventIdParam}
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
          dt."donationTransactionValue"::numeric AS gross,
          dt."donationTransactionNetValue"::numeric AS net,
          dt."debitPartyPersonLegalName" AS "investorName",
          LOWER(dt."debitPartyExternalUserIdentifier") AS "investorExternal",
          dt."debitPartyPersonLegalIdNumber" AS "investorLegal",
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
          dt."donationTransactionValue"::numeric AS gross,
          dt."donationTransactionNetValue"::numeric AS net,
          dt."debitPartyPersonLegalName" AS "investorName",
          LOWER(dt."debitPartyExternalUserIdentifier") AS "investorExternal",
          dt."debitPartyPersonLegalIdNumber" AS "investorLegal",
          dt."subscriptionId" AS "subscriptionId",
          sm.ticket_type_id
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
          "investorName",
          "investorExternal",
          "investorLegal",
          "subscriptionId",
          ticket_type_id
        FROM all_tx
        ORDER BY id
      ),
      canonical_subs AS (
        SELECT
          "subscriptionId",
          COALESCE(
            NULLIF(MAX(NULLIF("investorLegal", '')), ''),
            NULLIF(MAX(CASE WHEN COALESCE("investorExternal", '') LIKE '%@%' THEN "investorExternal" END), ''),
            NULLIF(MAX(NULLIF("investorExternal", '')), ''),
            NULLIF(MAX(NULLIF("investorName", '')), ''),
            'UNKNOWN'
          ) AS investor_key,
          MAX("investorName") AS "investorName",
          MAX(CASE WHEN COALESCE("investorExternal", '') LIKE '%@%' THEN "investorExternal" END) AS "investorEmail",
          MAX(NULLIF("investorLegal", '')) AS "investorLegal",
          MAX(NULLIF("investorExternal", '')) AS "investorExternalAny"
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
          COALESCE(cs.investor_key, COALESCE(d."investorExternal", d."investorLegal", d."investorName", 'UNKNOWN')) AS investor_key,
          COALESCE(cs."investorName", d."investorName") AS "investorName",
          COALESCE(cs."investorEmail", cs."investorExternalAny", d."investorExternal") AS "investorExternal",
          COALESCE(cs."investorLegal", NULLIF(d."investorLegal", '')) AS "investorLegal"
        FROM dedup d
        LEFT JOIN canonical_subs cs ON cs."subscriptionId" = d."subscriptionId"
      ),
      investor_type_agg AS (
        SELECT
          investor_key,
          ticket_type_id,
          COALESCE(SUM(net), 0)::numeric AS net_total
        FROM normalized
        GROUP BY investor_key, ticket_type_id
      ),
      investor_primary_type AS (
        SELECT DISTINCT ON (investor_key)
          investor_key,
          ticket_type_id
        FROM investor_type_agg
        ORDER BY investor_key, net_total DESC
      ),
      investors AS (
        SELECT
          n.investor_key,
          MAX(n."investorName") AS "investorName",
          MAX(n."investorExternal") AS "investorExternal",
          MAX(n."investorLegal") AS "investorLegal",
          COUNT(*)::int AS "transactionsCount",
          COUNT(*) FILTER (WHERE n."subscriptionId" IS NOT NULL)::int AS "recurringTransactionsCount",
          COUNT(DISTINCT n."subscriptionId") FILTER (WHERE n."subscriptionId" IS NOT NULL)::int AS "recurringSubscriptions",
          COALESCE(SUM(n.gross), 0)::numeric AS "grossTotal",
          COALESCE(SUM(n.net), 0)::numeric AS "netTotal",
          MAX(n."at") AS "lastPaymentAt",
          MIN(n."at") AS "investmentAt",
          BOOL_OR(n."subscriptionId" IS NOT NULL) AS "hasRecurring"
        FROM normalized n
        GROUP BY n.investor_key
      ),
      investors_joined AS (
        SELECT
          i.*,
          ett.name AS category
        FROM investors i
        LEFT JOIN investor_primary_type ipt ON ipt.investor_key = i.investor_key
        LEFT JOIN public."EventTicketType" ett ON ett."eventTicketTypeId" = ipt.ticket_type_id
      )
      SELECT
        i.investor_key,
        i."investorName",
        i."investorExternal",
        i."investorLegal",
        i."transactionsCount",
        i."recurringTransactionsCount",
        i."recurringSubscriptions",
        i."grossTotal",
        i."netTotal",
        i."lastPaymentAt",
        i."investmentAt",
        i."hasRecurring",
        i.category,
        COUNT(*) OVER()::int AS "totalCount"
      FROM investors_joined i
      ${whereSearch}
      ORDER BY i."lastPaymentAt" DESC, i."netTotal" DESC
      LIMIT $${limitParam}
      OFFSET $${offsetParam};
    `;

    const rows = await sql(query, values);
    const totalCount = rows?.[0]?.totalCount ?? 0;

    const investors = (rows || []).map((r) => {
      const external = r.investorExternal || "";
      const investorEmail = external.includes("@") ? external : null;
      return {
        investorKey: r.investor_key,
        investorName: r.investorName,
        investorExternal: r.investorExternal,
        investorLegal: r.investorLegal,
        category: r.category,
        transactionsCount: Number(r.transactionsCount || 0),
        recurringTransactionsCount: Number(r.recurringTransactionsCount || 0),
        recurringSubscriptions: Number(r.recurringSubscriptions || 0),
        grossTotal: Number(r.grossTotal || 0),
        netTotal: Number(r.netTotal || 0),
        hasRecurring: Boolean(r.hasRecurring),
        investmentAt: r.investmentAt,
        lastPaymentAt: r.lastPaymentAt,
        investorEmail,
      };
    });

    return Response.json({
      investors,
      page: { limit, offset, totalCount: Number(totalCount || 0) },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not load investors" },
      { status: 500 },
    );
  }
}
