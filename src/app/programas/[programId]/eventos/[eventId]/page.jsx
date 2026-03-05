import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminShell from "../../../../../components/admin/AdminShell";

const THP_ORGANIZATION_ID = "5d82139a-b663-4ca7-90bc-c60be9227fa8";

function formatTicketList(list) {
  const arr = Array.isArray(list) ? list.filter(Boolean) : [];
  if (arr.length === 0) {
    return "–";
  }
  const shown = arr.slice(0, 6);
  const rest = arr.length - shown.length;
  const base = shown.join(", ");
  return rest > 0 ? `${base} (+${rest})` : base;
}

async function fetchEventInvestors({ organizationId, programId, eventId }) {
  const url = `/api/admin/organizations/${organizationId}/programs/${programId}/events/${eventId}/investors`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `When fetching ${url}, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

export default function ProgramEventInvestorsPage({
  params: { programId, eventId },
}) {
  const [organizationId, setOrganizationId] = useState(THP_ORGANIZATION_ID);

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || THP_ORGANIZATION_ID);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "admin",
      "program",
      programId,
      "event",
      eventId,
      "investors",
      organizationId,
    ],
    queryFn: () => fetchEventInvestors({ organizationId, programId, eventId }),
    enabled: Boolean(organizationId && programId && eventId),
    networkMode: "always",
  });

  const investors = data?.investors || [];

  const title = "Investidores do evento";
  const subtitle = useMemo(() => {
    if (isLoading) {
      return "Carregando lista…";
    }
    return "Somente leitura";
  }, [isLoading]);

  return (
    <AdminShell
      title={title}
      subtitle={subtitle}
      onOrgChange={onOrgChange}
      lockedOrganizationId={THP_ORGANIZATION_ID}
    >
      <div className="mb-4">
        <a
          href={`/programas/${programId}`}
          className="text-sm font-inter text-[#374151] hover:underline"
        >
          ← Voltar para o Programa
        </a>
      </div>

      {error ? (
        <div className="bg-white border border-red-200 rounded-xl p-6">
          <div className="text-sm text-red-600 font-inter">
            Não foi possível carregar os investidores desse evento.
          </div>
        </div>
      ) : null}

      <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
        <div className="text-lg font-semibold font-inter text-[#111827] mb-1">
          Relação de investidores
        </div>
        <div className="text-xs text-[#6B7280] font-inter mb-4">
          Ordenado por nome. “Indicados” vem do cadastro do(s) attendee(s) do
          evento.
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left">
                <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                  Investidor
                </th>
                <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                  Tickets
                </th>
                <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                  Números
                </th>
                <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                  Indicados
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-6 text-sm font-inter text-[#6B7280]"
                  >
                    Carregando…
                  </td>
                </tr>
              ) : null}

              {!isLoading && investors.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-6 text-sm font-inter text-[#6B7280]"
                  >
                    Nenhum investidor encontrado.
                  </td>
                </tr>
              ) : null}

              {!isLoading
                ? investors.map((r) => {
                    const indicatedList = Array.isArray(r.indicatedNames)
                      ? r.indicatedNames.filter(Boolean)
                      : [];
                    const indicatedLabel =
                      indicatedList.length > 0
                        ? indicatedList.join(", ")
                        : "a indicar";

                    return (
                      <tr
                        key={r.investorUserId}
                        className="border-t border-[#F3F4F6]"
                      >
                        <td className="py-3 text-sm font-inter text-[#111827]">
                          <div className="font-semibold">
                            {r.investorName || "–"}
                          </div>
                          <div className="text-xs text-[#6B7280] font-inter">
                            {r.investorEmail || ""}
                          </div>
                        </td>
                        <td className="py-3 text-sm font-inter text-[#111827]">
                          {r.ticketsCount}
                        </td>
                        <td className="py-3 text-sm font-inter text-[#6B7280]">
                          {formatTicketList(r.ticketNumbers)}
                        </td>
                        <td className="py-3 text-sm font-inter text-[#111827]">
                          {indicatedLabel}
                        </td>
                      </tr>
                    );
                  })
                : null}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
