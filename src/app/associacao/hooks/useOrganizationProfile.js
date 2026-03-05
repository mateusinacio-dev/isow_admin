import { useQuery } from "@tanstack/react-query";
import { fetchProfile } from "../services/organizationApi";

export function useOrganizationProfile(organizationId) {
  return useQuery({
    queryKey: ["admin", "org", organizationId, "profile"],
    queryFn: () => fetchProfile(organizationId),
    enabled: Boolean(organizationId),
    networkMode: "always",
  });
}
