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

export async function PATCH(
  request,
  { params: { organizationId, organizationDocumentId } },
) {
  try {
    const body = await request.json();

    const [existing] = await sql`
      SELECT
        od."organizationDocumentId",
        od."expiresAt",
        od."issuedAt",
        od."registeredAt",
        od.meta,
        od."documentDescription"
      FROM public."OrganizationDocument" od
      WHERE od."organizationDocumentId" = ${organizationDocumentId}
        AND od."organizationId" = ${organizationId}
        AND od."deletedAt" IS NULL
      LIMIT 1
    `;

    if (!existing) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    const nextExpiresAt =
      body?.expiresAt === undefined
        ? existing.expiresAt
        : safeDateTime(body.expiresAt);
    const nextIssuedAt =
      body?.issuedAt === undefined
        ? existing.issuedAt
        : safeDateTime(body.issuedAt);
    const nextRegisteredAt =
      body?.registeredAt === undefined
        ? existing.registeredAt
        : safeDateTime(body.registeredAt);

    const nextMeta =
      body?.meta === undefined
        ? existing.meta
        : body?.meta && typeof body.meta === "object"
          ? body.meta
          : null;

    const nextDescription =
      body?.description === undefined
        ? existing.documentDescription
        : String(body.description || "");

    await sql`
      UPDATE public."OrganizationDocument" od
      SET
        "expiresAt" = ${nextExpiresAt},
        "issuedAt" = ${nextIssuedAt},
        "registeredAt" = ${nextRegisteredAt},
        meta = ${nextMeta},
        "documentDescription" = ${nextDescription},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE od."organizationDocumentId" = ${organizationDocumentId}
        AND od."organizationId" = ${organizationId}
        AND od."deletedAt" IS NULL
    `;

    const documents =
      await fetchOrganizationComplianceDocuments(organizationId);
    return Response.json({ documents });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not update compliance document" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request,
  { params: { organizationId, organizationDocumentId } },
) {
  try {
    const [existing] = await sql`
      SELECT "organizationDocumentId"
      FROM public."OrganizationDocument"
      WHERE "organizationDocumentId" = ${organizationDocumentId}
        AND "organizationId" = ${organizationId}
        AND "deletedAt" IS NULL
      LIMIT 1
    `;

    if (!existing) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    await sql`
      UPDATE public."OrganizationDocument"
      SET "deletedAt" = CURRENT_TIMESTAMP,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "organizationDocumentId" = ${organizationDocumentId}
        AND "organizationId" = ${organizationId}
    `;

    const documents =
      await fetchOrganizationComplianceDocuments(organizationId);
    return Response.json({ documents });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not delete compliance document" },
      { status: 500 },
    );
  }
}
