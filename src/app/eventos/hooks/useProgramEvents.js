import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchOrgEvents } from "../services/eventApi";

export function useProgramEvents(organizationId) {
  const { data: eventsData } = useQuery({
    queryKey: ["admin", "org", organizationId, "events", "for-program-select"],
    queryFn: () => fetchOrgEvents(organizationId),
    enabled: Boolean(organizationId),
    networkMode: "always",
  });

  const programs = useMemo(() => {
    const all = eventsData?.events || [];
    return all.filter((e) => {
      const t = String(e.eventTypeName || "").toUpperCase();
      return t === "STOCKS" || t === "CROWDFUNDING";
    });
  }, [eventsData?.events]);

  return programs;
}
