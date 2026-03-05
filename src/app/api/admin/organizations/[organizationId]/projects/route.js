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

export async function GET(request, { params: { organizationId } }) {
  try {
    const rows = await sql`
      SELECT
        p."projectId",
        p.name,
        p.status,
        p."shortDescription",
        p."startDate",
        p."endDate",
        p."logoImageUrl",
        p."coverImageUrl",
        p."adminConfig",
        p."createdAt",
        p."updatedAt"
      FROM public."Project" p
      WHERE p."organizationId" = ${organizationId}
        AND p."deletedAt" IS NULL
      ORDER BY p."createdAt" DESC
      LIMIT 200
    `;

    return Response.json({ projects: rows || [] });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Could not load projects" }, { status: 500 });
  }
}

export async function POST(request, { params: { organizationId } }) {
  try {
    const body = await request.json();

    const name = body?.name || null;
    if (!name) {
      return Response.json({ error: "Missing name" }, { status: 400 });
    }

    const shortDescription = body?.shortDescription || null;
    const longDescription = body?.longDescription || null;
    const logoImageUrl = body?.logoImageUrl || null;
    const coverImageUrl = body?.coverImageUrl || null;
    const adminConfig = body?.adminConfig || null;

    // Project table requires startDate/endDate.
    // For creation, we derive them from durationMonths if present, otherwise 12 months.
    const durationMonthsRaw = adminConfig?.durationMonths;
    const durationMonths = Number(durationMonthsRaw || 12);
    const clampedMonths = Number.isFinite(durationMonths)
      ? Math.max(1, Math.min(durationMonths, 120))
      : 12;

    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + clampedMonths);

    const startDate = body?.startDate || now.toISOString();
    const endDate = body?.endDate || end.toISOString();

    const rows = await sql`
      INSERT INTO public."Project" (
        "organizationId",
        name,
        status,
        "shortDescription",
        "longDescription",
        "startDate",
        "endDate",
        "logoImageUrl",
        "coverImageUrl",
        "adminConfig"
      ) VALUES (
        ${organizationId},
        ${name},
        'ACTIVE',
        ${shortDescription},
        ${longDescription},
        ${startDate},
        ${endDate},
        ${logoImageUrl},
        ${coverImageUrl},
        ${adminConfig ? safeJson(adminConfig) : null}::jsonb
      )
      RETURNING "projectId"
    `;

    const projectId = rows?.[0]?.projectId || null;
    return Response.json({ projectId });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not create project" },
      { status: 500 },
    );
  }
}
