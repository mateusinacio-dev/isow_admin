import { useState, useEffect, useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { formatMoneyBRL } from "@/utils/formatters";

export function CategoryPieChart({
  yearTabs,
  selectedPieYear,
  onYearChange,
  pieYearData,
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const pieTotal = useMemo(() => {
    let total = 0;
    for (const r of pieYearData || []) {
      total += Number(r.value || 0);
    }
    return total;
  }, [pieYearData]);

  return (
    <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-semibold font-inter text-[#111827]">
            Categorias (percentual)
          </div>
          <div className="text-xs text-[#6B7280] font-inter">por ano</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {yearTabs.map((y) => {
            const active = String(y) === String(selectedPieYear);
            const cls = active
              ? "bg-[#111827] text-white border-[#111827]"
              : "bg-white text-[#111827] border-[#E5E7EB]";
            return (
              <button
                key={y}
                onClick={() => onYearChange(String(y))}
                className={`h-9 px-4 rounded-full border text-sm font-inter ${cls}`}
              >
                {y}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="h-[260px] md:h-[280px] md:flex-1">
          {isClient ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieYearData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={92}
                  paddingAngle={2}
                >
                  {pieYearData.map((p) => (
                    <Cell key={p.fullName} fill={p.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatMoneyBRL(v)}
                  labelFormatter={(_, payload) => {
                    const first = payload?.[0]?.payload;
                    return first?.fullName || "";
                  }}
                  labelStyle={{ fontFamily: "Inter, sans-serif" }}
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "#E5E7EB",
                    fontFamily: "Inter, sans-serif",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm font-inter text-[#6B7280]">
              Carregando gráfico…
            </div>
          )}
        </div>

        {/* Always-visible legend */}
        <div className="md:w-[260px]">
          <div className="text-xs font-inter text-[#6B7280] mb-2">Legenda</div>
          <div className="space-y-2">
            {(pieYearData || []).map((p) => {
              const pct =
                pieTotal > 0 ? (Number(p.value || 0) / pieTotal) * 100 : 0;
              const pctLabel = `${pct.toFixed(1)}%`;
              return (
                <div
                  key={p.fullName}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: p.color }}
                    />
                    <div
                      className="text-xs font-inter text-[#374151] truncate"
                      title={p.fullName}
                    >
                      {p.fullName}
                    </div>
                  </div>
                  <div className="text-xs font-inter text-[#111827] whitespace-nowrap">
                    {pctLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-[#6B7280] font-inter">
        Dica: escolha o ano acima para ver o mix de categorias.
      </div>
    </div>
  );
}
