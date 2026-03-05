import sql from "@/app/api/utils/sql";
import {
  isProgramEventTypeName,
  normalizeInvestorCategoryName,
} from "@/app/api/admin/utils/programTicketTypes";

function safeParseJson(value) {
  if (!value) {
    return null;
  }
  if (typeof value === "object") {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function daysBetween(a, b) {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export async function POST(request, { params: { organizationId, eventId } }) {
  try {
    const rows = await sql`
      SELECT
        e."eventId",
        e."organizationId",
        e.status,
        e.name,
        e."startDate",
        e."endDate",
        e."publishingDate",
        e."adminConfig",
        e."relatedProgramEventId",
        ety.name AS "eventTypeName"
      FROM public."Event" e
      LEFT JOIN public."EventType" ety
        ON ety."eventTypeId" = e."eventTypeId"
      WHERE e."eventId" = ${eventId}
        AND e."organizationId" = ${organizationId}
        AND e."deletedAt" IS NULL
      LIMIT 1
    `;

    const event = rows?.[0] || null;
    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    const config = safeParseJson(event.adminConfig) || {};

    const ticketing = config.ticketing || {};
    const isFree = Boolean(ticketing.isFree);
    const categories = Array.isArray(ticketing.categories)
      ? ticketing.categories
      : [];

    // Program-linked auto allocation settings (optional)
    const programId = event.relatedProgramEventId || null;
    const allocationCfg = ticketing?.programAllocation || null;
    const allocationEnabled =
      Boolean(programId) && allocationCfg?.enabled !== false;

    // Basic validations
    if (!event.name) {
      return Response.json({ error: "Missing name" }, { status: 400 });
    }
    if (!event.startDate || !event.endDate) {
      return Response.json(
        { error: "Missing start/end date" },
        { status: 400 },
      );
    }

    // If already published, do not regenerate tickets.
    if (String(event.status || "").toUpperCase() === "PUBLISHED") {
      return Response.json({ ok: true, alreadyPublished: true });
    }

    const publishDate = event.publishingDate || new Date().toISOString();

    const publishResult = await sql.transaction(async (txn) => {
      // Ensure a cluster exists (EventTicket requires eventTicketClusterId).
      const existingCluster = await txn`
        SELECT "eventTicketClusterId"
        FROM public."EventTicketCluster"
        WHERE "eventId" = ${eventId}
          AND "deletedAt" IS NULL
        ORDER BY "createdAt" ASC
        LIMIT 1
      `;

      let clusterId = existingCluster?.[0]?.eventTicketClusterId || null;

      if (!clusterId) {
        const clRows = await txn`
          INSERT INTO public."EventTicketCluster" (
            "eventId",
            name,
            number
          ) VALUES (
            ${eventId},
            'Geral',
            '1'
          )
          RETURNING "eventTicketClusterId"
        `;
        clusterId = clRows?.[0]?.eventTicketClusterId || null;
      }

      if (!clusterId) {
        throw new Error("Could not create ticket cluster");
      }

      let createdTicketTypeId = null;

      // Ensure at least one ticket type.
      if (isFree) {
        const total = Number(ticketing.ticketsTotal || 0);
        if (!Number.isFinite(total) || total <= 0) {
          throw new Error(
            "For free events, ticketing.ticketsTotal must be > 0",
          );
        }

        const ttRows = await txn`
          INSERT INTO public."EventTicketType" (
            "eventId",
            name,
            "fullPrice"
          ) VALUES (
            ${eventId},
            'GERAL',
            0
          )
          RETURNING "eventTicketTypeId"
        `;

        const ticketTypeId = ttRows?.[0]?.eventTicketTypeId;
        if (!ticketTypeId) {
          throw new Error("Could not create ticket type");
        }

        createdTicketTypeId = ticketTypeId;

        // Generate tickets
        for (let i = 1; i <= total; i += 1) {
          const ticketNumber = String(i).padStart(6, "0");
          await txn`
            INSERT INTO public."EventTicket" (
              "eventId",
              "eventTicketTypeId",
              "eventTicketClusterId",
              "ticketNumber",
              status
            ) VALUES (
              ${eventId},
              ${ticketTypeId},
              ${clusterId},
              ${ticketNumber},
              'AVAILABLE'
            )
          `;
        }
      } else {
        if (categories.length === 0) {
          throw new Error("Paid events must have at least one ticket category");
        }

        let globalCounter = 1;

        for (const cat of categories) {
          const catName = cat?.name ? String(cat.name).trim() : "";
          const qtty = Number(cat?.quantity || 0);
          const price = Number(cat?.price || 0);

          if (!catName) {
            throw new Error("Ticket category missing name");
          }
          if (!Number.isFinite(qtty) || qtty <= 0) {
            throw new Error(
              `Ticket category [${catName}] quantity must be > 0`,
            );
          }
          if (!Number.isFinite(price) || price < 0) {
            throw new Error(`Ticket category [${catName}] price invalid`);
          }

          const ttRows = await txn`
            INSERT INTO public."EventTicketType" (
              "eventId",
              name,
              "fullPrice"
            ) VALUES (
              ${eventId},
              ${catName},
              ${price}
            )
            RETURNING "eventTicketTypeId"
          `;

          const ticketTypeId = ttRows?.[0]?.eventTicketTypeId;
          if (!ticketTypeId) {
            throw new Error("Could not create ticket type");
          }

          for (let i = 0; i < qtty; i += 1) {
            const ticketNumber = String(globalCounter).padStart(6, "0");
            globalCounter += 1;
            await txn`
              INSERT INTO public."EventTicket" (
                "eventId",
                "eventTicketTypeId",
                "eventTicketClusterId",
                "ticketNumber",
                status
              ) VALUES (
                ${eventId},
                ${ticketTypeId},
                ${clusterId},
                ${ticketNumber},
                'AVAILABLE'
              )
            `;
          }
        }
      }

      // NEW: auto-allocate tickets for program investors
      let allocationSummary = null;

      if (allocationEnabled && createdTicketTypeId) {
        const allocations = Array.isArray(allocationCfg?.perCategory)
          ? allocationCfg.perCategory
          : [];

        const allocationMap = new Map();
        for (const a of allocations) {
          const key = normalizeInvestorCategoryName(a?.categoryName);
          if (!key) {
            continue;
          }
          allocationMap.set(key, Number(a?.ticketsPerInvestor || 0) || 0);
        }

        // Load investors for the program (based on the program's own orders/tickets)
        const investorRows = await txn`
          WITH tickets AS (
            SELECT
              et."orderId" AS order_id,
              et."eventTicketTypeId" AS ticket_type_id
            FROM public."EventTicket" et
            WHERE et."eventId" = ${programId}
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
            ij.investor_key,
            ij."investorName",
            ij."investorExternal",
            ij."investorLegal",
            ij."lastPaymentAt",
            ij."investmentAt",
            ij."hasRecurring",
            ij.category,
            u."userId" AS "userId"
          FROM investors_joined ij
          LEFT JOIN public."User" u
            ON (
              (u."legalIdNumber" IS NOT NULL AND ij."investorLegal" IS NOT NULL AND u."legalIdNumber" = ij."investorLegal")
              OR (u.email IS NOT NULL AND ij."investorExternal" IS NOT NULL AND LOWER(u.email) = LOWER(ij."investorExternal"))
            )
            AND u."deletedAt" IS NULL
          ORDER BY COALESCE(ij."investorName", '') ASC
        `;

        const referenceDate = new Date(event.startDate);

        const eligible = [];
        const skipped = {
          noUser: 0,
          noCategoryMatch: 0,
          expired: 0,
        };

        for (const r of investorRows || []) {
          const userId = r.userId || null;
          if (!userId) {
            skipped.noUser += 1;
            continue;
          }

          const catKey = normalizeInvestorCategoryName(r.category);
          const perInvestor = allocationMap.get(catKey) || 0;
          if (!perInvestor || perInvestor <= 0) {
            skipped.noCategoryMatch += 1;
            continue;
          }

          const lastPaymentAt = r.lastPaymentAt
            ? new Date(r.lastPaymentAt)
            : null;
          if (!lastPaymentAt) {
            skipped.expired += 1;
            continue;
          }

          const hasRecurring = Boolean(r.hasRecurring);
          let ok = true;
          if (hasRecurring) {
            const d = daysBetween(referenceDate, lastPaymentAt);
            ok = d <= 60;
          } else {
            const expires = new Date(lastPaymentAt);
            expires.setFullYear(expires.getFullYear() + 1);
            ok = expires.getTime() >= referenceDate.getTime();
          }

          if (!ok) {
            skipped.expired += 1;
            continue;
          }

          eligible.push({
            userId,
            investorKey: r.investor_key,
            investorName: r.investorName,
            category: r.category,
            perInvestor,
          });
        }

        // Load all available tickets and allocate sequentially.
        const availableTickets = await txn`
          SELECT "eventTicketId", "ticketNumber"
          FROM public."EventTicket"
          WHERE "eventId" = ${eventId}
            AND "deletedAt" IS NULL
            AND status = 'AVAILABLE'
          ORDER BY "ticketNumber" ASC
          FOR UPDATE
        `;

        let cursor = 0;
        let assigned = 0;
        let investorsWithTickets = 0;

        for (const inv of eligible) {
          const needed = inv.perInvestor;
          if (needed <= 0) {
            continue;
          }

          const remaining = (availableTickets || []).length - cursor;
          if (remaining <= 0) {
            break;
          }

          const give = Math.min(needed, remaining);
          if (give <= 0) {
            continue;
          }

          investorsWithTickets += 1;

          for (let i = 0; i < give; i += 1) {
            const t = availableTickets[cursor];
            cursor += 1;

            await txn`
              UPDATE public."EventTicket"
              SET status = 'SOLD', "updatedAt" = CURRENT_TIMESTAMP
              WHERE "eventTicketId" = ${t.eventTicketId}
            `;

            await txn`
              INSERT INTO public."EventAttendee" (
                "eventId",
                "eventTicketId",
                "buyerUserId",
                "attendeeUserId",
                "creationDate"
              ) VALUES (
                ${eventId},
                ${t.eventTicketId},
                ${inv.userId},
                ${i === 0 ? inv.userId : null},
                CURRENT_TIMESTAMP
              )
            `;

            assigned += 1;
          }
        }

        allocationSummary = {
          enabled: true,
          investorsEligible: eligible.length,
          investorsWithTickets,
          ticketsAssigned: assigned,
          skipped,
          ticketsRemaining: (availableTickets || []).length - cursor,
        };
      }

      // NEW: ensure only one active program per ONG (when publishing a program)
      const eventTypeName = String(event.eventTypeName || "").toUpperCase();
      if (isProgramEventTypeName(eventTypeName)) {
        await txn`
          UPDATE public."Event" e2
          SET status = 'PRIVATE', "updatedAt" = CURRENT_TIMESTAMP
          FROM public."EventType" et2
          WHERE e2."eventTypeId" = et2."eventTypeId"
            AND e2."organizationId" = ${organizationId}
            AND e2."deletedAt" IS NULL
            AND e2."eventId" <> ${eventId}
            AND UPPER(et2.name) IN ('STOCKS','CROWDFUNDING')
            AND e2.status IN ('PUBLISHED','STARTED')
        `;
      }

      await txn`
        UPDATE public."Event"
        SET
          status = 'PUBLISHED',
          "publishingDate" = ${publishDate},
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE "eventId" = ${eventId}
      `;

      return { ok: true, allocation: allocationSummary };
    });

    return Response.json(publishResult);
  } catch (error) {
    console.error(error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not publish event",
      },
      { status: 500 },
    );
  }
}
