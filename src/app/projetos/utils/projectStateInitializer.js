import {
  buildEmptyGoal,
  buildEmptyStage,
  buildEmptyProduct,
  ensureAtLeastOne,
} from "./projectDataHelpers";

const MAX_PROJECT_IMAGES = 4;

export function deriveInitialState(initialProject) {
  const p = initialProject || null;
  const cfg = p?.adminConfig || {};

  const summary = cfg.summary ?? p?.shortDescription ?? "";
  const justification = cfg.justification ?? p?.longDescription ?? "";

  const location = cfg.location || {};

  const goals = ensureAtLeastOne(cfg.goals, buildEmptyGoal);
  const normalizedGoals = goals.map((g) => {
    return {
      ...buildEmptyGoal(),
      ...g,
      stages: (g?.stages || []).map((s) => ({
        ...buildEmptyStage(),
        ...s,
        products: ensureAtLeastOne(s?.products, buildEmptyProduct),
      })),
    };
  });

  const budget = cfg.budget || {};

  const state = {
    name: p?.name || "",
    summary,
    logoImageUrl: p?.logoImageUrl || cfg.logoImageUrl || null,
    images: Array.isArray(cfg.images)
      ? cfg.images.slice(0, MAX_PROJECT_IMAGES)
      : [],

    contacts: ensureAtLeastOne(cfg.contacts, () => ({
      name: "",
      email: "",
      phone: "",
    })),

    location: {
      uf: location.uf || "",
      city: location.city || "",
    },

    durationMonths: cfg.durationMonths ?? "",
    beneficiariesDirect: cfg.beneficiariesDirect ?? "",
    beneficiariesProfile: cfg.beneficiariesProfile ?? "",

    justification,

    goals: normalizedGoals,

    budget: {
      personnel: Array.isArray(budget.personnel) ? budget.personnel : [],
      permanentMaterial: Array.isArray(budget.permanentMaterial)
        ? budget.permanentMaterial
        : [],
      consumables: Array.isArray(budget.consumables) ? budget.consumables : [],
      travel: Array.isArray(budget.travel) ? budget.travel : [],
      perDiem: Array.isArray(budget.perDiem) ? budget.perDiem : [],
      freeItems: Array.isArray(budget.freeItems) ? budget.freeItems : [],
      adminFee: budget.adminFee || { mode: "PERCENT", percent: 0, value: 0 },
      taxesPercent: budget.taxesPercent ?? 0,
      minimumViable: budget.minimumViable ?? "",
    },

    partners: Array.isArray(cfg.partners) ? cfg.partners : [],
    ods: Array.isArray(cfg.ods) ? cfg.ods : [],

    bankAccount: cfg.bankAccount || {
      bankName: "",
      bankCode: "",
      agency: "",
      account: "",
      digit: "",
    },

    investment: cfg.investment || {
      quotas: [{ name: "", value: "" }],
      allowCustom: true,
    },

    capturedValue: cfg.capturedValue ?? "",

    execution: cfg.execution || { status: "NOT_STARTED" },

    customOptions: cfg.customOptions || {
      deliverables: ["Relatório Técnico", "Certificados"],
      verificationSources: ["Lista de presença", "Registro fotográfico"],
    },
  };

  return state;
}
