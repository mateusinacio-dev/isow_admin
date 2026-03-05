function normalizeDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function isBlank(value) {
  return !String(value || "").trim();
}

function isValidEmail(value) {
  const s = String(value || "").trim();
  if (!s) return false;
  // very small check: good enough for UI validation
  return /^\S+@\S+\.[^\s]+$/.test(s);
}

export function validateOrganizationProfileForm(form) {
  const issues = [];
  const fieldErrors = {};

  if (!form) {
    issues.push("Formulário não carregado.");
    return { isValid: false, issues, fieldErrors };
  }

  const requiredFields = [
    { key: "legalName", label: "Razão social" },
    { key: "tradeName", label: "Nome fantasia" },
    { key: "legalIdNumber", label: "CNPJ" },
    { key: "email", label: "E-mail" },
    { key: "phone", label: "Telefone" },
    { key: "addressStreet", label: "Rua" },
    { key: "addressNumber", label: "Número" },
    { key: "addressNeighborhood", label: "Bairro" },
    { key: "addressPostalCode", label: "CEP" },
    { key: "addressCity", label: "Cidade" },
    { key: "addressState", label: "Estado (UF)" },
    { key: "repName", label: "Nome do representante legal" },
    { key: "repEmail", label: "E-mail do representante legal" },
    { key: "repPhone", label: "Telefone do representante legal" },
  ];

  const missing = [];
  for (const field of requiredFields) {
    if (isBlank(form[field.key])) {
      missing.push(field.label);
      fieldErrors[field.key] = "Obrigatório";
    }
  }

  if (missing.length) {
    issues.push(`Preencha os campos obrigatórios: ${missing.join(", ")}.`);
  }

  // Format checks (only if field is present)
  if (!isBlank(form.legalIdNumber)) {
    const digits = normalizeDigits(form.legalIdNumber);
    if (digits.length !== 14) {
      issues.push("CNPJ inválido: precisa ter 14 dígitos.");
      fieldErrors.legalIdNumber = "CNPJ precisa ter 14 dígitos";
    }
  }

  if (!isBlank(form.email) && !isValidEmail(form.email)) {
    issues.push("E-mail inválido.");
    fieldErrors.email = "E-mail inválido";
  }

  if (!isBlank(form.repEmail) && !isValidEmail(form.repEmail)) {
    issues.push("E-mail do representante legal inválido.");
    fieldErrors.repEmail = "E-mail inválido";
  }

  if (!isBlank(form.addressState)) {
    const uf = String(form.addressState || "").trim();
    if (uf.length !== 2) {
      issues.push("Estado (UF) deve ter 2 letras (ex: SP). ");
      fieldErrors.addressState = "Use 2 letras (ex: SP)";
    }
  }

  return { isValid: issues.length === 0, issues, fieldErrors };
}

export const COMPLIANCE_DOC_TYPES = {
  STATUTE: "STATUTE",
  CONSTITUTION_MINUTES: "CONSTITUTION_MINUTES",
  ELECTION_MINUTES: "ELECTION_MINUTES",
  CNPJ_CARD: "CNPJ_CARD",
  FINANCIAL_STATEMENTS: "FINANCIAL_STATEMENTS",
  CND_FEDERAL: "CND_FEDERAL",
  CERTIDAO_ESTADUAL: "CERTIDAO_ESTADUAL",
  CERTIDAO_MUNICIPAL: "CERTIDAO_MUNICIPAL",
  CRF_FGTS: "CRF_FGTS",
  CNDT: "CNDT",
};

const CERTIDAO_TYPES = [
  COMPLIANCE_DOC_TYPES.CND_FEDERAL,
  COMPLIANCE_DOC_TYPES.CERTIDAO_ESTADUAL,
  COMPLIANCE_DOC_TYPES.CERTIDAO_MUNICIPAL,
  COMPLIANCE_DOC_TYPES.CRF_FGTS,
  COMPLIANCE_DOC_TYPES.CNDT,
];

