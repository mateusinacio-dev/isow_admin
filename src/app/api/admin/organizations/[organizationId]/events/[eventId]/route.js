import sql from "@/app/api/utils/sql";
import {
  isProgramEventTypeName,
  syncProgramTicketTypes,
} from "@/app/api/admin/utils/programTicketTypes";

export async function GET(request, { params: { organizationId, eventId } }) {
  try {
    const rows = await sql`
      SELECT
        e."eventId",
        e."organizationId",
        e.name,
        e.status,
        e."startDate",
        e."endDate",
        e."publishingDate",
        e."attendanceType",
        e."attendanceURL",
        e."attendanceAddress",
        e."shortDescription",
        e."longDescription",
        e."logoImageURL" AS "logoImageUrl",
        e."coverImageURL" AS "coverImageUrl",
        e."relatedProgramEventId",
        e."adminConfig",
        ety.name AS "eventTypeName"
      FROM public."Event" e
      LEFT JOIN public."EventType" ety
        ON ety."eventTypeId" = e."eventTypeId"
      WHERE e."eventId" = ${eventId}
        AND e."organizationId" = ${organizationId}
        AND e."deletedAt" IS NULL
      LIMIT 1
    `;

    const event = rows?.[0] || null;
    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    return Response.json({ event });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Could not load event" }, { status: 500 });
  }
}

export async function PATCH(request, { params: { organizationId, eventId } }) {
  try {
    const body = await request.json();

    // NEW: pre-load event type so we can sync Program ticket types when needed
    const existing = await sql`
      SELECT ety.name AS "eventTypeName"
      FROM public."Event" e
      LEFT JOIN public."EventType" ety
        ON ety."eventTypeId" = e."eventTypeId"
      WHERE e."eventId" = ${eventId}
        AND e."organizationId" = ${organizationId}
        AND e."deletedAt" IS NULL
      LIMIT 1
    `;

    const existingType = existing?.[0]?.eventTypeName || null;
    if (!existingType) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    const name = body?.name ?? null;
    const startDate = body?.startDate ?? null;
    const endDate = body?.endDate ?? null;
    const shortDescription = body?.shortDescription ?? null;
    const longDescription = body?.longDescription ?? null;
    const attendanceType = body?.attendanceType ?? null;
    const attendanceUrl = body?.attendanceUrl ?? null;
    const attendanceAddress = body?.attendanceAddress ?? null;
    const publishingDate = body?.publishingDate ?? null;
    const status = body?.status ?? null;
    const logoImageUrl = body?.logoImageUrl ?? null;
    const coverImageUrl = body?.coverImageUrl ?? null;
    const relatedProgramEventId = body?.relatedProgramEventId ?? null;
    const adminConfig = body?.adminConfig ?? null;

    // NEW: if a program is being activated, make sure it's the only active program for this ONG
    const desiredStatus = status ? String(status).toUpperCase() : null;
    const isActivatingProgram =
      isProgramEventTypeName(existingType) &&
      (desiredStatus === "PUBLISHED" || desiredStatus === "STARTED");

    if (isActivatingProgram) {
      await sql`
        UPDATE public."Event" e2
        SET status = 'PRIVATE', "updatedAt" = CURRENT_TIMESTAMP
        FROM public."EventType" et2
        WHERE e2."eventTypeId" = et2."eventTypeId"
          AND e2."organizationId" = ${organizationId}
          AND e2."deletedAt" IS NULL
          AND e2."eventId" <> ${eventId}
          AND UPPER(et2.name) IN ('STOCKS','CROWDFUNDING')
          AND e2.status IN ('PUBLISHED','STARTED')
      `;
    }

    const rows = await sql`
      UPDATE public."Event"
      SET
        name = ${name},
        "startDate" = ${startDate},
        "endDate" = ${endDate},
        "shortDescription" = ${shortDescription},
        "longDescription" = ${longDescription},
        "attendanceType" = ${attendanceType},
        "attendanceURL" = ${attendanceUrl},
        "attendanceAddress" = ${attendanceAddress ? JSON.stringify(attendanceAddress) : null}::jsonb,
        "publishingDate" = ${publishingDate},
        status = COALESCE(${status}, status),
        "logoImageURL" = ${logoImageUrl},
        "coverImageURL" = ${coverImageUrl},
        "relatedProgramEventId" = ${relatedProgramEventId},
        "adminConfig" = ${adminConfig ? JSON.stringify(adminConfig) : null}::jsonb,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "eventId" = ${eventId}
        AND "organizationId" = ${organizationId}
        AND "deletedAt" IS NULL
      RETURNING "eventId"
    `;

    if (!rows?.[0]?.eventId) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    // NEW: keep EventTicketType in sync for Program categories
    if (adminConfig?.program && isProgramEventTypeName(existingType)) {
      try {
        await syncProgramTicketTypes({
          eventId,
          programConfig: adminConfig.program,
        });
      } catch (e) {
        console.error("syncProgramTicketTypes failed", e);
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Could not update event" }, { status: 500 });
  }
}

export async function DELETE(request, { params: { organizationId, eventId } }) {
  try {
    const rows = await sql`
      UPDATE public."Event"
      SET
        "deletedAt" = CURRENT_TIMESTAMP,
        status = 'DELETED',
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "eventId" = ${eventId}
        AND "organizationId" = ${organizationId}
        AND "deletedAt" IS NULL
      RETURNING "eventId"
    `;

    if (!rows?.[0]?.eventId) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Could not delete event" }, { status: 500 });
  }
}
