import { useQuery } from "@tanstack/react-query";
import { fetchOrgProjects } from "../services/projectApi";

export default function useOrgProjects(organizationId) {
  return useQuery({
    queryKey: ["admin", "org", organizationId, "projects"],
    queryFn: () => fetchOrgProjects(organizationId),
    enabled: Boolean(organizationId),
    networkMode: "always",
  });
}
