import sql from "@/app/api/utils/sql";
import { requireOrganizationAccess } from "@/app/api/admin/organizations/utils/authz";

function extractEmails(admins) {
  if (!Array.isArray(admins)) {
    return [];
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
  return admins
    .map((a) =>
      typeof a?.emailOrName === "string" ? a.emailOrName.trim() : "",
    )
    .filter((v) => emailRegex.test(v))
    .map((v) => v.toLowerCase());
}

export async function GET(request, { params: { organizationId } }) {
  try {
    const { response } = await requireOrganizationAccess(organizationId);
    if (response) {
      return response;
    }

    const [org] = await sql`
      SELECT
        o."organizationId",
        o."legalIdNumber",
        o."legalName",
        o."tradeName",
        o.address,
        o."logoImageUrl",
        o."adminConfig",
        o."createdAt",
        o."updatedAt"
      FROM public."Organization" o
      WHERE o."organizationId" = ${organizationId}
        AND o."deletedAt" IS NULL
      LIMIT 1
    `;

    if (!org) {
      return Response.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    return Response.json({ organization: org });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not load organization profile" },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params: { organizationId } }) {
  try {
    const { response } = await requireOrganizationAccess(organizationId);
    if (response) {
      return response;
    }

    const body = await request.json();

    const legalName = body?.legalName ?? null;
    const tradeName = body?.tradeName ?? null;
    const legalIdNumber = body?.legalIdNumber ?? null;
    const address = body?.address ?? null;
    const logoImageUrl = body?.logoImageUrl ?? null;

    const [existing] = await sql`
      SELECT o."adminConfig"
      FROM public."Organization" o
      WHERE o."organizationId" = ${organizationId}
        AND o."deletedAt" IS NULL
      LIMIT 1
    `;

    if (!existing) {
      return Response.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    const prevConfig = existing.adminConfig || {};

    const nextConfig = {
      ...prevConfig,
      contact: {
        ...(prevConfig.contact || {}),
        phone: body?.phone ?? prevConfig?.contact?.phone ?? null,
        email: body?.email ?? prevConfig?.contact?.email ?? null,
        websiteUrl: body?.websiteUrl ?? prevConfig?.contact?.websiteUrl ?? null,
      },
      social: {
        ...(prevConfig.social || {}),
        instagram:
          body?.social?.instagram ?? prevConfig?.social?.instagram ?? null,
        facebook:
          body?.social?.facebook ?? prevConfig?.social?.facebook ?? null,
        linkedin:
          body?.social?.linkedin ?? prevConfig?.social?.linkedin ?? null,
      },
      representativeLegal: {
        ...(prevConfig.representativeLegal || {}),
        ...(body?.representativeLegal || {}),
      },
      admins: Array.isArray(body?.admins)
        ? body.admins
        : prevConfig.admins || [],
    };

    const [updated] = await sql`
      UPDATE public."Organization" o
      SET
        "legalName" = COALESCE(${legalName}, o."legalName"),
        "tradeName" = COALESCE(${tradeName}, o."tradeName"),
        "legalIdNumber" = COALESCE(${legalIdNumber}, o."legalIdNumber"),
        address = COALESCE(${address}, o.address),
        "logoImageUrl" = COALESCE(${logoImageUrl}, o."logoImageUrl"),
        "adminConfig" = ${nextConfig},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE o."organizationId" = ${organizationId}
        AND o."deletedAt" IS NULL
      RETURNING
        o."organizationId",
        o."legalIdNumber",
        o."legalName",
        o."tradeName",
        o.address,
        o."logoImageUrl",
        o."adminConfig",
        o."createdAt",
        o."updatedAt"
    `;

    // If any admin emails already have user accounts, link them immediately.
    const adminEmails = extractEmails(nextConfig.admins);
    if (adminEmails.length) {
      await sql`
        INSERT INTO public."OrganizationUser" ("organizationId", "userId", "accessRole")
        SELECT
          ${organizationId},
          u."userId",
          'ADMIN'
        FROM public."User" u
        WHERE u."deletedAt" IS NULL
          AND u.email IS NOT NULL
          AND LOWER(u.email) = ANY(${adminEmails})
          AND NOT EXISTS (
            SELECT 1
            FROM public."OrganizationUser" ou
            WHERE ou."organizationId" = ${organizationId}
              AND ou."userId" = u."userId"
              AND ou."deletedAt" IS NULL
          )
      `;
    }

    return Response.json({ organization: updated });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not update organization profile" },
      { status: 500 },
    );
  }
}
