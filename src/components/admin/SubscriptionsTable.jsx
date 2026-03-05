import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

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

function statusBadge(status) {
  const s = String(status || "").toUpperCase();
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
  return { label: status || "–", cls: "bg-[#F3F4F6] text-[#374151]" };
}

async function fetchSubscriptions({
  organizationId,
  eventId,
  search,
  limit,
  offset,
  status,
  churnDays,
  atRiskDays,
  delinquentDays,
}) {
  const url = new URL(
    `/api/admin/organizations/${organizationId}/events/${eventId}/subscriptions`,
    window.location.origin,
  );

  if (search) {
    url.searchParams.set("search", search);
  }
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("status", String(status || "ALL"));

  // Keep thresholds explicit so behavior is predictable
  url.searchParams.set("churnDays", String(churnDays));
  url.searchParams.set("atRiskDays", String(atRiskDays));
  url.searchParams.set("delinquentDays", String(delinquentDays));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(
      `When fetching ${url.pathname}, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

export default function SubscriptionsTable({ organizationId, eventId }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("ALL");

  // Business rule (per request): churn >= 30 days; inadimplente >= 60 days.
  // "Em risco" is the warning zone.
  const churnDays = 30;
  const delinquentDays = 60;
  const atRiskDays = 15;

  const limit = 25;
  const offset = page * limit;

  const queryKey = useMemo(() => {
    return [
      "admin",
      "event",
      eventId,
      "subscriptions",
      { search, status, limit, offset, churnDays, atRiskDays, delinquentDays },
    ];
  }, [
    atRiskDays,
    churnDays,
    delinquentDays,
    eventId,
    limit,
    offset,
    search,
    status,
  ]);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () =>
      fetchSubscriptions({
        organizationId,
        eventId,
        search,
        limit,
        offset,
        status,
        churnDays,
        atRiskDays,
        delinquentDays,
      }),
    enabled: Boolean(organizationId && eventId),
    networkMode: "always",
  });

  const rows = data?.subscriptions || [];
  const totalCount = data?.meta?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const statusCounts = data?.meta?.statusCounts || null;
  const countActive = statusCounts?.active || 0;
  const countAtRisk = statusCounts?.atRisk || 0;
  const countChurn = statusCounts?.churn || 0;
  const countInadimplente = statusCounts?.inadimplente || 0;
  const countTotal = statusCounts?.total || 0;

  const summaryItems = [
    { label: "Ativas", value: countActive, cls: "bg-[#ECFDF5] text-[#065F46]" },
    {
      label: "Em risco",
      value: countAtRisk,
      cls: "bg-[#FFFBEB] text-[#92400E]",
    },
    { label: "Churn", value: countChurn, cls: "bg-[#FEF2F2] text-[#991B1B]" },
    {
      label: "Inadimplentes",
      value: countInadimplente,
      cls: "bg-[#111827] text-white",
    },
    {
      label: "Total",
      value: countTotal,
      cls: "bg-[#F3F4F6] text-[#374151]",
    },
  ];

  const statusTabs = [
    { id: "ALL", label: "Todas" },
    { id: "AT_RISK", label: "Somente em risco" },
    { id: "CHURN", label: "Somente churn" },
    { id: "INADIMPLENTE", label: "Somente inadimplente" },
  ];

  return (
    <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-lg font-semibold font-inter text-[#111827]">
            Assinaturas (recorrência)
          </div>
          <div className="text-xs text-[#6B7280] font-inter">
            Churn = ≥ {churnDays} dias sem cobrança • Inadimplente = ≥{" "}
            {delinquentDays} dias
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Buscar por nome / email / doc / subscriptionId"
            className="h-10 w-full sm:w-[340px] px-4 rounded-full bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
          />
        </div>
      </div>

      {/* Summary counters (respect current search term; ignores status tab) */}
      {statusCounts ? (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {summaryItems.map((it) => {
            const label = `${it.label}: ${it.value}`;
            return (
              <div
                key={it.label}
                className={`inline-flex items-center px-3 h-8 rounded-full text-xs font-semibold font-inter ${it.cls}`}
              >
                {label}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {statusTabs.map((t) => {
          const active = status === t.id;
          const cls = active
            ? "bg-[#111827] text-white border-[#111827]"
            : "bg-white text-[#111827] border-[#E5E7EB]";

          return (
            <button
              key={t.id}
              onClick={() => {
                setStatus(t.id);
                setPage(0);
              }}
              className={`h-9 px-4 rounded-full border text-sm font-inter ${cls}`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="text-sm text-red-600 font-inter">
          Não foi possível carregar as assinaturas.
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full border-separate border-spacing-0">
          <thead>
            <tr className="text-left">
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Investidor
              </th>
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
            {isLoading ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-6 text-sm font-inter text-[#6B7280]"
                >
                  Carregando…
                </td>
              </tr>
            ) : null}

            {!isLoading && rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-6 text-sm font-inter text-[#6B7280]"
                >
                  Nenhuma assinatura encontrada.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? rows.map((r) => {
                  const identifier =
                    r.donorExternal || r.donorLegal || r.donorKey || "–";
                  const badge = statusBadge(r.churnStatus);

                  const donorHref = `/programas/${eventId}/investidores/${encodeURIComponent(
                    r.donorKey,
                  )}`;

                  return (
                    <tr
                      key={`${r.subscriptionId}-${r.donorKey}`}
                      className="border-t border-[#F3F4F6]"
                    >
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        <div className="font-semibold">
                          <a
                            href={donorHref}
                            className="hover:underline"
                            title="Abrir detalhes do investidor"
                          >
                            {r.donorName || "–"}
                          </a>
                        </div>
                        <div className="text-xs text-[#6B7280] font-inter">
                          {identifier}
                        </div>
                      </td>
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        {r.subscriptionId}
                      </td>
                      <td className="py-3 text-sm font-inter">
                        <span
                          className={`inline-flex items-center px-3 h-7 rounded-full text-xs font-semibold ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        {r.installments}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        {formatMoneyBRL(r.netTotal)}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#6B7280]">
                        {formatDate(r.firstChargeAt)}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#6B7280]">
                        {formatDate(r.lastChargeAt)}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        {Number(r.daysSinceLastCharge || 0)}
                      </td>
                    </tr>
                  );
                })
              : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-xs text-[#6B7280] font-inter">
          {totalCount ? `${totalCount} assinatura(s)` : ""}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="h-9 px-4 rounded-full border border-[#E5E5E5] text-sm font-inter disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Anterior
          </button>
          <div className="text-sm font-inter text-[#6B7280]">
            {page + 1} / {totalPages}
          </div>
          <button
            className="h-9 px-4 rounded-full border border-[#E5E5E5] text-sm font-inter disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page + 1 >= totalPages}
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
}
