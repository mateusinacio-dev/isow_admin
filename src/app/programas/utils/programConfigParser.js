export function buildDefaultBenefitsCategory() {
  return {
    name: "",
    monthlyValue: "",
    benefitsEnabled: false,
    benefits: [{ label: "Tickets para evento", quantity: "" }],
  };
}

// NEW: category automatically created by iSOW
export function buildAutoChoiceCategoryFromTop(topCategory) {
  const benefitsEnabled = Boolean(topCategory?.benefitsEnabled);
  const benefits = Array.isArray(topCategory?.benefits)
    ? topCategory.benefits.map((b) => ({
        label: b?.label || "",
        quantity: b?.quantity != null ? b.quantity : 0,
      }))
    : [];

  return {
    name: "Minha escolha",
    monthlyValue: 0,
    annualOnly: true,
    isAutoChoice: true,
    benefitsEnabled,
    benefits: benefitsEnabled ? benefits : [],
    description:
      "O usuário escolhe um valor anual e recebe os benefícios da maior categoria.",
  };
}

export function buildDefaultContinuousCategory() {
  return {
    name: "",
    monthlyValue: "",
    goalType: "MONEY", // MONEY | QUANTITY
    goalValue: "",
  };
}

function isAutoChoiceCategory(c) {
  if (!c || typeof c !== "object") {
    return false;
  }
  if (c.isAutoChoice === true) {
    return true;
  }
  return (
    String(c.name || "")
      .trim()
      .toLowerCase() === "minha escolha"
  );
}

function pickTopBenefitsCategory(categories) {
  const valid = (categories || []).filter((c) => {
    return String(c?.name || "").trim();
  });

  if (!valid.length) {
    return null;
  }

  // “maior categoria” = maior valor mensal
  valid.sort((a, b) => {
    const av = Number(a?.monthlyValue || 0) || 0;
    const bv = Number(b?.monthlyValue || 0) || 0;
    return bv - av;
  });

  return valid[0];
}

export function parseProgramConfig(event) {
  const cfg = event?.adminConfig?.program || {};

  const kind = cfg?.kind === "CONTINUOUS" ? "CONTINUOUS" : "BENEFITS";

  const categories = Array.isArray(cfg?.categories) ? cfg.categories : [];

  // keep auto category out of the editable list
  const manualCategories = categories.filter((c) => !isAutoChoiceCategory(c));

  const normalizedCategories = manualCategories.length
    ? manualCategories
    : kind === "CONTINUOUS"
      ? [buildDefaultContinuousCategory()]
      : [buildDefaultBenefitsCategory()];

  return {
    kind,
    name: event?.name || "",
    text: event?.shortDescription || "",
    logoImageUrl: event?.logoImageUrl || "",

    hasAttachment: Boolean(cfg?.hasAttachment),
    attachmentUrl: cfg?.attachmentUrl || "",

    maxParticipantsEnabled: Boolean(cfg?.maxParticipantsEnabled),
    maxParticipants: cfg?.maxParticipants ? String(cfg.maxParticipants) : "",

    autoChoiceEnabled: cfg?.autoChoiceEnabled === true,
    autoChoiceName: cfg?.autoChoiceName || "Minha escolha",
    autoChoiceValue:
      cfg?.autoChoiceValue != null ? String(cfg.autoChoiceValue) : "",

    categories: normalizedCategories.map((c) => {
      if (kind === "CONTINUOUS") {
        return {
          name: c?.name || "",
          monthlyValue: c?.monthlyValue != null ? String(c.monthlyValue) : "",
          goalType: c?.goalType === "QUANTITY" ? "QUANTITY" : "MONEY",
          goalValue: c?.goalValue != null ? String(c.goalValue) : "",
        };
      }

      return {
        name: c?.name || "",
        monthlyValue: c?.monthlyValue != null ? String(c.monthlyValue) : "",
        benefitsEnabled: Boolean(c?.benefitsEnabled),
        benefits: Array.isArray(c?.benefits)
          ? c.benefits.map((b) => ({
              label: b?.label || "",
              quantity: b?.quantity != null ? String(b.quantity) : "",
            }))
          : [{ label: "Tickets para evento", quantity: "" }],
      };
    }),
  };
}

export function buildAdminConfigFromState(
  state,
  existingAdminConfig,
  options = {},
) {
  const base =
    existingAdminConfig && typeof existingAdminConfig === "object"
      ? existingAdminConfig
      : {};

  const manualCategories = Array.isArray(state.categories)
    ? state.categories
    : [];

  const program = {
    kind: state.kind,
    hasAttachment: Boolean(state.hasAttachment),
    attachmentUrl: state.hasAttachment ? state.attachmentUrl || "" : "",
    maxParticipantsEnabled: Boolean(state.maxParticipantsEnabled),
    maxParticipants: state.maxParticipantsEnabled
      ? Number(state.maxParticipants || 0) || null
      : null,

    autoChoiceEnabled:
      state.kind === "BENEFITS" ? Boolean(state.autoChoiceEnabled) : false,
    autoChoiceName: state.autoChoiceName || "Minha escolha",
    autoChoiceValue: state.autoChoiceValue || "",

    categories: manualCategories.map((c) => {
      if (state.kind === "CONTINUOUS") {
        return {
          name: c.name || "",
          monthlyValue: Number(c.monthlyValue || 0) || 0,
          goalType: c.goalType === "QUANTITY" ? "QUANTITY" : "MONEY",
          goalValue: c.goalValue ? Number(c.goalValue) : null,
        };
      }

      return {
        name: c.name || "",
        monthlyValue: Number(c.monthlyValue || 0) || 0,
        benefitsEnabled: Boolean(c.benefitsEnabled),
        benefits: Boolean(c.benefitsEnabled)
          ? (c.benefits || []).map((b) => ({
              label: b.label || "",
              quantity: Number(b.quantity || 0) || 0,
            }))
          : [],
      };
    }),
  };

  // NEW: append the automatic “Minha escolha” category
  if (state.kind === "BENEFITS" && program.autoChoiceEnabled) {
    const top = pickTopBenefitsCategory(program.categories);
    const autoChoiceCategory = buildAutoChoiceCategoryFromTop(top);
    autoChoiceCategory.name = state.autoChoiceName || "Minha escolha";
    if (state.autoChoiceValue) {
      autoChoiceCategory.monthlyValue =
        Number(
          String(state.autoChoiceValue).replace(/\./g, "").replace(",", "."),
        ) || 0;
    }
    program.categories = [...program.categories, autoChoiceCategory];
  }

  return {
    ...base,
    program,
    // Allow callers to explicitly set hasPendingChanges; otherwise preserve DB value
    hasPendingChanges:
      "hasPendingChanges" in options
        ? Boolean(options.hasPendingChanges)
        : (base.hasPendingChanges ?? false),
  };
}
