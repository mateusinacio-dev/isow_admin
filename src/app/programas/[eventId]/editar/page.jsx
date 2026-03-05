import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminShell from "../../../../components/admin/AdminShell";
import ProgramForm from "../../components/ProgramForm";
import { useEventOrganization } from "../../hooks/useEventOrganization";

async function fetchEvent({ organizationId, eventId }) {
  const url = `/api/admin/organizations/${organizationId}/events/${eventId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `When fetching ${url}, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

export default function EditarProgramaPage({ params: { eventId } }) {
  const {
    organizationId,
    loading: orgLoading,
    onOrgChange,
  } = useEventOrganization(eventId);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "org", organizationId, "event", eventId],
    queryFn: () => fetchEvent({ organizationId, eventId }),
    enabled: Boolean(organizationId && eventId),
    networkMode: "always",
  });

  const title = useMemo(() => {
    const name = data?.event?.name;
    return name ? `Editar: ${name}` : "Editar Programa";
  }, [data?.event?.name]);

  const subtitle = useMemo(() => {
    if (orgLoading || isLoading) {
      return "Carregando…";
    }
    return "Você pode editar o programa a qualquer momento.";
  }, [orgLoading, isLoading]);

  const showLoading = orgLoading || (isLoading && !data);

  return (
    <AdminShell title={title} subtitle={subtitle} onOrgChange={onOrgChange}>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <a
            href={`/programas/${eventId}`}
            className="text-sm font-inter text-[#374151] hover:underline"
          >
            ← Voltar para o Dashboard do Programa
          </a>

          <a
            href="/programas"
            className="text-sm font-inter text-[#374151] hover:underline"
          >
            Ver lista de Programas
          </a>
        </div>

        {error ? (
          <div className="bg-white border border-red-200 rounded-xl p-4">
            <div className="text-sm text-red-600 font-inter">
              Não foi possível carregar o programa.
            </div>
          </div>
        ) : null}

        {data?.event ? (
          <ProgramForm
            organizationId={organizationId}
            mode="edit"
            initialEvent={data}
          />
        ) : (
          <div className="text-sm font-inter text-[#6B7280]">
            {showLoading ? "Carregando…" : "Programa não encontrado."}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
