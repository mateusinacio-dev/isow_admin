import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminShell from "../../../components/admin/AdminShell";
import KpiCard from "../../../components/admin/KpiCard";
import DonationsChart from "../../../components/admin/DonationsChart";

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

export default function HackathonDetailPage({ params: { eventId } }) {
  const [organizationId, setOrganizationId] = useState(THP_ORGANIZATION_ID);

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || THP_ORGANIZATION_ID);
  }, []);

  const {
    data: summary,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "hackathon", eventId, "summary", organizationId],
    queryFn: () => fetchEventSummary(organizationId, eventId),
    enabled: Boolean(organizationId && eventId),
    networkMode: "always",
  });

  const title = useMemo(() => {
    const name = summary?.event?.name;
    if (!name) {
      return "Hackathon";
    }
    return `Hackathon: ${name}`;
  }, [summary?.event?.name]);

  const subtitle = useMemo(() => {
    if (isLoading) {
      return "Carregando hackathon…";
    }
    return "Visão geral (somente leitura)";
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
            Não foi possível carregar os dados do hackathon.
          </div>
        </div>
      ) : null}

      <div className="mb-4">
        <a
          href="/hackathons"
          className="text-sm font-inter text-[#374151] hover:underline"
        >
          ← Voltar para Hackathons
        </a>
      </div>

      {summary ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard label="Participações (vendidos)" value={sold} />
            <KpiCard label="Disponíveis" value={available} />
            <KpiCard label="Reservados" value={locked} />
            <KpiCard
              label="Tipo"
              value={summary.event?.eventTypeName || "FREE_HACKATHON"}
            />
          </div>

          <DonationsChart
            title="Arrecadação líquida (últimos 30 dias)"
            data={(summary.netLast30Days || []).map((d) => ({
              day: d.day,
              label: String(d.day).slice(5),
              total: d.total,
            }))}
            valueKey="total"
          />

          <div className="text-xs text-[#6B7280] font-inter">
            Nota: hackathons normalmente não têm foco em arrecadação; este
            gráfico aparece apenas se existirem transações ligadas aos
            ingressos.
          </div>
        </div>
      ) : (
        <div className="text-sm font-inter text-[#6B7280]">Carregando…</div>
      )}
    </AdminShell>
  );
}
