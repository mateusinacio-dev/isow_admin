import { useQuery } from "@tanstack/react-query";
import { fetchProject } from "../services/projectApi";

export default function useProject(organizationId, projectId) {
  return useQuery({
    queryKey: ["admin", "org", organizationId, "project", projectId],
    queryFn: () => fetchProject(organizationId, projectId),
    enabled: Boolean(organizationId && projectId),
    networkMode: "always",
  });
}
