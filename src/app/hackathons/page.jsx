import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminShell from "../../components/admin/AdminShell";
import KpiCard from "../../components/admin/KpiCard";
import EventsTable from "../../components/admin/EventsTable";

const THP_ORGANIZATION_ID = "5d82139a-b663-4ca7-90bc-c60be9227fa8";

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

export default function HackathonsPage() {
  const [organizationId, setOrganizationId] = useState(THP_ORGANIZATION_ID);

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || THP_ORGANIZATION_ID);
  }, []);

  const {
    data: eventsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "org", organizationId, "hackathons"],
    queryFn: () => fetchOrgEvents(organizationId),
    enabled: Boolean(organizationId),
    networkMode: "always",
  });

  const allEvents = eventsData?.events || [];

  const hackathons = useMemo(() => {
    return allEvents.filter((e) => {
      const t = String(e.eventTypeName || "").toUpperCase();
      return t === "FREE_HACKATHON";
    });
  }, [allEvents]);

  const activeHackathons = useMemo(() => {
    return hackathons.filter((e) => {
      const s = String(e.status || "").toUpperCase();
      return s === "PUBLISHED" || s === "STARTED";
    });
  }, [hackathons]);

  return (
    <AdminShell
      title="Hackathons"
      subtitle="Eventos do tipo FREE_HACKATHON (somente leitura)"
      onOrgChange={onOrgChange}
      lockedOrganizationId={THP_ORGANIZATION_ID}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard label="Total" value={hackathons.length} />
          <KpiCard label="Ativos" value={activeHackathons.length} />
          <KpiCard label="Tipo" value="FREE_HACKATHON" />
        </div>

        <EventsTable
          title="Lista de Hackathons"
          subtitle="Aqui mostramos apenas eventos FREE_HACKATHON."
          events={hackathons}
          loading={isLoading}
          error={error}
          organizationId={organizationId}
          linkBase="/hackathons"
          emptyMessage="Nenhum hackathon (FREE_HACKATHON) encontrado para esta ONG."
        />
      </div>
    </AdminShell>
  );
}
