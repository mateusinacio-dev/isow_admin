import KpiCard from "@/components/admin/KpiCard";
import { formatMoneyBRL } from "@/utils/formatters";

export function KpiSection({
  programYear,
  yearTabs,
  selectedKpiYear,
  onKpiYearChange,
  totalInvestmentNetProjected,
  totalInAccountNet,
  investorsCount,
  recurringShareholders,
  programDashboard,
  onShowBreakdown,
}) {
  const yearLabel = selectedKpiYear || programYear || "–";

  return (
    <div className="space-y-3">
      {yearTabs && yearTabs.length > 0 ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-sm font-inter text-[#6B7280]">Ano (KPIs)</div>
          <div className="flex flex-wrap items-center gap-2">
            {yearTabs.map((y) => {
              const active = String(y) === String(yearLabel);
              const cls = active
                ? "bg-[#111827] text-white border-[#111827]"
                : "bg-white text-[#111827] border-[#E5E7EB]";
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => onKpiYearChange?.(String(y))}
                  className={`h-9 px-4 rounded-full border text-sm font-inter ${cls}`}
                >
                  {y}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          type="button"
          className="text-left bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6 transition-all duration-150 hover:border-[#D1D5DB] hover:bg-white/80 active:scale-[0.99]"
          onClick={onShowBreakdown}
          disabled={!programDashboard}
          title="Clique para ver detalhamento"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-inter text-[#6B7280] mb-2">
                Total de investimento (líquido)
              </div>
              <div className="text-xs font-inter text-[#9CA3AF] -mt-1 mb-2">
                Ano {yearLabel}
              </div>
            </div>
            <div className="text-xs font-inter text-[#6B7280]">Ver</div>
          </div>
          <div className="text-2xl md:text-3xl font-bold font-inter text-black">
            {formatMoneyBRL(totalInvestmentNetProjected)}
          </div>
        </button>

        <KpiCard
          label="Total em conta (líquido)"
          hint={yearLabel ? `Ano ${yearLabel}` : undefined}
          value={totalInAccountNet}
          kind="money"
        />
        <KpiCard
          label="Número de investidores"
          hint={yearLabel ? `Ano ${yearLabel}` : undefined}
          value={investorsCount}
        />
        <KpiCard
          label="Acionistas recorrentes"
          hint={yearLabel ? `Ano ${yearLabel}` : undefined}
          value={recurringShareholders}
        />
      </div>
    </div>
  );
}
