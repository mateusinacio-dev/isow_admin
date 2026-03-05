import { getEventById } from "./queries/eventQueries.js";
import {
  getTicketStatus,
  getTicketTypes,
  getTicketClusters,
} from "./queries/ticketQueries.js";
import {
  getDonationAggregates,
  getQuotaAggregates,
  getLast30DaysData,
} from "./queries/donationQueries.js";
import { processQuotaAggregates } from "./processors/quotaProcessor.js";
import { buildProgramDashboard } from "./services/programDashboardService.js";

export async function GET(request, { params: { organizationId, eventId } }) {
  try {
    const event = await getEventById(eventId, organizationId);

    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    const ticketStatus = await getTicketStatus(eventId);
    const ticketTypes = await getTicketTypes(eventId);
    const ticketClusters = await getTicketClusters(eventId);

    const summary = await getDonationAggregates(eventId);
    const quotaAgg = await getQuotaAggregates(eventId);

    const { quotaByTicketType, quotaByCluster } = processQuotaAggregates(
      quotaAgg,
      ticketTypes,
      ticketClusters,
    );

    const last30Days = await getLast30DaysData(eventId);

    let programDashboard = null;
    try {
      programDashboard = await buildProgramDashboard(
        event,
        eventId,
        organizationId,
      );
    } catch (dashErr) {
      console.error("buildProgramDashboard failed (non-fatal)", dashErr);
    }

    return Response.json({
      event,
      ticketStatus,
      ticketTypes,
      ticketClusters,
      quotaByTicketType,
      quotaByCluster,
      financial: {
        transactionsCount: Number(summary.transactionsCount || 0),
        donorsCount: Number(summary.donorsCount || 0),
        grossTotal: Number(summary.grossTotal || 0),
        netTotal: Number(summary.netTotal || 0),
        recurringSubscriptions: Number(summary.recurringSubscriptions || 0),
        recurringTransactions: Number(summary.recurringTransactions || 0),
      },
      netLast30Days: last30Days.map((r) => ({
        day: r.day,
        total: Number(r.total || 0),
      })),
      programDashboard,
      attribution: {
        notes:
          "Totais usam a cadeia EventTicket -> Order -> DonationTransaction e, para recorrência, incluem todas as parcelas da mesma subscriptionId. KPIs por cota atribuem recorrência ao tipo/cluster da compra inicial.",
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not load event summary" },
      { status: 500 },
    );
  }
}
