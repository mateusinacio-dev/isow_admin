import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import AdminShell from "../../../components/admin/AdminShell";
import KpiCard from "../../../components/admin/KpiCard";

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

async function fetchEventSummary(organizationId, eventId) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/events/${eventId}/summary`,
  );
  if (!response.ok) {
    throw new Error(
      `When fetching /api/admin/organizations/${organizationId}/events/${eventId}/summary, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

async function fetchAttendees(organizationId, eventId) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/events/${eventId}/attendees`,
  );
  if (!response.ok) {
    throw new Error(
      `When fetching /api/admin/organizations/${organizationId}/events/${eventId}/attendees, the response was [${response.status}] ${response.statusText}`,
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

function formatDateTime(value) {
  if (!value) {
    return "–";
  }
  try {
    const d = new Date(value);
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return String(value);
  }
}

function formatMoneyBRL(value) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value || 0));
  } catch {
    return String(value);
  }
}

export default function EventoGestaoPage({ params: { eventId } }) {
  const qc = useQueryClient();
  const [organizationId, setOrganizationId] = useState(THP_ORGANIZATION_ID);
  const [errorMsg, setErrorMsg] = useState(null);

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || THP_ORGANIZATION_ID);
  }, []);

  const {
    data: eventData,
    isLoading: loadingEvent,
    error: errorEvent,
  } = useQuery({
    queryKey: ["admin", "org", organizationId, "event", eventId, "detail"],
    queryFn: () => fetchEvent(organizationId, eventId),
    enabled: Boolean(organizationId && eventId),
    networkMode: "always",
  });

  const {
    data: summary,
    isLoading: loadingSummary,
    error: errorSummary,
  } = useQuery({
    queryKey: ["admin", "org", organizationId, "event", eventId, "summary"],
    queryFn: () => fetchEventSummary(organizationId, eventId),
    enabled: Boolean(organizationId && eventId),
    networkMode: "always",
  });

  const {
    data: attendeesData,
    isLoading: loadingAttendees,
    error: errorAttendees,
  } = useQuery({
    queryKey: ["admin", "org", organizationId, "event", eventId, "attendees"],
    queryFn: () => fetchAttendees(organizationId, eventId),
    enabled: Boolean(organizationId && eventId),
    networkMode: "always",
  });

  const delMutation = useMutation({
    mutationFn: () => deleteEvent(organizationId, eventId),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "eventos"],
      });
      qc.invalidateQueries({
        queryKey: ["admin", "org", organizationId, "events"],
      });
      if (typeof window !== "undefined") {
        window.location.href = "/eventos";
      }
    },
    onError: (err) => {
      console.error(err);
      setErrorMsg("Não foi possível excluir o evento.");
    },
  });

  const event = eventData?.event || null;

  const ticketStatusMap = useMemo(() => {
    const map = new Map();
    for (const row of summary?.ticketStatus || []) {
      map.set(row.status, Number(row.count || 0));
    }
    return map;
  }, [summary?.ticketStatus]);

  const sold = ticketStatusMap.get("SOLD") || 0;
  const available = ticketStatusMap.get("AVAILABLE") || 0;
  const locked = ticketStatusMap.get("LOCKED") || 0;
  const total = sold + available + locked;

  const pieData = useMemo(() => {
    return [
      { name: "Vendidos", value: sold },
      { name: "Disponíveis", value: available },
      { name: "Reservados", value: locked },
    ].filter((d) => d.value > 0);
  }, [available, locked, sold]);

  const attendees = attendeesData?.attendees || [];

  const grossSum = useMemo(() => {
    return attendees.reduce((acc, row) => {
      return acc + Number(row.ticketPrice || 0);
    }, 0);
  }, [attendees]);

  const title = event?.name || (loadingEvent ? "Carregando…" : "Evento");

  return (
    <AdminShell
      title={title}
      subtitle="Painel de gestão do evento"
      onOrgChange={onOrgChange}
      lockedOrganizationId={THP_ORGANIZATION_ID}
    >
      {errorMsg ? (
        <div className="bg-white border border-red-200 rounded-xl p-4 mb-6">
          <div className="text-sm text-red-600 font-inter">{errorMsg}</div>
        </div>
      ) : null}

      {errorEvent || errorSummary || errorAttendees ? (
        <div className="bg-white border border-red-200 rounded-xl p-6 mb-6">
          <div className="text-sm text-red-600 font-inter">
            Não foi possível carregar a gestão do evento.
          </div>
        </div>
      ) : null}

      {event ? (
        <div className="space-y-6">
          <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="text-lg font-semibold font-inter text-[#111827]">
                  {event.name}
                </div>
                <div className="text-xs text-[#6B7280] font-inter mt-1">
                  {formatDateTime(event.startDate)} →{" "}
                  {formatDateTime(event.endDate)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/eventos/${eventId}/editar`}
                  className="inline-flex items-center h-10 px-5 rounded-full border border-[#111827] text-[#111827] text-sm font-semibold hover:bg-[#F9FAFB] active:scale-95"
                >
                  Editar
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const ok = window.confirm(
                      "Excluir evento? (deleção lógica)",
                    );
                    if (!ok) {
                      return;
                    }
                    delMutation.mutate();
                  }}
                  className="inline-flex items-center h-10 px-5 rounded-full border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 active:scale-95"
                >
                  Excluir
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-[#E6E6E6] p-4">
                <div className="text-xs text-[#6B7280] font-inter">Local</div>
                <div className="text-sm font-semibold font-inter text-[#111827] mt-1">
                  {event.attendanceAddress?.placeName || "(não informado)"}
                </div>
                <div className="text-xs text-[#6B7280] font-inter mt-1">
                  {event.attendanceAddress?.city || ""}
                  {event.attendanceAddress?.state
                    ? `, ${event.attendanceAddress.state}`
                    : ""}
                </div>
              </div>
              <div className="rounded-xl border border-[#E6E6E6] p-4">
                <div className="text-xs text-[#6B7280] font-inter">
                  Visibilidade
                </div>
                <div className="text-sm font-semibold font-inter text-[#111827] mt-1">
                  {event.adminConfig?.visibility?.isPublic === false
                    ? "Privado"
                    : "Público"}
                </div>
                <div className="text-xs text-[#6B7280] font-inter mt-1">
                  Status: {event.status || "–"}
                </div>
              </div>
              <div className="rounded-xl border border-[#E6E6E6] p-4">
                <div className="text-xs text-[#6B7280] font-inter">
                  Publicação
                </div>
                <div className="text-sm font-semibold font-inter text-[#111827] mt-1">
                  {event.publishingDate
                    ? formatDateTime(event.publishingDate)
                    : "–"}
                </div>
                <div className="text-xs text-[#6B7280] font-inter mt-1">
                  Programa: {event.relatedProgramEventId ? "Sim" : "Não"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="text-lg font-semibold font-inter text-[#111827]">
                  Tickets vendidos
                </div>
                <div className="text-xs text-[#6B7280] font-inter">
                  {total ? `${sold}/${total}` : "–"}
                </div>
              </div>

              <div className="h-[260px]">
                {loadingSummary ? (
                  <div className="text-sm font-inter text-[#6B7280]">
                    Carregando…
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={90}
                        innerRadius={52}
                        paddingAngle={2}
                      >
                        {pieData.map((entry, index) => {
                          const colors = ["#111827", "#E5E7EB", "#A7F3D0"];
                          const fill = colors[index % colors.length];
                          return <Cell key={entry.name} fill={fill} />;
                        })}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <KpiCard label="Vendidos" value={sold} />
                <KpiCard label="Disponíveis" value={available} />
                <KpiCard label="Reservados" value={locked} />
              </div>
            </div>

            <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
              <div className="text-lg font-semibold font-inter text-[#111827] mb-4">
                Valor arrecadado (estimativa)
              </div>
              <div className="text-sm font-inter text-[#6B7280]">
                Por enquanto, somamos o preço do tipo de ticket para cada
                convidado/inscrição (não separa promo vs normal ainda).
              </div>
              <div className="mt-4">
                <KpiCard label="Total bruto" value={grossSum} kind="money" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-lg font-semibold font-inter text-[#111827]">
                  Convidados / Inscrições
                </div>
                <div className="text-xs text-[#6B7280] font-inter mt-1">
                  Se a pessoa comprou mais de 1 ticket, aparece repetida até
                  indicar os convidados.
                </div>
              </div>
              <div className="text-xs text-[#6B7280] font-inter">
                {loadingAttendees
                  ? "Carregando…"
                  : `${attendees.length} linhas`}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full border-separate border-spacing-0">
                <thead>
                  <tr className="text-left">
                    <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                      Comprador
                    </th>
                    <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                      E-mail
                    </th>
                    <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                      Ticket
                    </th>
                    <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                      Categoria
                    </th>
                    <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                      Convidado
                    </th>
                    <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                      Valor
                    </th>
                    <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                      Check-in
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingAttendees ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-6 text-sm font-inter text-[#6B7280]"
                      >
                        Carregando…
                      </td>
                    </tr>
                  ) : null}

                  {!loadingAttendees && attendees.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-6 text-sm font-inter text-[#6B7280]"
                      >
                        Nenhuma inscrição ainda.
                      </td>
                    </tr>
                  ) : null}

                  {!loadingAttendees
                    ? attendees.map((a) => {
                        const buyerName = a.buyerName || "(sem nome)";
                        const buyerEmail = a.buyerEmail || "–";
                        const guestName =
                          a.externalAttendeeName ||
                          a.externalAttendeeEmail ||
                          "a indicar";

                        return (
                          <tr
                            key={a.eventAttendeeId}
                            className="border-t border-[#F3F4F6]"
                          >
                            <td className="py-3 text-sm font-inter text-[#111827]">
                              {buyerName}
                              {a.buyerPhone ? (
                                <div className="text-xs text-[#6B7280] font-inter mt-1">
                                  {a.buyerPhone}
                                </div>
                              ) : null}
                            </td>
                            <td className="py-3 text-sm font-inter text-[#6B7280]">
                              {buyerEmail}
                            </td>
                            <td className="py-3 text-sm font-inter text-[#6B7280]">
                              {a.ticketNumber || "–"}
                            </td>
                            <td className="py-3 text-sm font-inter text-[#111827]">
                              {a.ticketTypeName || "–"}
                            </td>
                            <td className="py-3 text-sm font-inter text-[#6B7280]">
                              {guestName}
                            </td>
                            <td className="py-3 text-sm font-inter text-[#111827]">
                              {formatMoneyBRL(a.ticketPrice || 0)}
                            </td>
                            <td className="py-3 text-sm font-inter text-[#6B7280]">
                              {a.checkInDate
                                ? formatDateTime(a.checkInDate)
                                : "–"}
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
      ) : (
        <div className="text-sm font-inter text-[#6B7280]">
          {loadingEvent || loadingSummary
            ? "Carregando…"
            : "Evento não encontrado."}
        </div>
      )}
    </AdminShell>
  );
}