export function getComplianceDocRequirements(docType) {
  const t = String(docType || "").toUpperCase();

  // Defaults: hide special fields (expires/mandate/year/cnpj) unless they matter.
  const base = {
    requiresExpiresAt: false,
    showExpiresAt: false,
    requiresMandateEndsAt: false,
    showMandateEndsAt: false,
    requiresFiscalYear: false,
    showFiscalYear: false,
    requiresCnpj: false,
    showCnpj: false,
    hint: null,
  };

  if (CERTIDAO_TYPES.includes(t)) {
    return {
      ...base,
      requiresExpiresAt: true,
      showExpiresAt: true,
      hint: "Para certidões, informe a data de vencimento.",
    };
  }

  if (t === COMPLIANCE_DOC_TYPES.ELECTION_MINUTES) {
    return {
      ...base,
      requiresMandateEndsAt: true,
      showMandateEndsAt: true,
      hint: "Para a ata de eleição, informe o vencimento do mandato.",
    };
  }

  if (t === COMPLIANCE_DOC_TYPES.FINANCIAL_STATEMENTS) {
    return {
      ...base,
      requiresFiscalYear: true,
      showFiscalYear: true,
      hint: "Para demonstrações contábeis, informe o ano fiscal.",
    };
  }

  if (t === COMPLIANCE_DOC_TYPES.CNPJ_CARD) {
    return {
      ...base,
      requiresCnpj: true,
      showCnpj: true,
      hint: "Sem vencimento. Atualize quando os dados mudarem. Informe o CNPJ exibido no documento.",
    };
  }

  if (t === COMPLIANCE_DOC_TYPES.STATUTE) {
    return {
      ...base,
      hint: "Sem vencimento. Atualize quando o estatuto mudar.",
    };
  }

  if (t === COMPLIANCE_DOC_TYPES.CONSTITUTION_MINUTES) {
    return {
      ...base,
      hint: "Sem vencimento. Depois de enviado, não é necessário atualizar.",
    };
  }

  return base;
}

export function validateComplianceDocForm(docForm) {
  const issues = [];
  const fieldErrors = {};

  const docType = String(docForm?.docType || "")
    .trim()
    .toUpperCase();
  if (!docType) {
    issues.push("Selecione o tipo do documento.");
    fieldErrors.docType = "Selecione";
    return { isValid: false, issues, fieldErrors };
  }

  const req = getComplianceDocRequirements(docType);

  if (req.requiresExpiresAt && isBlank(docForm?.expiresAt)) {
    issues.push("Informe a data de vencimento.");
    fieldErrors.expiresAt = "Obrigatório";
  }

  if (req.requiresMandateEndsAt && isBlank(docForm?.mandateEndsAt)) {
    issues.push("Informe o vencimento do mandato.");
    fieldErrors.mandateEndsAt = "Obrigatório";
  }

  if (req.requiresFiscalYear) {
    const fiscalYearStr = String(docForm?.fiscalYear || "").trim();
    const fiscalYear = Number(fiscalYearStr);
    if (!fiscalYearStr) {
      issues.push("Informe o ano fiscal.");
      fieldErrors.fiscalYear = "Obrigatório";
    } else if (
      !Number.isFinite(fiscalYear) ||
      fiscalYear < 1900 ||
      fiscalYear > 2100
    ) {
      issues.push("Ano fiscal inválido.");
      fieldErrors.fiscalYear = "Ano inválido";
    }
  }

  if (req.requiresCnpj) {
    const digits = normalizeDigits(docForm?.cnpj);
    if (digits.length !== 14) {
      issues.push("CNPJ do documento inválido: precisa ter 14 dígitos.");
      fieldErrors.cnpj = "CNPJ precisa ter 14 dígitos";
    }
  }

  return { isValid: issues.length === 0, issues, fieldErrors };
}
