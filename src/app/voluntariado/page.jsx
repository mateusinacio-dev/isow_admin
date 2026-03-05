import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminShell from "../../components/admin/AdminShell";

const THP_ORGANIZATION_ID = "5d82139a-b663-4ca7-90bc-c60be9227fa8";

async function fetchOrgDashboard(organizationId) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/dashboard`,
  );
  if (!response.ok) {
    throw new Error(
      `When fetching /api/admin/organizations/${organizationId}/dashboard, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

export default function VoluntariadoPage() {
  const [organizationId, setOrganizationId] = useState(THP_ORGANIZATION_ID);

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || THP_ORGANIZATION_ID);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "org", organizationId, "dashboard"],
    queryFn: () => fetchOrgDashboard(organizationId),
    enabled: Boolean(organizationId),
    networkMode: "always",
  });

  const subtitle = useMemo(() => {
    if (isLoading) {
      return "Carregando…";
    }
    return "Acompanhar vagas e inscrições";
  }, [isLoading]);

  return (
    <AdminShell
      title="Voluntariado"
      subtitle={subtitle}
      onOrgChange={onOrgChange}
      lockedOrganizationId={THP_ORGANIZATION_ID}
    >
      <div className="space-y-6">
        {error ? (
          <div className="bg-white border border-red-200 rounded-xl p-4">
            <div className="text-sm text-red-700 font-inter">
              Não foi possível carregar.
            </div>
          </div>
        ) : null}

        <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
          <div className="text-lg font-semibold font-inter text-[#111827]">
            Resumo
          </div>
          <div className="text-xs text-[#6B7280] font-inter mt-1">
            Nesta primeira versão, mostramos apenas contagem de voluntariados.
          </div>

          {data ? (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#E6E6E6] p-4">
                <div className="text-xs text-[#6B7280] font-inter">
                  Voluntariados ativos
                </div>
                <div className="text-2xl font-bold font-inter mt-2">
                  {data.stats?.activeVolunteerings || 0}
                </div>
              </div>
              <div className="rounded-xl border border-[#E6E6E6] p-4">
                <div className="text-xs text-[#6B7280] font-inter">
                  Voluntariados encerrados
                </div>
                <div className="text-2xl font-bold font-inter mt-2">
                  {data.stats?.closedVolunteerings || 0}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm font-inter text-[#6B7280]">
              {isLoading ? "Carregando…" : "Selecione uma ONG."}
            </div>
          )}

          <div className="mt-6 text-sm font-inter text-[#6B7280]">
            Se você quiser, eu sigo com a lista de vagas (Vacancy) e inscrições
            (VonlunteerSubscription), com filtros e exportação.
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
