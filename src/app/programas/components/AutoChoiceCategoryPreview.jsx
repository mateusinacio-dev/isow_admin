export default function AutoChoiceCategoryPreview({
  enabled,
  topCategory,
  autoChoiceName,
  autoChoiceValue,
  onFieldChange,
}) {
  if (!enabled) {
    return null;
  }

  const topName = topCategory?.name ? String(topCategory.name) : null;
  const topValue = topCategory?.monthlyValue
    ? String(topCategory.monthlyValue)
    : null;

  const benefitsEnabled = Boolean(topCategory?.benefitsEnabled);
  const benefits = Array.isArray(topCategory?.benefits)
    ? topCategory.benefits
        .map((b) => ({
          label: String(b?.label || "").trim(),
          quantity: String(b?.quantity || "").trim(),
        }))
        .filter((b) => b.label || b.quantity)
    : [];

  return (
    <div className="border border-[#E5E7EB] rounded-2xl p-4 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold font-inter text-[#111827]">
            Categoria "Minha escolha" (anual)
          </div>
          <div className="text-xs text-[#6B7280] font-inter mt-1">
            O investidor escolhe um valor anual e recebe os benefícios da maior
            categoria.
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-xs font-semibold text-[#6B7280] font-inter mb-1">
            Nome da categoria
          </div>
          <input
            value={autoChoiceName || ""}
            onChange={(e) => onFieldChange("autoChoiceName", e.target.value)}
            className="h-11 w-full px-4 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
            placeholder="Ex: Minha escolha"
          />
        </div>

        <div>
          <div className="text-xs font-semibold text-[#6B7280] font-inter mb-1">
            Valor anual sugerido (R$)
          </div>
          <input
            value={autoChoiceValue || ""}
            onChange={(e) =>
              onFieldChange(
                "autoChoiceValue",
                e.target.value.replace(/[^0-9.,]/g, ""),
              )
            }
            className="h-11 w-full px-4 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
            placeholder="Livre (definido pelo investidor)"
          />
          <div className="text-xs text-[#6B7280] font-inter mt-1">
            Deixe vazio para que o investidor defina o valor.
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold text-[#6B7280] font-inter">
          Benefícios herdados
        </div>
        {(() => {
          if (!topName) {
            return (
              <div className="mt-2 text-sm font-inter text-[#6B7280]">
                Preencha pelo menos uma categoria acima para herdar os
                benefícios.
              </div>
            );
          }

          if (benefitsEnabled && benefits.length) {
            const sourceLabel = topValue
              ? `Da categoria "${topName}" (R$ ${topValue}/mês)`
              : `Da categoria "${topName}"`;

            return (
              <div className="mt-2">
                <div className="text-xs font-inter text-[#6B7280] mb-1">
                  {sourceLabel}
                </div>
                <ul className="text-sm font-inter text-[#111827] list-disc pl-5 space-y-1">
                  {benefits.map((b, i) => {
                    const qty = b.quantity ? ` (${b.quantity})` : "";
                    return <li key={i}>{`${b.label}${qty}`}</li>;
                  })}
                </ul>
              </div>
            );
          }

          const noBenefitsMsg = topName
            ? `A categoria "${topName}" não tem benefícios ativados.`
            : "Nenhum";

          return (
            <div className="mt-2 text-sm font-inter text-[#6B7280]">
              {noBenefitsMsg}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
