import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminShell from "../../components/admin/AdminShell";
import KpiCard from "../../components/admin/KpiCard";

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

async function deleteEvent(organizationId, eventId) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/events/${eventId}`,
    { method: "DELETE" },
  );
  if (!response.ok) {
    throw new Error(
      `When deleting /api/admin/organizations/${organizationId}/events/${eventId}, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

function formatDate(value) {
  if (!value) {
    return "–";
  }
  try {
    const d = new Date(value);
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(d);
  } catch {
    return String(value);
  }
}

export default function EventosPage() {
  const qc = useQueryClient();
  const [organizationId, setOrganizationId] = useState(null);
  const [uiError, setUiError] = useState(null);

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || null);
  }, []);

  const {
    data: eventsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "org", organizationId, "eventos"],
    queryFn: () => fetchOrgEvents(organizationId),
    enabled: Boolean(organizationId),
    networkMode: "always",
  });

  const allEvents = eventsData?.events || [];

  const normalEvents = useMemo(() => {
    return allEvents.filter((e) => {
      const t = String(e.eventTypeName || "").toUpperCase();
      return t === "ONPREMISE";
    });
  }, [allEvents]);

  const now = Date.now();

  const futureEvents = useMemo(() => {
    return normalEvents.filter((e) => {
      const start = e.startDate ? new Date(e.startDate).getTime() : 0;
      if (!start) {
        return false;
      }
      return start >= now;
    });
  }, [normalEvents, now]);

  const activeEvents = useMemo(() => {
    return futureEvents.filter((e) => {
      const s = String(e.status || "").toUpperCase();
      return s === "PUBLISHED" || s === "STARTED";
    });
  }, [futureEvents]);

  const hiddenCount = useMemo(() => {
    const total = Number(normalEvents.length || 0);
    const shown = Number(futureEvents.length || 0);
    return Math.max(0, total - shown);
  }, [normalEvents.length, futureEvents.length]);

  const delMutation = useMutation({
    mutationFn: ({ eventId }) => deleteEvent(organizationId, eventId),
    onSuccess: () => {
      setUiError(null);
      qc.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "eventos"],
      });
      qc.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "events"],
      });
    },
    onError: (err) => {
      console.error(err);
      setUiError("Não foi possível excluir o evento.");
    },
  });

  return (
    <AdminShell
      title="Meus Eventos"
      subtitle="Criar, editar e publicar eventos ONPREMISE"
      onOrgChange={onOrgChange}
    >
      {!organizationId ? (
        <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
          <div className="text-sm font-semibold font-inter text-[#111827]">
            Selecione uma ONG
          </div>
          <div className="text-sm font-inter text-[#6B7280] mt-1">
            Para listar e criar eventos, selecione uma ONG no topo.
          </div>
          <a
            href="/associacao/nova"
            className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-black text-white text-sm font-inter hover:bg-black/90 mt-4"
          >
            Cadastrar nova ONG
          </a>
        </div>
      ) : null}

      <div className="space-y-6">
        {uiError ? (
          <div className="bg-white border border-red-200 rounded-xl p-4">
            <div className="text-sm text-red-600 font-inter">{uiError}</div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard label="Futuros" value={futureEvents.length} />
          <KpiCard label="Ativos" value={activeEvents.length} />
          <KpiCard label="Total (ONPREMISE)" value={normalEvents.length} />
          <KpiCard label="Ocultos" value={hiddenCount} />
        </div>

        <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-lg font-semibold font-inter text-[#111827]">
                Lista de Eventos
              </div>
              <div className="text-xs text-[#6B7280] font-inter mt-1">
                Mostrando somente eventos futuros. Clique no nome para abrir o
                painel.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/eventos/novo"
                className="inline-flex items-center h-10 px-5 rounded-full bg-gradient-to-b from-[#252525] to-[#0F0F0F] text-white text-sm font-semibold transition-all duration-150 hover:from-[#2d2d2d] hover:to-[#171717] active:scale-95"
              >
                Cadastrar novo Evento
              </a>
            </div>
          </div>

          {error ? (
            <div className="text-sm text-red-600 font-inter mt-4">
              Não foi possível carregar os eventos.
            </div>
          ) : null}

          <div className="overflow-x-auto mt-4">
            <table className="min-w-[980px] w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left">
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Nome
                  </th>
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Data
                  </th>
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Tickets
                  </th>
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Status
                  </th>
                  <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-sm font-inter text-[#6B7280]"
                    >
                      Carregando…
                    </td>
                  </tr>
                ) : null}

                {!isLoading && futureEvents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-sm font-inter text-[#6B7280]"
                    >
                      Nenhum evento futuro.
                    </td>
                  </tr>
                ) : null}

                {!isLoading
                  ? futureEvents.map((e) => {
                      const sold = Number(e.ticketsSold || 0);
                      const total = Number(e.ticketsTotal || 0);
                      const ticketLabel = total ? `${sold}/${total}` : "–";

                      return (
                        <tr
                          key={e.eventId}
                          className="border-t border-[#F3F4F6]"
                        >
                          <td className="py-3 text-sm font-inter text-[#111827]">
                            <a
                              href={`/eventos/${e.eventId}`}
                              className="font-semibold hover:underline"
                            >
                              {e.name || "(sem nome)"}
                            </a>
                          </td>
                          <td className="py-3 text-sm font-inter text-[#6B7280]">
                            {formatDate(e.startDate)}
                          </td>
                          <td className="py-3 text-sm font-inter text-[#111827]">
                            {ticketLabel}
                          </td>
                          <td className="py-3 text-sm font-inter text-[#6B7280]">
                            {e.status || "–"}
                          </td>
                          <td className="py-3 text-sm font-inter">
                            <div className="flex items-center gap-2">
                              <a
                                href={`/eventos/${e.eventId}/editar`}
                                className="inline-flex items-center h-9 px-4 rounded-full border border-[#E6E6E6] text-[#111827] text-sm font-semibold hover:bg-[#F9FAFB]"
                              >
                                Editar
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  const ok = window.confirm(
                                    `Excluir o evento "${e.name || "(sem nome)"}"?`,
                                  );
                                  if (!ok) {
                                    return;
                                  }
                                  delMutation.mutate({ eventId: e.eventId });
                                }}
                                className="inline-flex items-center h-9 px-4 rounded-full border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50"
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
