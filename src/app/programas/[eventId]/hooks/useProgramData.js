import { useMemo } from "react";

/**
 * Sort ticket/quota items so that "Minha escolha" variants always appear
 * first. Everything else keeps its original relative order.
 */
function sortTicketItems(items) {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    const aFirst = /minha\s+escolha/i.test(a.name || "");
    const bFirst = /minha\s+escolha/i.test(b.name || "");
    if (aFirst === bFirst) return 0;
    return aFirst ? -1 : 1;
  });
}

export function useProgramData(summary) {
  const eventTypeName = summary?.event?.eventTypeName || "PROGRAMA";
  const programDashboard = summary?.programDashboard || null;
  const programYear = programDashboard?.currentYear || null;

  const stackedYearRows = programDashboard?.charts?.stackedYearRows || [];
  const yearTabs = programDashboard?.charts?.years || [];
  const categoryMeta = programDashboard?.charts?.categories || [];

  const kpisByYear = programDashboard?.kpisByYear || [];

  const title = useMemo(() => {
    const name = summary?.event?.name;
    if (!name) {
      return "Programa";
    }
    return name;
  }, [summary?.event?.name]);

  const ticketStatusMap = useMemo(() => {
    const map = new Map();
    for (const row of summary?.ticketStatus || []) {
      map.set(row.status, row.count);
    }
    return map;
  }, [summary?.ticketStatus]);

  const sold = ticketStatusMap.get("SOLD") || 0;
  const available = ticketStatusMap.get("AVAILABLE") || 0;
  const locked = ticketStatusMap.get("LOCKED") || 0;

  const kpis = programDashboard?.kpis || null;
  const totalInvestmentNetProjected = kpis?.totalInvestmentNetProjected || 0;
  const totalInAccountNet = kpis?.totalInAccountNet || 0;
  const investorsCount = kpis?.investorsCount || 0;
  const recurringShareholders = kpis?.recurringShareholders || 0;

  const breakdownPaid = kpis?.breakdown?.paidYear || null;
  const breakdownProjected = kpis?.breakdown?.projectedUntilYearEnd || null;

  const quotaByTicketType = useMemo(
    () => sortTicketItems(summary?.quotaByTicketType),
    [summary?.quotaByTicketType],
  );

  const quotaByCluster = summary?.quotaByCluster || [];

  const ticketTypes = useMemo(
    () => sortTicketItems(summary?.ticketTypes),
    [summary?.ticketTypes],
  );

  const programEventsFuture = programDashboard?.relatedEvents?.future || [];
  const programEventsPast = programDashboard?.relatedEvents?.past || [];

  return {
    eventTypeName,
    programDashboard,
    programYear,
    stackedYearRows,
    yearTabs,
    categoryMeta,
    kpisByYear,
    title,
    sold,
    available,
    locked,
    totalInvestmentNetProjected,
    totalInAccountNet,
    investorsCount,
    recurringShareholders,
    breakdownPaid,
    breakdownProjected,
    quotaByTicketType,
    quotaByCluster,
    ticketTypes,
    programEventsFuture,
    programEventsPast,
  };
}
