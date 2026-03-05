export function computeBudgetTotals(budget) {
  const safeBudget = budget || {};

  const sumItems = (items) => {
    if (!Array.isArray(items)) {
      return 0;
    }
    return items.reduce((acc, it) => acc + Number(it.totalValue || 0), 0);
  };

  const sumRubrics =
    sumItems(safeBudget.personnel) +
    sumItems(safeBudget.permanentMaterial) +
    sumItems(safeBudget.consumables) +
    sumItems(safeBudget.travel) +
    sumItems(safeBudget.perDiem) +
    sumItems(safeBudget.freeItems);

  const adminFee = safeBudget.adminFee || { mode: "PERCENT", percent: 0 };
  const per = Math.max(0, Math.min(100, Number(adminFee.percent || 0))) / 100;

  // Formula: PER*(SOMA/(1-PER))
  const adminFeeValue =
    adminFee.mode === "VALUE"
      ? Number(adminFee.value || 0)
      : per > 0 && per < 1
        ? per * (sumRubrics / (1 - per))
        : 0;

  const sumAfterAdmin = sumRubrics + adminFeeValue;

  const taxesPercent =
    Math.max(0, Math.min(100, Number(safeBudget.taxesPercent || 0))) / 100;
  // Taxes: IMP*(SOMAF/(1-IMP))
  const taxesValue =
    taxesPercent > 0 && taxesPercent < 1
      ? taxesPercent * (sumAfterAdmin / (1 - taxesPercent))
      : 0;

  const totalProject = sumAfterAdmin + taxesValue;

  return {
    sumRubrics,
    adminFeeValue,
    taxesValue,
    totalProject,
  };
}
