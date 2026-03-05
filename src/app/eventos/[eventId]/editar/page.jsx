import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminShell from "../../../../components/admin/AdminShell";
import EventForm from "../../components/EventForm";

const THP_ORGANIZATION_ID = "5d82139a-b663-4ca7-90bc-c60be9227fa8";

async function fetchEvent(organizationId, eventId) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/events/${eventId}`,
  );
  if (!response.ok) {
    throw new Error(
      `When fetching /api/admin/organizations/${organizationId}/events/${eventId}, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

export default function EditarEventoPage({ params: { eventId } }) {
  const [organizationId, setOrganizationId] = useState(THP_ORGANIZATION_ID);

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || THP_ORGANIZATION_ID);
  }, []);

  const {
    data: eventData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "org", organizationId, "event", eventId, "detail"],
    queryFn: () => fetchEvent(organizationId, eventId),
    enabled: Boolean(organizationId && eventId),
    networkMode: "always",
  });

  const title = useMemo(() => {
    if (isLoading) {
      return "Carregando…";
    }
    return eventData?.event?.name || "Editar evento";
  }, [eventData?.event?.name, isLoading]);

  return (
    <AdminShell
      title={title}
      subtitle="Você pode editar a qualquer momento"
      onOrgChange={onOrgChange}
      lockedOrganizationId={THP_ORGANIZATION_ID}
    >
      {error ? (
        <div className="bg-white border border-red-200 rounded-xl p-6">
          <div className="text-sm text-red-600 font-inter">
            Não foi possível carregar o evento.
          </div>
        </div>
      ) : null}

      {eventData?.event ? (
        <EventForm
          organizationId={organizationId}
          mode="edit"
          initialEvent={eventData.event}
        />
      ) : (
        <div className="text-sm font-inter text-[#6B7280]">
          {isLoading ? "Carregando…" : "Evento não encontrado."}
        </div>
      )}
    </AdminShell>
  );
}
