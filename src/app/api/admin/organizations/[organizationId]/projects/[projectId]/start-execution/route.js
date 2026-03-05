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

export async function POST(request, { params: { organizationId, projectId } }) {
  try {
    const body = await request.json().catch(() => ({}));
    const startedAt = body?.startedAt || new Date().toISOString();

    const [existing] = await sql`
      SELECT "adminConfig"
      FROM public."Project"
      WHERE "projectId" = ${projectId}
        AND "organizationId" = ${organizationId}
        AND "deletedAt" IS NULL
      LIMIT 1
    `;

    if (!existing) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const currentConfig = existing.adminConfig || {};
    const durationMonths = Number(currentConfig?.durationMonths || 12);
    const clampedMonths = Number.isFinite(durationMonths)
      ? Math.max(1, Math.min(durationMonths, 120))
      : 12;

    const start = new Date(startedAt);
    const end = new Date(start);
    end.setMonth(end.getMonth() + clampedMonths);

    const nextConfig = {
      ...currentConfig,
      execution: {
        ...(currentConfig.execution || {}),
        status: "STARTED",
        startedAt: start.toISOString(),
      },
    };

    const rows = await sql`
      UPDATE public."Project"
      SET
        "startDate" = ${start.toISOString()},
        "endDate" = ${end.toISOString()},
        "adminConfig" = ${safeJson(nextConfig)}::jsonb,
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
      { error: "Could not start execution" },
      { status: 500 },
    );
  }
}
