import { useMemo, useCallback } from "react";
import { safeShortLabel } from "@/utils/formatters";

export function useChartData(
  quotaByTicketType,
  stackedYearRows,
  categoryMeta,
  selectedPieYear,
) {
  const netByTicketTypeData = useMemo(() => {
    const rows = [];
    for (const q of quotaByTicketType) {
      const value = Number(q?.financial?.netTotal || 0);
      if (value <= 0) {
        continue;
      }
      rows.push({
        name: safeShortLabel(q.name || "–", 18),
        fullName: String(q.name || "–"),
        value,
      });
    }
    return rows;
  }, [quotaByTicketType]);

  const investorsByTicketTypeData = useMemo(() => {
    const rows = [];
    for (const q of quotaByTicketType) {
      const investors = Number(q?.financial?.donorsCount || 0);
      if (investors <= 0) {
        continue;
      }
      rows.push({
        name: safeShortLabel(q.name || "–", 14),
        fullName: String(q.name || "–"),
        investors,
      });
    }
    // Highest first
    rows.sort((a, b) => b.investors - a.investors);
    return rows;
  }, [quotaByTicketType]);

  const pieColors = useMemo(
    () => ["#111827", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB", "#E5E7EB"],
    [],
  );

  const getPieColor = useCallback(
    (idx) => {
      const chosen = pieColors[idx % pieColors.length];
      return chosen || "#111827";
    },
    [pieColors],
  );

  const pieYearRow = useMemo(() => {
    if (!selectedPieYear) {
      return null;
    }
    return (
      (stackedYearRows || []).find(
        (r) => String(r.year) === String(selectedPieYear),
      ) || null
    );
  }, [selectedPieYear, stackedYearRows]);

  const pieYearData = useMemo(() => {
    if (!pieYearRow) {
      return [];
    }
    const rows = [];
    for (const c of categoryMeta) {
      const v = Number(pieYearRow[c.key] || 0);
      if (v <= 0) {
        continue;
      }
      rows.push({
        name: safeShortLabel(c.name, 18),
        fullName: c.name,
        value: v,
        color: c.color,
      });
    }
    return rows;
  }, [categoryMeta, pieYearRow]);

  return {
    netByTicketTypeData,
    investorsByTicketTypeData,
    pieColors,
    getPieColor,
    pieYearData,
  };
}
