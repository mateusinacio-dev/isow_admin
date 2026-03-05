import { formatMoneyBRL } from "@/utils/formatters";

export function BreakdownModal({
  show,
  onClose,
  programYear,
  breakdownPaid,
  breakdownProjected,
}) {
  if (!show) {
    return null;
  }

  const hasProjection = Boolean(
    breakdownProjected && typeof breakdownProjected?.net !== "undefined",
  );

  const gridClassName = hasProjection
    ? "grid grid-cols-1 md:grid-cols-2 gap-4"
    : "grid grid-cols-1 md:grid-cols-1 gap-4";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-[720px] bg-white rounded-2xl border border-[#E5E7EB] shadow-xl">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-[#F3F4F6]">
          <div className="text-base font-semibold font-inter text-[#111827]">
            Total de investimento (ano {programYear || ""})
          </div>
          <button
            className="h-9 px-4 rounded-full border border-[#E5E7EB] text-sm font-inter"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
        <div className="p-4 space-y-4">
          {hasProjection ? (
            <div className="text-sm font-inter text-[#374151]">
              Esse total considera: (1) o que já entrou no ano e (2) uma
              projeção das parcelas recorrentes até 31/12 para assinaturas
              ativas (churn &lt; 30 dias).
            </div>
          ) : (
            <div className="text-sm font-inter text-[#374151]">
              Esse total considera apenas o que foi efetivamente confirmado
              dentro do ano selecionado.
            </div>
          )}

          <div className={gridClassName}>
            <div className="border border-[#E5E7EB] rounded-xl p-4">
              <div className="text-sm font-semibold font-inter text-[#111827] mb-2">
                Pago no ano
              </div>
              <div className="text-sm font-inter text-[#6B7280]">
                Total: {formatMoneyBRL(breakdownPaid?.gross)}
              </div>
              <div className="text-sm font-inter text-[#6B7280]">
                Taxa bancária: {formatMoneyBRL(breakdownPaid?.bankFee)}
              </div>
              <div className="text-sm font-inter text-[#6B7280]">
                Taxa iSOW: {formatMoneyBRL(breakdownPaid?.isowFee)}
              </div>
              <div className="text-sm font-semibold font-inter text-[#111827] mt-2">
                Líquido: {formatMoneyBRL(breakdownPaid?.net)}
              </div>
            </div>

            {hasProjection ? (
              <div className="border border-[#E5E7EB] rounded-xl p-4">
                <div className="text-sm font-semibold font-inter text-[#111827] mb-2">
                  Até 31/12 (pago + projeção)
                </div>
                <div className="text-sm font-inter text-[#6B7280]">
                  Total: {formatMoneyBRL(breakdownProjected?.gross)}
                </div>
                <div className="text-sm font-inter text-[#6B7280]">
                  Taxa bancária: {formatMoneyBRL(breakdownProjected?.bankFee)}
                </div>
                <div className="text-sm font-inter text-[#6B7280]">
                  Taxa iSOW: {formatMoneyBRL(breakdownProjected?.isowFee)}
                </div>
                <div className="text-sm font-semibold font-inter text-[#111827] mt-2">
                  Líquido: {formatMoneyBRL(breakdownProjected?.net)}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
