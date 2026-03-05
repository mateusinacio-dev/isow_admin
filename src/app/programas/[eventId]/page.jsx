import { useMemo, useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import SubscriptionsTable from "@/components/admin/SubscriptionsTable";
import { useEventOrganization } from "../hooks/useEventOrganization";
import { useProgramSummary } from "./hooks/useProgramSummary";
import { useProgramData } from "./hooks/useProgramData";
import { useChartData } from "./hooks/useChartData";
import { BreakdownModal } from "./components/BreakdownModal";
import { TabNavigation } from "./components/TabNavigation";
import { VisaoGeralTab } from "./components/VisaoGeralTab";
import { CotasTab } from "./components/CotasTab";

export default function ProgramaDetailPage({ params: { eventId } }) {
  const {
    organizationId,
    loading: orgLoading,
    onOrgChange,
  } = useEventOrganization(eventId);

  const [activeTab, setActiveTab] = useState("visao_geral");
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedPieYear, setSelectedPieYear] = useState(null);
  const [selectedKpiYear, setSelectedKpiYear] = useState(null);

  const {
    data: summary,
    isLoading,
    error,
  } = useProgramSummary(organizationId, eventId);

  const {
    title,
    programDashboard,
    programYear,
    stackedYearRows,
    yearTabs,
    categoryMeta,
    kpisByYear,
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
  } = useProgramData(summary);

  const { pieYearData } = useChartData(
    quotaByTicketType,
    stackedYearRows,
    categoryMeta,
    selectedPieYear,
  );

  useEffect(() => {
    if (!selectedPieYear && yearTabs.length > 0) {
      const preferred = programYear
        ? String(programYear)
        : String(yearTabs[yearTabs.length - 1]);
      setSelectedPieYear(preferred);
    }
  }, [programYear, selectedPieYear, yearTabs]);

  useEffect(() => {
    if (!selectedKpiYear && yearTabs.length > 0) {
      const preferred = programYear
        ? String(programYear)
        : String(yearTabs[yearTabs.length - 1]);
      setSelectedKpiYear(preferred);
    }
  }, [programYear, selectedKpiYear, yearTabs]);

  const kpisByYearRows = useMemo(() => {
    const rows = Array.isArray(kpisByYear) ? kpisByYear : [];
    return [...rows].sort((a, b) => Number(a.year) - Number(b.year));
  }, [kpisByYear]);

  const kpisByYearMap = useMemo(() => {
    const map = new Map();
    for (const r of kpisByYearRows) {
      map.set(String(r.year), r);
    }
    return map;
  }, [kpisByYearRows]);

  const effectiveKpiYear = useMemo(() => {
    return String(selectedKpiYear || programYear || "");
  }, [programYear, selectedKpiYear]);

  const kpisForSelectedYear = useMemo(() => {
    const isCurrent = programYear && String(programYear) === effectiveKpiYear;

    if (isCurrent) {
      return {
        totalInvestmentNetProjected,
        totalInAccountNet,
        investorsCount,
        recurringShareholders,
        breakdownPaid,
        breakdownProjected,
      };
    }

    const row = kpisByYearMap.get(effectiveKpiYear);
    if (!row) {
      return {
        totalInvestmentNetProjected: 0,
        totalInAccountNet: 0,
        investorsCount: 0,
        recurringShareholders: 0,
        breakdownPaid: null,
        breakdownProjected: null,
      };
    }

    const paidBreakdown = {
      gross: Number(row.grossPaid || 0),
      bankFee: Number(row.bankFeePaid || 0),
      isowFee: Number(row.isowFeePaid || 0),
      net: Number(row.netPaid || 0),
    };

    return {
      totalInvestmentNetProjected: Number(row.netPaid || 0),
      totalInAccountNet: Number(row.netPaid || 0),
      investorsCount: Number(row.investorsPaid || 0),
      recurringShareholders: Number(row.recurringSubsPaid || 0),
      breakdownPaid: paidBreakdown,
      breakdownProjected: null,
    };
  }, [
    breakdownPaid,
    breakdownProjected,
    effectiveKpiYear,
    investorsCount,
    kpisByYearMap,
    programYear,
    recurringShareholders,
    totalInAccountNet,
    totalInvestmentNetProjected,
  ]);

  const subtitle = useMemo(() => {
    if (orgLoading || isLoading) {
      return "Carregando painel do programa…";
    }
    return "Dashboard do programa (somente leitura)";
  }, [orgLoading, isLoading]);

  const tabs = useMemo(() => {
    return [
      { id: "visao_geral", label: "Visão geral" },
      { id: "cotas", label: "Cotas" },
      { id: "assinaturas", label: "Assinaturas" },
    ];
  }, []);

  const tabHeader = (
    <TabNavigation
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );

  const showLoading = orgLoading || (isLoading && !summary);

  return (
    <AdminShell title={title} subtitle={subtitle} onOrgChange={onOrgChange}>
      {error ? (
        <div className="bg-white border border-red-200 rounded-xl p-6">
          <div className="text-sm text-red-600 font-inter">
            Não foi possível carregar o painel do programa.
          </div>
        </div>
      ) : null}

      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <a
          href="/programas"
          className="text-sm font-inter text-[#374151] hover:underline"
        >
          ← Voltar para Programas
        </a>

        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
          <a
            href={`/programas/${eventId}/editar`}
            className="inline-flex items-center justify-center h-9 px-4 rounded-full border border-[#E5E7EB] text-sm font-inter"
            title="Editar nome, logo, texto e cotas do programa"
          >
            Editar programa
          </a>
          {tabHeader}
        </div>
      </div>

      {summary ? (
        <div className="space-y-6">
          <BreakdownModal
            show={showBreakdown}
            onClose={() => setShowBreakdown(false)}
            programYear={effectiveKpiYear || programYear}
            breakdownPaid={kpisForSelectedYear.breakdownPaid}
            breakdownProjected={kpisForSelectedYear.breakdownProjected}
          />

          {activeTab === "visao_geral" ? (
            <VisaoGeralTab
              organizationId={organizationId}
              eventId={eventId}
              programYear={programYear}
              yearTabs={yearTabs}
              selectedKpiYear={selectedKpiYear}
              onKpiYearChange={setSelectedKpiYear}
              totalInvestmentNetProjected={
                kpisForSelectedYear.totalInvestmentNetProjected
              }
              totalInAccountNet={kpisForSelectedYear.totalInAccountNet}
              investorsCount={kpisForSelectedYear.investorsCount}
              recurringShareholders={kpisForSelectedYear.recurringShareholders}
              programDashboard={programDashboard}
              onShowBreakdown={() => setShowBreakdown(true)}
              stackedYearRows={stackedYearRows}
              categoryMeta={categoryMeta}
              selectedPieYear={selectedPieYear}
              onYearChange={setSelectedPieYear}
              pieYearData={pieYearData}
              kpisByYearRows={kpisByYearRows}
              sold={sold}
              available={available}
              locked={locked}
              ticketTypes={ticketTypes}
              programEventsFuture={programEventsFuture}
              programEventsPast={programEventsPast}
            />
          ) : null}

          {activeTab === "cotas" ? (
            <CotasTab
              quotaByTicketType={quotaByTicketType}
              quotaByCluster={quotaByCluster}
            />
          ) : null}

          {activeTab === "assinaturas" ? (
            <SubscriptionsTable
              organizationId={organizationId}
              eventId={eventId}
            />
          ) : null}
        </div>
      ) : (
        <div className="text-sm font-inter text-[#6B7280]">
          {showLoading ? "Carregando…" : "Programa não encontrado."}
        </div>
      )}
    </AdminShell>
  );
}
