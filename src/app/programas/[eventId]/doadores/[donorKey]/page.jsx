import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminShell from "../../../../../components/admin/AdminShell";
import KpiCard from "../../../../../components/admin/KpiCard";

const THP_ORGANIZATION_ID = "5d82139a-b663-4ca7-90bc-c60be9227fa8";

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

function formatDate(value) {
  if (!value) {
    return "–";
  }
  try {
    const d = new Date(value);
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return String(value);
  }
}

function churnLabel(churnStatus) {
  const s = String(churnStatus || "").toUpperCase();
  if (s === "ACTIVE") {
    return { label: "Ativa", cls: "bg-[#ECFDF5] text-[#065F46]" };
  }
  if (s === "AT_RISK") {
    return { label: "Em risco", cls: "bg-[#FFFBEB] text-[#92400E]" };
  }
  if (s === "CHURN") {
    return { label: "Churn", cls: "bg-[#FEF2F2] text-[#991B1B]" };
  }
  if (s === "INADIMPLENTE") {
    return { label: "Inadimplente", cls: "bg-[#111827] text-white" };
  }
  return { label: churnStatus || "–", cls: "bg-[#F3F4F6] text-[#374151]" };
}

async function fetchDonorDetails({ organizationId, eventId, donorKey }) {
  const safeKey = encodeURIComponent(String(donorKey || ""));
  const response = await fetch(
    `/api/admin/organizations/${organizationId}/events/${eventId}/donors/${safeKey}`,
  );
  if (!response.ok) {
    throw new Error(
      `When fetching donor details, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

export default function DonorDetailPage({ params: { eventId, donorKey } }) {
  const [organizationId, setOrganizationId] = useState(THP_ORGANIZATION_ID);
  const [activeTab, setActiveTab] = useState("visao_geral");

  const onOrgChange = useCallback((orgId) => {
    setOrganizationId(orgId || THP_ORGANIZATION_ID);
  }, []);

  const decodedDonorKey = useMemo(() => {
    try {
      return decodeURIComponent(String(donorKey || ""));
    } catch {
      return String(donorKey || "");
    }
  }, [donorKey]);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "admin",
      "programa",
      eventId,
      "donor",
      decodedDonorKey,
      organizationId,
    ],
    queryFn: () =>
      fetchDonorDetails({ organizationId, eventId, donorKey: decodedDonorKey }),
    enabled: Boolean(organizationId && eventId && decodedDonorKey),
    networkMode: "always",
  });

  const profile = data?.profile || null;

  const title = useMemo(() => {
    const donorName = profile?.donorName;
    if (!donorName) {
      return "Investidor";
    }
    return `Investidor: ${donorName}`;
  }, [profile?.donorName]);

  const subtitle = useMemo(() => {
    if (isLoading) {
      return "Carregando histórico…";
    }
    return "Detalhes do investidor (histórico de cobranças e recorrência)";
  }, [isLoading]);

  const tabs = useMemo(() => {
    return [
      { id: "visao_geral", label: "Visão geral" },
      { id: "transacoes", label: "Transações" },
      { id: "assinaturas", label: "Assinaturas" },
      { id: "cotas", label: "Cotas" },
    ];
  }, []);

  const tabHeader = (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map((t) => {
        const isActive = activeTab === t.id;
        const activeClass = isActive
          ? "bg-[#111827] text-white border-[#111827]"
          : "bg-white text-[#111827] border-[#E5E7EB]";

        return (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`h-9 px-4 rounded-full border text-sm font-inter ${activeClass}`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );

  const donorIdentifier =
    profile?.donorExternal || profile?.donorLegal || decodedDonorKey || "–";

  const kpiNet = Number(profile?.netTotal || 0);
  const kpiGross = Number(profile?.grossTotal || 0);
  const kpiTx = Number(profile?.transactionsCount || 0);
  const kpiSubs = Number(profile?.subscriptionsCount || 0);
  const kpiRecTx = Number(profile?.recurringTransactionsCount || 0);

  const transactions = data?.transactions || [];
  const subscriptions = data?.subscriptions || [];
  const tickets = data?.tickets || [];

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
            Não foi possível carregar os detalhes do investidor.
          </div>
        </div>
      ) : null}

      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <a
          href={`/programas/${eventId}`}
          className="text-sm font-inter text-[#374151] hover:underline"
        >
          ← Voltar para o Programa
        </a>
        {tabHeader}
      </div>

      {profile ? (
        <div className="space-y-6">
          <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="text-lg font-semibold font-inter text-[#111827]">
                  {profile.donorName || "–"}
                </div>
                <div className="text-sm font-inter text-[#6B7280]">
                  {donorIdentifier}
                </div>
                <div className="text-xs font-inter text-[#6B7280] mt-2">
                  Primeiro pagamento: {formatDate(profile.firstDonationAt)} •
                  Último pagamento: {formatDate(profile.lastDonationAt)}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <KpiCard label="Líquido" value={kpiNet} kind="money" />
                <KpiCard label="Bruto" value={kpiGross} kind="money" />
                <KpiCard label="Transações" value={kpiTx} />
                <KpiCard label="Assinaturas" value={kpiSubs} />
                <KpiCard label="Parcelas" value={kpiRecTx} />
              </div>
            </div>
          </div>

          {activeTab === "visao_geral" ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
                <div className="text-lg font-semibold font-inter text-[#111827] mb-1">
                  Resumo
                </div>
                <div className="text-xs text-[#6B7280] font-inter mb-4">
                  Recorrência é agrupada por subscriptionId.
                </div>

                <div className="space-y-2 text-sm font-inter text-[#111827]">
                  <div>
                    <span className="text-[#6B7280]">Chave:</span>{" "}
                    {decodedDonorKey}
                  </div>
                  <div>
                    <span className="text-[#6B7280]">Assinaturas:</span>{" "}
                    {subscriptions.length}
                  </div>
                  <div>
                    <span className="text-[#6B7280]">Transações:</span>{" "}
                    {transactions.length}
                  </div>
                  <div>
                    <span className="text-[#6B7280]">Tickets/cotas:</span>{" "}
                    {tickets.length}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
                <div className="text-lg font-semibold font-inter text-[#111827] mb-1">
                  Últimas cobranças
                </div>
                <div className="text-xs text-[#6B7280] font-inter mb-4">
                  Mostrando as últimas transações confirmadas.
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[700px] w-full border-separate border-spacing-0">
                    <thead>
                      <tr className="text-left">
                        <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                          Data
                        </th>
                        <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                          Tipo
                        </th>
                        <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                          Subscription
                        </th>
                        <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                          Líquido
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 8).map((t) => (
                        <tr
                          key={t.donationTransactionId}
                          className="border-t border-[#F3F4F6]"
                        >
                          <td className="py-3 text-sm font-inter text-[#6B7280]">
                            {formatDate(t.acquirerTransactionDate)}
                          </td>
                          <td className="py-3 text-sm font-inter text-[#111827]">
                            {t.acquirerTransactionType || "–"}
                          </td>
                          <td className="py-3 text-sm font-inter text-[#111827]">
                            {t.subscriptionId || "–"}
                          </td>
                          <td className="py-3 text-sm font-inter text-[#111827]">
                            {formatMoneyBRL(t.net)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "transacoes" ? (
            <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
              <div className="text-lg font-semibold font-inter text-[#111827] mb-1">
                Transações (confirmadas)
              </div>
              <div className="text-xs text-[#6B7280] font-inter mb-4">
                Inclui a compra inicial do programa e todas as parcelas da
                assinatura (se houver).
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="text-left">
                      <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                        Data
                      </th>
                      <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                        Tipo
                      </th>
                      <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                        Order
                      </th>
                      <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                        Subscription
                      </th>
                      <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                        Bruto
                      </th>
                      <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                        Líquido
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-6 text-sm font-inter text-[#6B7280]"
                        >
                          Nenhuma transação encontrada.
                        </td>
                      </tr>
                    ) : null}

                    {transactions.map((t) => {
                      const order = t.orderId
                        ? String(t.orderId).slice(0, 8)
                        : "–";
                      return (
                        <tr
                          key={t.donationTransactionId}
                          className="border-t border-[#F3F4F6]"
                        >
                          <td className="py-3 text-sm font-inter text-[#6B7280]">
                            {formatDate(t.acquirerTransactionDate)}
                          </td>
                          <td className="py-3 text-sm font-inter text-[#111827]">
                            {t.acquirerTransactionType || "–"}
                          </td>
                          <td className="py-3 text-sm font-inter text-[#111827]">
                            {order}
                          </td>
                          <td className="py-3 text-sm font-inter text-[#111827]">
                            {t.subscriptionId || "–"}
                          </td>
                          <td className="py-3 text-sm font-inter text-[#111827]">
                            {formatMoneyBRL(t.gross)}
                          </td>
                          <td className="py-3 text-sm font-inter text-[#111827]">
                            {formatMoneyBRL(t.net)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {activeTab === "assinaturas" ? (
            <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
              <div className="text-lg font-semibold font-inter text-[#111827] mb-1">
                Assinaturas
              </div>
              <div className="text-xs text-[#6B7280] font-inter mb-4">
                Status por dias desde a última cobrança confirmada: Em risco (≥
                15), Churn (≥ 30), Inadimplente (≥ 60).
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="text-left">
                      <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                        Subscription
                      </th>
                      <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                        Status
                      </th>
                      <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                        Parcelas
                      </th>
                      <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                        Total (líquido)
                      </th>
                      <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                        1ª cobrança
                      </th>
                      <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                        Última cobrança
                      </th>
                      <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                        Dias sem cobrar
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-6 text-sm font-inter text-[#6B7280]"
                        >
                          Nenhuma assinatura encontrada.
                        </td>
                      </tr>
                    ) : null}

                    {subscriptions.map((s) => {
                      const badge = churnLabel(s.churnStatus);

                      return (
                        <tr
                          key={s.subscriptionId}
                          className="border-t border-[#F3F4F6]"
                        >
                          <td className="py-3 text-sm font-inter text-[#111827]">
                            {s.subscriptionId}
                          </td>
                          <td className="py-3 text-sm font-inter">
                            <span
                              className={`inline-flex items-center px-3 h-7 rounded-full text-xs font-semibold ${badge.cls}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 text-sm font-inter text-[#111827]">
                            {s.installments}
                          </td>
                          <td className="py-3 text-sm font-inter text-[#111827]">
                            {formatMoneyBRL(s.netTotal)}
                          </td>
                          <td className="py-3 text-sm font-inter text-[#6B7280]">
                            {formatDate(s.firstChargeAt)}
                          </td>
                          <td className="py-3 text-sm font-inter text-[#6B7280]">
                            {formatDate(s.lastChargeAt)}
                          </td>
                          <td className="py-3 text-sm font-inter text-[#111827]">
                            {Number(s.daysSinceLastCharge || 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {activeTab === "cotas" ? (
            <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
              <div className="text-lg font-semibold font-inter text-[#111827] mb-1">
                Cotas (Tickets)
              </div>
              <div className="text-xs text-[#6B7280] font-inter mb-4">
                Como o investidor entrou no programa (TicketType/Cluster da
                compra inicial).
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="text-left">
                      <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                        TicketType
                      </th>
                      <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                        Cluster
                      </th>
                      <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                        Tickets
                      </th>
                      <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                        Orders
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-6 text-sm font-inter text-[#6B7280]"
                        >
                          Nenhum ticket encontrado para este investidor.
                        </td>
                      </tr>
                    ) : null}

                    {tickets.map((t) => (
                      <tr
                        key={`${t.ticketTypeId}-${t.clusterId}`}
                        className="border-t border-[#F3F4F6]"
                      >
                        <td className="py-3 text-sm font-inter text-[#111827]">
                          {t.ticketTypeName || "–"}
                        </td>
                        <td className="py-3 text-sm font-inter text-[#111827]">
                          {t.clusterName || "–"}
                        </td>
                        <td className="py-3 text-sm font-inter text-[#111827]">
                          {t.ticketsCount}
                        </td>
                        <td className="py-3 text-sm font-inter text-[#111827]">
                          {t.ordersCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-sm font-inter text-[#6B7280]">
          {isLoading ? "Carregando…" : "Investidor não encontrado."}
        </div>
      )}
    </AdminShell>
  );
}
