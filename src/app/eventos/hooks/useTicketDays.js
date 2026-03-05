import { useMemo } from "react";
import { formatDateInput } from "../utils/dateFormatters";

export function useTicketDays(startDate, endDate) {
  return useMemo(() => {
    if (!startDate) {
      return [];
    }

    const days = [];
    try {
      const start = new Date(`${startDate}T00:00:00`);
      const end = endDate ? new Date(`${endDate}T00:00:00`) : start;
      let cur = start;
      let guard = 0;
      while (cur <= end && guard < 31) {
        const key = formatDateInput(cur.toISOString());
        days.push(key);
        cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
        guard += 1;
      }
    } catch {
      return [];
    }

    return days;
  }, [startDate, endDate]);
}
