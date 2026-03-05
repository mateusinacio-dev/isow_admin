import {
  getYearlyByCategory,
  getProgramPayments,
  getProgramPaymentsByYear,
} from "../queries/programQueries.js";
import { getRelatedEvents } from "../queries/eventQueries.js";
import {
  processProgramCharts,
  processProgramProjections,
  processRelatedEvents,
} from "../processors/programProcessor.js";

export async function buildProgramDashboard(event, eventId, organizationId) {
  const eventTypeUpper = String(event?.eventTypeName || "").toUpperCase();
  const isProgram =
    eventTypeUpper === "STOCKS" || eventTypeUpper === "CROWDFUNDING";

  if (!isProgram) {
    return null;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentYearStart = new Date(currentYear, 0, 1);
  const currentYearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

  const yearlyByCategory = await getYearlyByCategory(eventId);
  const { categoryMeta, years, stackedYearRows } =
    processProgramCharts(yearlyByCategory);

  // KPIs for current year include projection
  const programPayments = await getProgramPayments(
    eventId,
    currentYearStart,
    currentYearEnd,
  );
  const { kpis } = processProgramProjections(programPayments, currentYear);

  // KPIs by year (paid only) so the 4 KPI cards can switch between years
  const minYear = years.length
    ? Math.min(...years.map((y) => Number(y)))
    : currentYear;
  const minYearStart = new Date(minYear, 0, 1);
  const kpisByYearRows = await getProgramPaymentsByYear(
    eventId,
    minYearStart,
    currentYearEnd,
  );

  const relatedEvents = await getRelatedEvents(
    organizationId,
    eventId,
    event.projectId,
  );
  const { futureEvents, pastEvents } = processRelatedEvents(relatedEvents);

  return {
    currentYear,
    kpis,
    kpisByYear: (kpisByYearRows || []).map((r) => ({
      year: Number(r.year),
      grossPaid: Number(r.gross_paid || 0),
      netPaid: Number(r.net_paid || 0),
      bankFeePaid: Number(r.bank_fee_paid || 0),
      isowFeePaid: Number(r.isow_fee_paid || 0),
      investorsPaid: Number(r.investors_paid || 0),
      recurringSubsPaid: Number(r.recurring_subs_paid || 0),
    })),
    charts: {
      categories: categoryMeta,
      years,
      stackedYearRows,
    },
    relatedEvents: {
      future: futureEvents,
      past: pastEvents,
    },
  };
}
