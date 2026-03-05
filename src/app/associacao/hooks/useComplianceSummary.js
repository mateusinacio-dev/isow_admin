import { useQuery } from "@tanstack/react-query";
import { fetchComplianceSummary } from "../services/organizationApi";

export function useComplianceSummary(organizationId) {
  return useQuery({
    queryKey: ["admin", "org", organizationId, "compliance"],
    queryFn: () => fetchComplianceSummary(organizationId),
    enabled: Boolean(organizationId),
    networkMode: "always",
  });
}
