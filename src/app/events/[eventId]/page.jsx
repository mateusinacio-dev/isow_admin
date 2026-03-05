import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminShell from "../../../components/admin/AdminShell";
import KpiCard from "../../../components/admin/KpiCard";
import DonationsChart from "../../../components/admin/DonationsChart";
import DonorsTable from "../../../components/admin/DonorsTable";

const THP_ORGANIZATION_ID = "5d82139a-b663-4ca7-90bc-c60be9227fa8";

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

export default function EventDetailPage({ params: { eventId } }) {
  const [organizationId, setOrganizationId] = useState(THP_ORGANIZATION_ID);

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || THP_ORGANIZATION_ID);
  }, []);

  const {
    data: summary,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "event", eventId, "summary", organizationId],
    queryFn: () => fetchEventSummary(organizationId, eventId),
    enabled: Boolean(organizationId && eventId),
    networkMode: "always",
  });

  const title = summary?.event?.name || "Evento";

  const subtitle = useMemo(() => {
    if (isLoading) {
      return "Carregando painel de arrecadação…";
    }
    return "Arrecadação e investidores (somente leitura)";
  }, [isLoading]);

  const ticketStatusMap = useMemo(() => {
    const map = new Map();
    for (const row of summary?.ticketStatus || []) {
      map.set(row.status, row.count);
    }
    return map;
  }, [summary?.ticketStatus]);

  const sold = ticketStatusMap.get("SOLD") || 0;
  const available = ticketStatusMap.get("AVAILABLE") || 0;
  const locked = ticketStatusMap.get("LOCKED") || 0;

  const grossTotal = summary?.financial?.grossTotal || 0;
  const netTotal = summary?.financial?.netTotal || 0;

  return (
    <AdminShell
      title={title}
      subtitle={subtitle}
      onOrgChange={onOrgChange}
      lockedOrganizationId={THP_ORGANIZATION_ID}
    >
      {error ? (
        <div className="bg-white border border-red-200 rounded-xl p-6">
          <div className="text-sm text-red-600 font-inter">
            Não foi possível carregar o painel do evento.
          </div>
        </div>
      ) : null}

      {summary ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <KpiCard
              label="Arrecadação (líquido)"
              value={netTotal}
              kind="money"
            />
            <KpiCard
              label="Investidores"
              value={summary.financial?.donorsCount || 0}
            />
            <KpiCard
              label="Assinaturas"
              value={summary.financial?.recurringSubscriptions || 0}
            />
            <KpiCard
              label="Parcelas (recorrência)"
              value={summary.financial?.recurringTransactions || 0}
            />
            <KpiCard
              label="Transações"
              value={summary.financial?.transactionsCount || 0}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <DonationsChart
              title="Arrecadação líquida (últimos 30 dias)"
              data={(summary.netLast30Days || []).map((d) => ({
                day: d.day,
                label: String(d.day).slice(5),
                total: d.total,
              }))}
              valueKey="total"
            />

            <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
              <div className="text-lg font-semibold font-inter text-[#111827] mb-4">
                Ingressos
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard label="Vendidos" value={sold} />
                <KpiCard label="Disponíveis" value={available} />
                <KpiCard label="Reservados" value={locked} />
              </div>

              <div className="mt-6">
                <div className="text-sm font-semibold font-inter text-[#111827] mb-2">
                  Tipos de ingresso
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-[520px] w-full border-separate border-spacing-0">
                    <thead>
                      <tr className="text-left">
                        <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                          Tipo
                        </th>
                        <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                          Total
                        </th>
                        <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                          Vendidos
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(summary.ticketTypes || []).map((t) => (
                        <tr key={t.id} className="border-t border-[#F3F4F6]">
                          <td className="py-3 text-sm font-inter text-[#111827]">
                            {t.name || "–"}
                          </td>
                          <td className="py-3 text-sm font-inter text-[#111827]">
                            {t.total}
                          </td>
                          <td className="py-3 text-sm font-inter text-[#111827]">
                            {t.sold}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 text-xs text-[#6B7280] font-inter">
                Receita bruta: {formatMoneyBRL(grossTotal)}
                {" · "}
                Receita líquida: {formatMoneyBRL(netTotal)}
              </div>
              <div className="mt-2 text-xs text-[#6B7280] font-inter">
                Nota: totais vêm da cadeia EventTicket → Order →
                DonationTransaction. Para assinaturas, somamos todas as parcelas
                da mesma subscriptionId.
              </div>
            </div>
          </div>

          <DonorsTable organizationId={organizationId} eventId={eventId} />

          <div className="text-xs text-[#6B7280] font-inter">
            Próximo passo: detalhar “cotas de investimento” do evento usando
            clusters/tipos de ticket + regras de benefícios, e também um painel
            de assinaturas (Subscription) para acompanhar recorrência por
            investidor.
          </div>
        </div>
      ) : (
        <div className="text-sm font-inter text-[#6B7280]">Carregando…</div>
      )}
    </AdminShell>
  );
}
