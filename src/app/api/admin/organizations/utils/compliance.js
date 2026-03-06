import sql from "@/app/api/utils/sql";

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

export const REQUIRED_DOCS = [
  {
    type: COMPLIANCE_DOC_TYPES.STATUTE,
    label: "Estatuto",
    kind: "INSTITUCIONAL",
  },
  {
    type: COMPLIANCE_DOC_TYPES.CONSTITUTION_MINUTES,
    label: "Ata de constituição",
    kind: "INSTITUCIONAL",
  },
  {
    type: COMPLIANCE_DOC_TYPES.ELECTION_MINUTES,
    label: "Ata de eleição da diretoria",
    kind: "INSTITUCIONAL",
  },
  {
    type: COMPLIANCE_DOC_TYPES.CNPJ_CARD,
    label: "Cartão CNPJ",
    kind: "INSTITUCIONAL",
  },
  {
    type: COMPLIANCE_DOC_TYPES.FINANCIAL_STATEMENTS,
    label: "Demonstrações contábeis",
    kind: "INSTITUCIONAL",
  },

  {
    type: COMPLIANCE_DOC_TYPES.CND_FEDERAL,
    label: "CND (Regularidade Fiscal)",
    kind: "CERTIDAO",
  },
  {
    type: COMPLIANCE_DOC_TYPES.CERTIDAO_ESTADUAL,
    label: "Certidão Negativa Estadual",
    kind: "CERTIDAO",
  },
  {
    type: COMPLIANCE_DOC_TYPES.CERTIDAO_MUNICIPAL,
    label: "Certidão Negativa Municipal",
    kind: "CERTIDAO",
  },
  {
    type: COMPLIANCE_DOC_TYPES.CRF_FGTS,
    label: "CRF / Regularidade do FGTS",
    kind: "CERTIDAO",
  },
  {
    type: COMPLIANCE_DOC_TYPES.CNDT,
    label: "CNDT (Débitos Trabalhistas)",
    kind: "CERTIDAO",
  },
];

function toDateOnlyISO(value) {
  if (!value) {
    return null;
  }
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      return null;
    }
    return d.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

function daysBetween(a, b) {
  const MS = 1000 * 60 * 60 * 24;
  const diff = b.getTime() - a.getTime();
  return Math.floor(diff / MS);
}

function normalizeDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function computeComplianceSummary({ organization, documents, now }) {
  const nowDate = now || new Date();

  const latestByType = new Map();
  for (const doc of documents || []) {
    if (!doc?.type) {
      continue;
    }
    if (doc.deletedAt) {
      continue;
    }
    const key = String(doc.type).toUpperCase();
    const existing = latestByType.get(key);
    if (!existing) {
      latestByType.set(key, doc);
      continue;
    }
    const a = new Date(existing.createdAt || 0).getTime();
    const b = new Date(doc.createdAt || 0).getTime();
    if (b > a) {
      latestByType.set(key, doc);
    }
  }

  const items = REQUIRED_DOCS.map((req) => {
    const doc = latestByType.get(req.type);

    const item = {
      type: req.type,
      label: req.label,
      kind: req.kind,
      status: "MISSING", // MISSING | OK | EXPIRING_SOON | EXPIRED | WARNING
      expiresAt: null,
      issuedAt: null,
      registeredAt: null,
      meta: null,
      daysRemaining: null,
      warnings: [],
      organizationDocumentId: doc?.organizationDocumentId || null,
      fileUrl: doc?.fileUrl || null,
    };

    if (!doc) {
      return item;
    }

    item.meta = doc.meta || null;
    item.issuedAt = toDateOnlyISO(doc.issuedAt);
    item.registeredAt = toDateOnlyISO(doc.registeredAt);

    // Special rules
    if (req.type === COMPLIANCE_DOC_TYPES.ELECTION_MINUTES) {
      const mandate =
        doc?.meta?.mandateEndsAt || doc?.meta?.mandateEnds || null;
      const mandateDateISO = toDateOnlyISO(mandate);
      item.expiresAt = mandateDateISO;
      if (!mandateDateISO) {
        item.warnings.push("Data de vencimento do mandato não informada. Atualize a ata.");
        item.status = "WARNING";
      }
    } else if (req.type === COMPLIANCE_DOC_TYPES.FINANCIAL_STATEMENTS) {
      const currentYear = nowDate.getFullYear();
      const requiredYear = currentYear - 1;
      const docYear = Number(doc?.meta?.year || doc?.meta?.fiscalYear || 0);

      const march1 = new Date(currentYear, 2, 1);
      const march31 = new Date(currentYear, 2, 31, 23, 59, 59);

      if (docYear >= requiredYear) {
        item.status = "OK";
      } else if (nowDate > march31) {
        item.status = "EXPIRED";
        item.warnings.push(
          `Demonstração contábil do ano ${requiredYear} não encontrada (prazo março).`,
        );
      } else if (nowDate >= march1) {
        item.status = "EXPIRING_SOON";
        item.warnings.push(
          `Falta enviar a demonstração contábil do ano ${requiredYear} até março.`,
        );
      } else {
        item.status = "WARNING";
        item.warnings.push(
          `Envie a demonstração contábil do ano ${requiredYear} até março.`,
        );
      }

      return item;
    } else {
      item.expiresAt = toDateOnlyISO(doc.expiresAt);
    }

    // CNPJ: aviso de mismatch no tooltip, mas NÃO altera o status
    // (CNPJ_CARD não tem vencimento — quando enviado, sempre OK)
    if (req.type === COMPLIANCE_DOC_TYPES.CNPJ_CARD) {
      const orgCnpj = normalizeDigits(organization?.legalIdNumber);
      const docCnpj = normalizeDigits(doc?.meta?.cnpj);
      if (orgCnpj && docCnpj && orgCnpj !== docCnpj) {
        item.warnings.push(
          "CNPJ do cartão não bate com o CNPJ cadastrado (confira os dados).",
        );
        // Não seta WARNING: cartão CNPJ não vence, status = OK quando enviado
      }
    }

    // Documentos sem data de vencimento
    if (!item.expiresAt) {
      const NO_EXPIRY_TYPES = [
        COMPLIANCE_DOC_TYPES.STATUTE,
        COMPLIANCE_DOC_TYPES.CONSTITUTION_MINUTES,
        COMPLIANCE_DOC_TYPES.CNPJ_CARD,
        COMPLIANCE_DOC_TYPES.ELECTION_MINUTES, // sem mandato = sem vencimento
      ];

      if (NO_EXPIRY_TYPES.includes(req.type)) {
        // Se há warnings (ex: CNPJ mismatch, mandato não informado), mantém WARNING
        // Caso contrário, documento enviado sem vencimento = OK
        if (item.status !== "WARNING") {
          item.status = "OK";
        }
      } else {
        // Outros tipos sem expiresAt (ex: certidão enviada sem data): OK por ora
        // (o usuário precisará informar a data na próxima atualização)
        if (item.status === "MISSING") {
          item.status = "OK";
        }
      }
      return item;
    }

    const exp = new Date(item.expiresAt + "T23:59:59");
    const remaining = daysBetween(nowDate, exp);
    item.daysRemaining = remaining;

    if (remaining < 0) {
      item.status = "EXPIRED";
    } else if (remaining <= 30) {
      item.status = "EXPIRING_SOON";
    } else {
      item.status = item.warnings.length ? "WARNING" : "OK";
    }

    return item;
  });

  const missingCount = items.filter((i) => i.status === "MISSING").length;
  const expiredCount = items.filter((i) => i.status === "EXPIRED").length;
  const expiringSoonCount = items.filter(
    (i) => i.status === "EXPIRING_SOON",
  ).length;
  const warningCount = items.filter((i) => i.status === "WARNING").length;

  const pending = missingCount > 0 || expiredCount > 0;

  const alerts = items
    .filter((i) => i.status === "EXPIRED" || i.status === "EXPIRING_SOON")
    .map((i) => ({
      type: i.type,
      label: i.label,
      status: i.status,
      daysRemaining: i.daysRemaining,
      expiresAt: i.expiresAt,
    }));

  return {
    pending,
    counts: {
      missing: missingCount,
      expired: expiredCount,
      expiringSoon: expiringSoonCount,
      warnings: warningCount,
      totalRequired: items.length,
    },
    alerts,
    items,
  };
}

export async function fetchOrganizationComplianceDocuments(organizationId) {
  const rows = await sql`
    SELECT
      od."organizationDocumentId",
      od.type,
      od."documentDescription",
      od."expiresAt",
      od."issuedAt",
      od."registeredAt",
      od.meta,
      od."createdAt",
      od."updatedAt",
      od."deletedAt" AS "deletedAt",
      d."fileUrl" AS "fileUrl",
      d."fileType" AS "fileType"
    FROM public."OrganizationDocument" od
    JOIN public."Document" d
      ON d."documentId" = od."documentId"
    WHERE od."organizationId" = ${organizationId}
      AND od."deletedAt" IS NULL
    ORDER BY od."createdAt" DESC
  `;
  return rows || [];
}
