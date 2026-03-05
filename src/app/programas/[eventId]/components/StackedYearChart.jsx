import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatMoneyBRL } from "@/utils/formatters";

export function StackedYearChart({ stackedYearRows, categoryMeta }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const axisMoneyLabel = useMemo(() => {
    // Shorter labels on the Y axis to avoid clipping (no "R$")
    return (value) => {
      const formatted = formatMoneyBRL(value);
      return String(formatted)
        .replace(/^R\$\s?/i, "")
        .replace(/^R\$\u00A0/i, "");
    };
  }, []);

  return (
    <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-lg font-semibold font-inter text-[#111827]">
          Captado por ano (líquido)
        </div>
        <div className="text-xs text-[#6B7280] font-inter">
          somatório por categoria
        </div>
      </div>

      <div className="h-[280px]">
        {isClient ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stackedYearRows}
              margin={{ top: 8, right: 16, left: 24, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#6B7280" }} />
              <YAxis
                width={92}
                tick={{ fontSize: 12, fill: "#6B7280" }}
                tickFormatter={axisMoneyLabel}
              />
              <Tooltip
                formatter={(v) => formatMoneyBRL(v)}
                labelStyle={{ fontFamily: "Inter, sans-serif" }}
                contentStyle={{
                  borderRadius: 12,
                  borderColor: "#E5E7EB",
                  fontFamily: "Inter, sans-serif",
                }}
              />
              {categoryMeta.map((c) => (
                <Bar
                  key={c.key}
                  dataKey={c.key}
                  stackId="total"
                  fill={c.color}
                  name={c.name}
                  radius={[6, 6, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-sm font-inter text-[#6B7280]">
            Carregando gráfico…
          </div>
        )}
      </div>

      {/* Always-visible legend (so users don’t need to hover) */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {categoryMeta.map((c) => (
          <div key={c.key} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: c.color }}
            />
            <div className="text-xs font-inter text-[#374151]">{c.name}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-[#6B7280] font-inter">
        Cada barra é um ano; as cores representam as categorias.
      </div>
    </div>
  );
}
