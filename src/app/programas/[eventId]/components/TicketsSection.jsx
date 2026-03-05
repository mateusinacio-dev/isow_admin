import KpiCard from "@/components/admin/KpiCard";

export function TicketsSection({ sold, available, locked, ticketTypes }) {
  return (
    <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 md:p-6">
      <div className="text-lg font-semibold font-inter text-[#111827] mb-4">
        Ingressos / Cotas
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
              {(ticketTypes || []).map((t) => (
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
        Nota: para programas (Pacote de Benefícios / Investimento Direto), a
        visão de investidores inclui recorrência via subscriptionId.
      </div>
    </div>
  );
}
