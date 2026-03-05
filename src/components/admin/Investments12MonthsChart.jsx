import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

function formatMoneyBRL(value) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  } catch {
    return String(value);
  }
}

export default function Investments12MonthsChart({ title, data }) {
  const chartData = useMemo(() => {
    return (data || []).map((d) => ({
      name: d.label,
      programas: Number(d.programas || 0),
      projetos: Number(d.projetos || 0),
      total: Number(d.total || 0),
    }));
  }, [data]);

  const tooltipFormatter = (v) => formatMoneyBRL(v);

  return (
    <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-lg font-semibold font-inter text-[#111827]">
          {title}
        </div>
        <div className="text-xs text-[#6B7280] font-inter">somente leitura</div>
      </div>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6B7280" }} />
            <YAxis
              tick={{ fontSize: 12, fill: "#6B7280" }}
              tickFormatter={(v) => formatMoneyBRL(v)}
            />
            <Tooltip
              formatter={tooltipFormatter}
              labelStyle={{ fontFamily: "Inter, sans-serif" }}
              contentStyle={{
                borderRadius: 12,
                borderColor: "#E5E7EB",
                fontFamily: "Inter, sans-serif",
              }}
            />
            <Legend />
            <Bar
              dataKey="projetos"
              stackId="a"
              name="Projetos"
              fill="#111827"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="programas"
              stackId="a"
              name="Programas"
              fill="#7C3AED"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
