import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminShell from "../../../components/admin/AdminShell";
import ProgramForm from "../components/ProgramForm";

async function fetchOrgEvents(organizationId) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/events`,
  );
  if (!response.ok) {
    throw new Error(
      `When fetching /api/admin/organizations/${organizationId}/events, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

function isProgramType(eventTypeName) {
  const t = String(eventTypeName || "").toUpperCase();
  return t === "STOCKS" || t === "CROWDFUNDING";
}

function pickPrimaryProgram(programs) {
  if (!Array.isArray(programs) || programs.length === 0) {
    return null;
  }
  const active = programs.find((p) => {
    const s = String(p.status || "").toUpperCase();
    return s === "PUBLISHED" || s === "STARTED";
  });
  return active || programs[0];
}

export default function NovoProgramaPage() {
  const [organizationId, setOrganizationId] = useState(null);

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || null);
  }, []);

  const {
    data: eventsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "org", organizationId, "events", "for-program-create"],
    queryFn: () => fetchOrgEvents(organizationId),
    enabled: Boolean(organizationId),
    networkMode: "always",
  });

  const allEvents = eventsData?.events || [];

  const programs = useMemo(() => {
    return allEvents.filter((e) => isProgramType(e.eventTypeName));
  }, [allEvents]);

  const primaryProgram = useMemo(() => {
    return pickPrimaryProgram(programs);
  }, [programs]);

  const hasProgram = Boolean(primaryProgram);

  const handleCreated = useCallback((eventId) => {
    if (!eventId) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    window.location.href = `/programas/${eventId}/editar`;
  }, []);

  const programViewHref = useMemo(() => {
    if (!primaryProgram?.eventId) {
      return "/programas";
    }
    return `/programas/${primaryProgram.eventId}`;
  }, [primaryProgram?.eventId]);

  const programEditHref = useMemo(() => {
    if (!primaryProgram?.eventId) {
      return "/programas";
    }
    return `/programas/${primaryProgram.eventId}/editar`;
  }, [primaryProgram?.eventId]);

  let mainContent = null;

  if (!organizationId) {
    mainContent = (
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
        <div className="text-sm font-semibold font-inter text-[#111827]">
          Selecione uma ONG
        </div>
        <div className="text-sm font-inter text-[#6B7280] mt-1">
          Para criar um programa, selecione uma ONG no topo.
        </div>
        <a
          href="/associacao/nova"
          className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-black text-white text-sm font-inter hover:bg-black/90 mt-4"
        >
          Cadastrar nova ONG
        </a>
      </div>
    );
  } else if (isLoading) {
    mainContent = (
      <div className="text-sm font-inter text-[#6B7280]">Carregando…</div>
    );
  } else if (error) {
    mainContent = (
      <div className="bg-white border border-red-200 rounded-xl p-4 md:p-6">
        <div className="text-sm font-inter text-red-700">
          Não foi possível carregar os programas desta ONG.
        </div>
      </div>
    );
  } else if (hasProgram) {
    mainContent = (
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
        <div className="text-sm font-semibold font-inter text-[#111827]">
          Esta ONG já tem um programa
        </div>
        <div className="text-sm font-inter text-[#374151] mt-1">
          {primaryProgram?.name || "Programa"}
        </div>
        <div className="text-xs font-inter text-[#6B7280] mt-2">
          Por padrão, mantemos 1 programa por ONG. Você pode editar o programa
          existente.
        </div>

        <div className="mt-4 flex flex-col md:flex-row gap-2">
          <a
            href={programEditHref}
            className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-black text-white text-sm font-inter hover:bg-black/90"
          >
            Editar programa
          </a>
          <a
            href={programViewHref}
            className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-white border border-[#E5E7EB] text-[#111827] text-sm font-inter hover:bg-[#F9FAFB]"
          >
            Ver detalhes
          </a>
        </div>
      </div>
    );
  } else {
    mainContent = (
      <ProgramForm
        organizationId={organizationId}
        mode="create"
        onCreated={handleCreated}
      />
    );
  }

  return (
    <AdminShell
      title="Programas"
      subtitle="Cadastrar novo programa"
      onOrgChange={onOrgChange}
    >
      <div className="space-y-4">
        <a
          href="/programas"
          className="text-sm font-inter text-[#374151] hover:underline"
        >
          ← Voltar para Programas
        </a>

        {mainContent}
      </div>
    </AdminShell>
  );
}
