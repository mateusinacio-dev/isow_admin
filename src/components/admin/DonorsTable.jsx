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

async function fetchDonors({ organizationId, eventId, search, limit, offset }) {
  const url = new URL(
    `/api/admin/organizations/${organizationId}/events/${eventId}/donors`,
    window.location.origin,
  );
  if (search) {
    url.searchParams.set("search", search);
  }
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(
      `When fetching ${url.pathname}, the response was [${response.status}] ${response.statusText}`,
    );
  }
  return response.json();
}

export default function DonorsTable({ organizationId, eventId }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 25;

  const offset = page * limit;

  const queryKey = useMemo(() => {
    return ["admin", "event", eventId, "donors", { search, limit, offset }];
  }, [eventId, limit, offset, search]);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () =>
      fetchDonors({ organizationId, eventId, search, limit, offset }),
    enabled: Boolean(organizationId && eventId),
    networkMode: "always",
  });

  const donors = data?.donors || [];
  const totalCount = data?.page?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-lg font-semibold font-inter text-[#111827]">
            Investidores
          </div>
          <div className="text-xs text-[#6B7280] font-inter">
            Recorrência detectada por subscriptionId (parcelas = número de
            transações confirmadas na assinatura)
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Buscar por nome / email / documento"
            className="h-10 w-full md:w-[320px] px-4 rounded-full bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
          />
        </div>
      </div>

      {error ? (
        <div className="text-sm text-red-600 font-inter">
          Não foi possível carregar os investidores.
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-separate border-spacing-0">
          <thead>
            <tr className="text-left">
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Investidor
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Identificador
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Transações
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Parcelas
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Total (líquido)
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Recorrente
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Último pagamento
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-6 text-sm font-inter text-[#6B7280]"
                >
                  Carregando…
                </td>
              </tr>
            ) : null}
            {!isLoading && donors.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-6 text-sm font-inter text-[#6B7280]"
                >
                  Nenhum investidor encontrado.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? donors.map((d) => {
                  const identifier =
                    d.donorExternal || d.donorLegal || d.donorKey || "–";

                  const installments = d.hasRecurring
                    ? d.recurringTransactionsCount
                    : 0;

                  const recurringLabel = d.hasRecurring
                    ? `Sim (${d.recurringSubscriptions} assinatura${
                        d.recurringSubscriptions === 1 ? "" : "s"
                      })`
                    : "Não";

                  // NOTE: route uses the term "investidores" in the URL.
                  const donorHref = `/programas/${eventId}/investidores/${encodeURIComponent(
                    d.donorKey,
                  )}`;

                  return (
                    <tr key={d.donorKey} className="border-t border-[#F3F4F6]">
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        <a
                          href={donorHref}
                          className="font-semibold hover:underline"
                          title="Abrir detalhes do investidor"
                        >
                          {d.donorName || "–"}
                        </a>
                      </td>
                      <td className="py-3 text-sm font-inter text-[#6B7280]">
                        {identifier}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        {d.transactionsCount}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        {installments}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        {formatMoneyBRL(d.netTotal)}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#111827]">
                        {recurringLabel}
                      </td>
                      <td className="py-3 text-sm font-inter text-[#6B7280]">
                        {formatDate(d.lastDonationAt)}
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
          {totalCount ? `${totalCount} investidores` : ""}
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
