import sql from "@/app/api/utils/sql";
import { fetchOrganizationComplianceDocuments } from "@/app/api/admin/organizations/utils/compliance";

function safeDateTime(value) {
  if (!value) {
    return null;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d;
}

function normalizeDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

const CERTIDAO_TYPES = [
  "CND_FEDERAL",
  "CERTIDAO_ESTADUAL",
  "CERTIDAO_MUNICIPAL",
  "CRF_FGTS",
  "CNDT",
];

export async function GET(request, { params: { organizationId } }) {
  try {
    const documents =
      await fetchOrganizationComplianceDocuments(organizationId);
    return Response.json({ documents });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not load compliance documents" },
      { status: 500 },
    );
  }
}

export async function POST(request, { params: { organizationId } }) {
  try {
    const body = await request.json();

    const docType = String(body?.docType || "")
      .trim()
      .toUpperCase();
    const description = String(body?.description || "").trim();
    const fileUrl = String(body?.fileUrl || "").trim();
    const mimeType = String(body?.mimeType || "").trim();

    if (!docType) {
      return Response.json({ error: "docType is required" }, { status: 400 });
    }
    if (!fileUrl) {
      return Response.json({ error: "fileUrl is required" }, { status: 400 });
    }

    const expiresAt = safeDateTime(body?.expiresAt);
    const issuedAt = safeDateTime(body?.issuedAt);
    const registeredAt = safeDateTime(body?.registeredAt);

    const metaRaw =
      body?.meta && typeof body.meta === "object" ? body.meta : {};
    const meta = { ...metaRaw };

    // Validate required fields per document type
    if (CERTIDAO_TYPES.includes(docType) && !expiresAt) {
      return Response.json(
        { error: "expiresAt is required for certificates" },
        { status: 400 },
      );
    }

    if (docType === "ELECTION_MINUTES") {
      const mandateEndsAt = safeDateTime(meta?.mandateEndsAt);
      if (!mandateEndsAt) {
        return Response.json(
          { error: "meta.mandateEndsAt is required for ELECTION_MINUTES" },
          { status: 400 },
        );
      }
    }

    if (docType === "FINANCIAL_STATEMENTS") {
      const year = Number(meta?.year);
      if (!Number.isFinite(year) || year < 1900 || year > 2100) {
        return Response.json(
          { error: "meta.year is required for FINANCIAL_STATEMENTS" },
          { status: 400 },
        );
      }
    }

    if (docType === "CNPJ_CARD") {
      const digits = normalizeDigits(meta?.cnpj);
      if (digits.length !== 14) {
        return Response.json(
          { error: "meta.cnpj is required for CNPJ_CARD" },
          { status: 400 },
        );
      }
    }

    const storageName = `org_${organizationId}_${docType}_${Date.now()}`;

    const [documentRow] = await sql`
      INSERT INTO public."Document" (
        "fileType",
        "fileUrl",
        "ownerType",
        "storageName",
        status,
        "updatedAt"
      ) VALUES (
        ${mimeType || null},
        ${fileUrl},
        'ORGANIZATION',
        ${storageName},
        'ACTIVE',
        CURRENT_TIMESTAMP
      )
      RETURNING "documentId", "fileUrl", "fileType"
    `;

    if (!documentRow?.documentId) {
      return Response.json(
        { error: "Could not create document" },
        { status: 500 },
      );
    }

    const [orgDoc] = await sql`
      INSERT INTO public."OrganizationDocument" (
        "documentId",
        "organizationId",
        "documentDescription",
        type,
        "expiresAt",
        "issuedAt",
        "registeredAt",
        meta,
        "updatedAt"
      ) VALUES (
        ${documentRow.documentId},
        ${organizationId},
        ${description || docType},
        ${docType},
        ${expiresAt},
        ${issuedAt},
        ${registeredAt},
        ${meta},
        CURRENT_TIMESTAMP
      )
      RETURNING "organizationDocumentId"
    `;

    const documents =
      await fetchOrganizationComplianceDocuments(organizationId);

    return Response.json({
      createdId: orgDoc?.organizationDocumentId,
      documents,
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not create compliance document" },
      { status: 500 },
    );
  }
}
