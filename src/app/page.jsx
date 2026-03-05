import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminShell from "../components/admin/AdminShell";
import KpiCard from "../components/admin/KpiCard";
import Investments12MonthsChart from "../components/admin/Investments12MonthsChart";
import EventsTable from "../components/admin/EventsTable";

async function fetchOrgDashboard(organizationId) {
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/dashboard`,
  );
  if (!response.ok) {
    throw new Error(
      `When fetching /api/admin/organizations/${organizationId}/dashboard, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

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

function programTypeLabel(eventTypeName) {
  const t = String(eventTypeName || "").toUpperCase();
  if (t === "STOCKS") {
    return "Pacotes de benefícios";
  }
  if (t === "CROWDFUNDING") {
    return "Investimento Direto";
  }
  return t || "Programa";
}

function programStatusUi(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PUBLISHED" || s === "STARTED") {
    return {
      label: "Ativo",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }
  if (s === "DRAFT") {
    return {
      label: "Rascunho",
      cls: "bg-yellow-50 text-yellow-800 border-yellow-200",
    };
  }
  if (s === "FINISHED") {
    return {
      label: "Encerrado",
      cls: "bg-gray-50 text-gray-700 border-gray-200",
    };
  }
  if (s) {
    return { label: s, cls: "bg-gray-50 text-gray-700 border-gray-200" };
  }
  return { label: "—", cls: "bg-gray-50 text-gray-700 border-gray-200" };
}

export default function AdminDashboardPage() {
  const [organizationId, setOrganizationId] = useState(null);

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || null);
  }, []);

  const {
    data: dashboard,
    isLoading: loadingDashboard,
    error: errorDashboard,
  } = useQuery({
    queryKey: ["admin", "org", organizationId, "dashboard"],
    queryFn: () => fetchOrgDashboard(organizationId),
    enabled: Boolean(organizationId),
    networkMode: "always",
  });

  const {
    data: eventsData,
    isLoading: loadingEvents,
    error: errorEvents,
  } = useQuery({
    queryKey: ["admin", "org", organizationId, "events"],
    queryFn: () => fetchOrgEvents(organizationId),
    enabled: Boolean(organizationId),
    networkMode: "always",
  });

  const orgName = dashboard?.organization?.tradeName || "Dashboard";

  const subtitle = useMemo(() => {
    if (!organizationId) {
      return "Selecione uma ONG";
    }
    if (loadingDashboard) {
      return "Carregando dados da organização…";
    }
    return "Painel de gestão";
  }, [loadingDashboard, organizationId]);

  const allEvents = eventsData?.events || [];

  const programs = useMemo(() => {
    return allEvents.filter((e) => {
      const t = String(e.eventTypeName || "").toUpperCase();
      return t === "STOCKS" || t === "CROWDFUNDING";
    });
  }, [allEvents]);

  const primaryProgram = useMemo(() => {
    if (!programs.length) {
      return null;
    }

    const active = programs.find((p) => {
      const s = String(p.status || "").toUpperCase();
      return s === "PUBLISHED" || s === "STARTED";
    });

    return active || programs[0];
  }, [programs]);

  const hasProgram = Boolean(primaryProgram);
  const multiplePrograms = programs.length > 1;

  const programTypeText = useMemo(() => {
    return programTypeLabel(primaryProgram?.eventTypeName);
  }, [primaryProgram?.eventTypeName]);

  const programStatus = useMemo(() => {
    return programStatusUi(primaryProgram?.status);
  }, [primaryProgram?.status]);

  const programHref = useMemo(() => {
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

  const compliancePending = Boolean(dashboard?.compliance?.pending);
  const complianceCounts = dashboard?.compliance?.counts || null;
  const complianceAlerts = Array.isArray(dashboard?.compliance?.alerts)
    ? dashboard.compliance.alerts
    : [];

  const approvedPosts = dashboard?.stats?.approvedPosts || 0;
  const pendingPosts = dashboard?.stats?.pendingPosts || 0;

  return (
    <AdminShell title={orgName} subtitle={subtitle} onOrgChange={onOrgChange}>
      {!organizationId ? (
        <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
          <div className="text-sm font-semibold font-inter text-[#111827]">
            Você ainda não selecionou uma ONG
          </div>
          <div className="text-sm font-inter text-[#6B7280] mt-1">
            Se for sua primeira vez, comece cadastrando uma nova ONG.
          </div>
          <div className="mt-4 flex items-center gap-2">
            <a
              href="/associacao/nova"
              className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-black text-white text-sm font-inter hover:bg-black/90"
            >
              Cadastrar nova ONG
            </a>
          </div>
        </div>
      ) : null}

      {errorDashboard ? (
        <div className="bg-white border border-red-200 rounded-xl p-6">
          <div className="text-sm text-red-600 font-inter">
            Não foi possível carregar os dados da ONG.
          </div>
        </div>
      ) : null}

      {organizationId && dashboard ? (
        <div className="space-y-6">
          {compliancePending ? (
            <div className="bg-white border border-red-200 rounded-xl p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-red-700 font-inter">
                    Pendência documental
                  </div>
                  <div className="text-xs text-[#6B7280] font-inter mt-1">
                    {complianceCounts
                      ? `Faltando: ${complianceCounts.missing} • Vencidas: ${complianceCounts.expired} • Próximas do vencimento: ${complianceCounts.expiringSoon}`
                      : "Existem documentos ou certidões que precisam ser atualizados."}
                  </div>
                </div>

                <a
                  href="/associacao"
                  className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-black text-white text-sm font-inter hover:bg-black/90"
                >
                  Ver documentos
                </a>
              </div>
            </div>
          ) : null}

          {!compliancePending && complianceAlerts.length ? (
            <div className="bg-white border border-orange-200 rounded-xl p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[#111827] font-inter">
                    Alertas de vencimento
                  </div>
                  <div className="text-xs text-[#6B7280] font-inter mt-1">
                    {complianceAlerts
                      .slice(0, 3)
                      .map((a) => {
                        const days =
                          a.daysRemaining != null
                            ? `${a.daysRemaining} dias`
                            : "";
                        const when = a.expiresAt ? `(${a.expiresAt})` : "";
                        return `${a.label} ${days} ${when}`.trim();
                      })
                      .join(" • ")}
                  </div>
                </div>

                <a
                  href="/associacao"
                  className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-black text-white text-sm font-inter hover:bg-black/90"
                >
                  Atualizar
                </a>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Projetos ativos"
              value={dashboard.stats?.activeProjects || 0}
            />
            <KpiCard
              label="Projetos encerrados"
              value={dashboard.stats?.closedProjects || 0}
            />
            <KpiCard
              label="Voluntariados ativos"
              value={dashboard.stats?.activeVolunteerings || 0}
            />
            <KpiCard
              label="Voluntariados encerrados"
              value={dashboard.stats?.closedVolunteerings || 0}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Publicações no app"
              value={approvedPosts}
              href="/publicacoes?tab=approved"
            />

            {pendingPosts > 0 ? (
              <a
                href="/publicacoes?tab=pending"
                className="rounded-xl border border-orange-200 bg-orange-50 p-4 md:p-6 block transition-all duration-150 hover:border-orange-300 hover:bg-orange-100/60 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="text-sm font-inter text-[#6B7280] mb-2 whitespace-nowrap">
                    Publicações para avaliar
                  </div>
                  <div className="text-[11px] font-inter text-[#6B7280]">
                    Ver
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold font-inter text-orange-700">
                  {pendingPosts}
                </div>
              </a>
            ) : (
              <KpiCard
                label="Publicações para avaliar"
                value={0}
                href="/publicacoes?tab=pending"
              />
            )}

            <KpiCard
              label="Investimento (mês atual)"
              value={dashboard.stats?.donationsThisMonth || 0}
              kind="money"
            />
            <KpiCard
              label="Programas"
              value={programs.length}
              hint="Pacotes / Direto"
              href="/programas"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard
              label="Eventos ativos"
              value={dashboard.stats?.activeEvents || 0}
              href="/eventos"
            />
          </div>

          <Investments12MonthsChart
            title="Investimento nos últimos 12 meses"
            data={dashboard.investmentsLast12Months || []}
          />

          {/* Move wallet balances right below the financial chart */}
          {dashboard?.wallet ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard
                label="Saldo disponível"
                value={dashboard.wallet.accountBalance}
                kind="money"
              />
              <KpiCard
                label="Saldo bloqueado"
                value={dashboard.wallet.accountBlockedBalance}
                kind="money"
              />
              <KpiCard label="Pontos" value={dashboard.wallet.pointsBalance} />
            </div>
          ) : (
            <div className="text-sm font-inter text-[#6B7280]">
              Esta ONG ainda não tem carteira registrada.
            </div>
          )}

          {!hasProgram ? (
            <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[#111827] font-inter">
                    Próximo passo
                  </div>
                  <div className="text-xs text-[#6B7280] font-inter mt-1">
                    Você pode criar um programa de doação agora, ou deixar para
                    depois.
                  </div>
                </div>
                <a
                  href="/programas/novo"
                  className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-[#7C3AED] text-white text-sm font-inter hover:bg-[#6D28D9]"
                >
                  Criar programa
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[#111827] font-inter">
                    Programa da ONG
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <div className="text-sm font-inter text-[#111827]">
                      {primaryProgram?.name || "Programa"}
                    </div>
                    <div
                      className={`px-2 py-0.5 rounded-full border text-xs font-inter ${programStatus.cls}`}
                    >
                      {programStatus.label}
                    </div>
                    <div className="text-xs font-inter text-[#6B7280]">
                      {programTypeText}
                    </div>
                  </div>
                  {multiplePrograms ? (
                    <div className="text-xs text-orange-700 font-inter mt-2">
                      Atenção: existem {programs.length} programas cadastrados.
                      A partir de agora, vamos manter 1 programa por ONG.
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={programHref}
                    className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-black text-white text-sm font-inter hover:bg-black/90"
                  >
                    Ver programa
                  </a>
                  <a
                    href={programEditHref}
                    className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-white border border-[#E5E7EB] text-[#111827] text-sm font-inter hover:bg-[#F9FAFB]"
                  >
                    Editar
                  </a>
                </div>
              </div>
            </div>
          )}

          <div id="eventos" className="space-y-4">
            <EventsTable
              title="Eventos (da ONG)"
              subtitle="Somente eventos futuros"
              events={futureEvents.slice(0, 12)}
              loading={loadingEvents}
              error={errorEvents}
              organizationId={organizationId}
              linkBase="/events"
              emptyMessage="Nenhum evento futuro encontrado para esta ONG."
            />
          </div>
        </div>
      ) : null}

      {organizationId && !dashboard && loadingDashboard ? (
        <div className="text-sm font-inter text-[#6B7280]">Carregando…</div>
      ) : null}
    </AdminShell>
  );
}
