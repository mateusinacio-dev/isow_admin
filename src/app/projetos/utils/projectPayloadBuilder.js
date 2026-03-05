import { clampInt, toMoneyNumber } from "./numberUtils";
import { computeBudgetTotals } from "./budgetCalculations";

export function buildPayload(state) {
  const durationMonths = clampInt(state.durationMonths || 12, 1, 120);

  const budgetTotals = computeBudgetTotals({
    ...state.budget,
    taxesPercent: Number(state.budget.taxesPercent || 0),
  });

  const minimumViable = toMoneyNumber(state.budget.minimumViable);

  const adminConfig = {
    summary: state.summary,
    logoImageUrl: state.logoImageUrl,
    images: state.images,
    contacts: state.contacts,
    location: state.location,
    durationMonths,
    beneficiariesDirect: state.beneficiariesDirect
      ? Number(state.beneficiariesDirect)
      : null,
    beneficiariesProfile: state.beneficiariesProfile,
    justification: state.justification,
    goals: state.goals,
    budget: {
      ...state.budget,
      taxesPercent: Number(state.budget.taxesPercent || 0),
      minimumViable,
      totals: budgetTotals,
    },
    partners: state.partners,
    ods: state.ods,
    bankAccount: state.bankAccount,
    investment: state.investment,
    capturedValue: toMoneyNumber(state.capturedValue),
    execution: state.execution,
    customOptions: state.customOptions,
  };

  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + durationMonths);

  return {
    name: state.name,
    shortDescription: state.summary,
    longDescription: state.justification,
    logoImageUrl: state.logoImageUrl,
    coverImageUrl: null,
    adminConfig,
    // We keep dates aligned to duration (can be overwritten when starting execution)
    startDate: now.toISOString(),
    endDate: end.toISOString(),
    address: state.location ? { ...state.location } : null,
  };
}
