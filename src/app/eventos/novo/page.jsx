import { useCallback, useEffect, useState } from "react";
import AdminShell from "../../../components/admin/AdminShell";
import EventForm from "../components/EventForm";

export default function NovoEventoPage() {
  const [organizationId, setOrganizationId] = useState(null);
  const [createdEventId, setCreatedEventId] = useState(null);

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || null);
  }, []);

  useEffect(() => {
    if (!createdEventId) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    window.location.href = `/eventos/${createdEventId}/editar`;
  }, [createdEventId]);

  return (
    <AdminShell
      title="Cadastrar novo Evento"
      subtitle="Rascunho primeiro, depois publicar"
      onOrgChange={onOrgChange}
    >
      {!organizationId ? (
        <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
          <div className="text-sm font-semibold font-inter text-[#111827]">
            Selecione uma ONG
          </div>
          <div className="text-sm font-inter text-[#6B7280] mt-1">
            Para criar um evento, selecione uma ONG no topo.
          </div>
          <a
            href="/associacao/nova"
            className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-black text-white text-sm font-inter hover:bg-black/90 mt-4"
          >
            Cadastrar nova ONG
          </a>
        </div>
      ) : (
        <EventForm
          organizationId={organizationId}
          mode="create"
          onCreated={(eventId) => setCreatedEventId(eventId)}
        />
      )}
    </AdminShell>
  );
}
