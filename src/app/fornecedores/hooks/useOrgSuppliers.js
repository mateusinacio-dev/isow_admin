import { useQuery } from "@tanstack/react-query";
import { fetchOrgSuppliers } from "../services/supplierApi";

export default function useOrgSuppliers(organizationId, { search } = {}) {
  return useQuery({
    queryKey: [
      "admin",
      "org",
      organizationId,
      "suppliers",
      { search: search || "" },
    ],
    queryFn: () => fetchOrgSuppliers(organizationId, { search }),
    enabled: Boolean(organizationId),
    networkMode: "always",
  });
}
