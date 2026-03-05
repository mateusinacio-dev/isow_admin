import { useCallback, useMemo } from "react";
import AutoChoiceCategoryPreview from "./AutoChoiceCategoryPreview";
import { CategoryCard } from "./CategoryCard";

export function CategoriesSection({
  state,
  setState,
  onAddCategory,
  onRemoveCategory,
  onCategoryFieldChange,
  onAddBenefit,
  onBenefitChange,
  onRemoveBenefit,
}) {
  const topCategory = useMemo(() => {
    if (state.kind !== "BENEFITS") {
      return null;
    }
    const cats = Array.isArray(state.categories) ? state.categories : [];
    const valid = cats.filter((c) => String(c?.name || "").trim());
    if (!valid.length) {
      return null;
    }
    const sorted = [...valid].sort((a, b) => {
      const av =
        Number(
          String(a?.monthlyValue || "")
            .replace(/\./g, "")
            .replace(",", "."),
        ) || 0;
      const bv =
        Number(
          String(b?.monthlyValue || "")
            .replace(/\./g, "")
            .replace(",", "."),
        ) || 0;
      return bv - av;
    });
    return sorted[0];
  }, [state.categories, state.kind]);

  const handleAutoChoiceToggle = useCallback(
    (e) => {
      setState((prev) => ({ ...prev, autoChoiceEnabled: e.target.checked }));
    },
    [setState],
  );

  const handleAutoChoiceFieldChange = useCallback(
    (field, value) => {
      setState((prev) => ({ ...prev, [field]: value }));
    },
    [setState],
  );

  const isBenefits = state.kind === "BENEFITS";
  const subtitleText = isBenefits
    ? "Categorias com valor mensal e benefícios (se houver)."
    : "Categorias com valor mensal e meta.";

  return (
    <div className="mt-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold font-inter text-[#111827]">
            Cotas de investimento
          </div>
          <div className="text-xs text-[#6B7280] font-inter mt-1">
            {subtitleText}
          </div>
        </div>

        <button
          type="button"
          onClick={onAddCategory}
          className="h-9 px-4 rounded-full border border-[#E5E7EB] text-sm font-inter"
        >
          + Adicionar categoria
        </button>
      </div>

      {isBenefits ? (
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <label className="inline-flex items-center gap-2 text-sm font-inter text-[#111827] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={Boolean(state.autoChoiceEnabled)}
              onChange={handleAutoChoiceToggle}
            />
            Criar categoria automática "Minha escolha" (anual)
          </label>
        </div>
      ) : null}

      <div className="mt-4 space-y-4">
        {(state.categories || []).map((c, idx) => {
          const isContinuous = state.kind === "CONTINUOUS";
          const canRemove = (state.categories || []).length > 1;

          return (
            <CategoryCard
              key={idx}
              category={c}
              index={idx}
              isContinuous={isContinuous}
              canRemove={canRemove}
              onRemove={() => onRemoveCategory(idx)}
              onFieldChange={(field, value) =>
                onCategoryFieldChange(idx, field, value)
              }
              onAddBenefit={() => onAddBenefit(idx)}
              onBenefitChange={(benefitIdx, field, value) =>
                onBenefitChange(idx, benefitIdx, field, value)
              }
              onRemoveBenefit={(benefitIdx) => onRemoveBenefit(idx, benefitIdx)}
            />
          );
        })}

        {isBenefits ? (
          <AutoChoiceCategoryPreview
            enabled={Boolean(state.autoChoiceEnabled)}
            topCategory={topCategory}
            autoChoiceName={state.autoChoiceName}
            autoChoiceValue={state.autoChoiceValue}
            onFieldChange={handleAutoChoiceFieldChange}
          />
        ) : null}
      </div>
    </div>
  );
}
