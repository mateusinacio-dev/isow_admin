import sql from "@/app/api/utils/sql";

function safeJson(value) {
  if (value == null) {
    return null;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export async function GET(request, { params: { organizationId, projectId } }) {
  try {
    const [row] = await sql`
      SELECT
        p."projectId",
        p."organizationId",
        p.name,
        p.status,
        p."shortDescription",
        p."longDescription",
        p."startDate",
        p."endDate",
        p.address,
        p.targets,
        p."logoImageUrl",
        p."coverImageUrl",
        p."adminConfig",
        p."createdAt",
        p."updatedAt"
      FROM public."Project" p
      WHERE p."projectId" = ${projectId}
        AND p."organizationId" = ${organizationId}
        AND p."deletedAt" IS NULL
      LIMIT 1
    `;

    if (!row) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    return Response.json({ project: row });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Could not load project" }, { status: 500 });
  }
}

export async function PATCH(
  request,
  { params: { organizationId, projectId } },
) {
  try {
    const body = await request.json();

    const name = body?.name ?? null;
    const status = body?.status ?? null;
    const shortDescription = body?.shortDescription ?? null;
    const longDescription = body?.longDescription ?? null;
    const startDate = body?.startDate ?? null;
    const endDate = body?.endDate ?? null;
    const address = body?.address ?? null;
    const logoImageUrl = body?.logoImageUrl ?? null;
    const coverImageUrl = body?.coverImageUrl ?? null;
    const adminConfig = body?.adminConfig ?? null;

    const rows = await sql`
      UPDATE public."Project"
      SET
        name = ${name},
        status = COALESCE(${status}, status),
        "shortDescription" = ${shortDescription},
        "longDescription" = ${longDescription},
        "startDate" = COALESCE(${startDate}, "startDate"),
        "endDate" = COALESCE(${endDate}, "endDate"),
        address = ${address ? safeJson(address) : null}::jsonb,
        "logoImageUrl" = ${logoImageUrl},
        "coverImageUrl" = ${coverImageUrl},
        "adminConfig" = ${adminConfig ? safeJson(adminConfig) : null}::jsonb,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "projectId" = ${projectId}
        AND "organizationId" = ${organizationId}
        AND "deletedAt" IS NULL
      RETURNING "projectId"
    `;

    if (!rows?.[0]?.projectId) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request,
  { params: { organizationId, projectId } },
) {
  try {
    const rows = await sql`
      UPDATE public."Project"
      SET "deletedAt" = CURRENT_TIMESTAMP,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "projectId" = ${projectId}
        AND "organizationId" = ${organizationId}
        AND "deletedAt" IS NULL
      RETURNING "projectId"
    `;

    if (!rows?.[0]?.projectId) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not delete project" },
      { status: 500 },
    );
  }
}
