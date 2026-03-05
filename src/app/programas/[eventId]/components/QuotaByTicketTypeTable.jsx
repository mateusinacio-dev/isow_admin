import { formatMoneyBRL, formatDate } from "@/utils/formatters";

export function QuotaByTicketTypeTable({ quotaByTicketType }) {
  return (
    <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
      <div className="text-lg font-semibold font-inter text-[#111827] mb-1">
        KPIs por cota
      </div>
      <div className="text-xs text-[#6B7280] font-inter mb-4">
        Arrecadação e recorrência são atribuídas à cota da compra inicial.
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full border-separate border-spacing-0">
          <thead>
            <tr className="text-left">
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Cota
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Vendidos
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Reservados
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Investidores
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Assinaturas
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Parcelas
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Líquido
              </th>
              <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
                Última cobrança
              </th>
            </tr>
          </thead>
          <tbody>
            {quotaByTicketType.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-6 text-sm font-inter text-[#6B7280]"
                >
                  Nenhuma cota encontrada.
                </td>
              </tr>
            ) : null}

            {quotaByTicketType.map((q) => {
              const lastChargeLabel = formatDate(q.financial?.lastChargeAt);
              const netLabel = formatMoneyBRL(q.financial?.netTotal);
              const donorsCount = q.financial?.donorsCount || 0;
              const subsCount = q.financial?.recurringSubscriptions || 0;
              const installments = q.financial?.recurringTransactions || 0;

              return (
                <tr key={q.id} className="border-t border-[#F3F4F6]">
                  <td className="py-3 text-sm font-inter text-[#111827]">
                    {q.name || "–"}
                  </td>
                  <td className="py-3 text-sm font-inter text-[#111827]">
                    {q.sold}
                  </td>
                  <td className="py-3 text-sm font-inter text-[#111827]">
                    {q.locked}
                  </td>
                  <td className="py-3 text-sm font-inter text-[#111827]">
                    {donorsCount}
                  </td>
                  <td className="py-3 text-sm font-inter text-[#111827]">
                    {subsCount}
                  </td>
                  <td className="py-3 text-sm font-inter text-[#111827]">
                    {installments}
                  </td>
                  <td className="py-3 text-sm font-inter text-[#111827]">
                    {netLabel}
                  </td>
                  <td className="py-3 text-sm font-inter text-[#6B7280]">
                    {lastChargeLabel}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
