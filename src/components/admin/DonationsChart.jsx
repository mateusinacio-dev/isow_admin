import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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

export default function DonationsChart({ title, data, valueKey = "total" }) {
  const chartData = useMemo(() => {
    return (data || []).map((d) => ({
      name: d.label || d.day,
      value: Number(d[valueKey] || 0),
    }));
  }, [data, valueKey]);

  return (
    <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-lg font-semibold font-inter text-[#111827]">
          {title}
        </div>
        <div className="text-xs text-[#6B7280] font-inter">somente leitura</div>
      </div>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
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
              formatter={(v) => formatMoneyBRL(v)}
              labelStyle={{ fontFamily: "Inter, sans-serif" }}
              contentStyle={{
                borderRadius: 12,
                borderColor: "#E5E7EB",
                fontFamily: "Inter, sans-serif",
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#111827"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
