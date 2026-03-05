import { useCallback } from "react";
import { buildDefaultCategory } from "../utils/ticketUtils";

export function useTicketCategories(setState) {
  const onChangeCategory = useCallback(
    (idx, patch) => {
      setState((prev) => {
        const next = [...(prev.ticketCategories || [])];
        next[idx] = { ...next[idx], ...patch };

        // Ensure we always have one empty row at the bottom
        const last = next[next.length - 1];
        const lastHasValue = Boolean(
          String(last?.name || "").trim() ||
            String(last?.price || "").trim() ||
            String(last?.quantity || "").trim(),
        );

        if (lastHasValue) {
          next.push(buildDefaultCategory());
        }

        return { ...prev, ticketCategories: next };
      });
    },
    [setState],
  );

  const onRemoveCategory = useCallback(
    (idx) => {
      setState((prev) => {
        const next = [...(prev.ticketCategories || [])];
        next.splice(idx, 1);
        if (next.length === 0) {
          next.push(buildDefaultCategory());
        }
        return { ...prev, ticketCategories: next };
      });
    },
    [setState],
  );

  return {
    onChangeCategory,
    onRemoveCategory,
  };
}
