import sql from "@/app/api/utils/sql";
import {
  isProgramEventTypeName,
  syncProgramTicketTypes,
} from "@/app/api/admin/utils/programTicketTypes";

export async function GET(request, { params: { organizationId } }) {
  try {
    const rows = await sql`
      SELECT
        e."eventId",
        e.name,
        e.status,
        e."startDate",
        e."endDate",
        e."attendanceType",
        e."publishingDate",
        e."logoImageURL" AS "logoImageUrl",
        e."coverImageURL" AS "coverImageUrl",
        e."projectId",
        e."relatedProgramEventId",
        e."adminConfig",
        ety.name AS "eventTypeName",
        (
          SELECT COUNT(*)::int
          FROM public."EventTicket" t
          WHERE t."eventId" = e."eventId"
            AND t."deletedAt" IS NULL
        ) AS "ticketsTotal",
        (
          SELECT COUNT(*)::int
          FROM public."EventTicket" t
          WHERE t."eventId" = e."eventId"
            AND t."deletedAt" IS NULL
            AND t.status = 'SOLD'
        ) AS "ticketsSold",
        (
          SELECT COUNT(*)::int
          FROM public."EventAttendee" a
          WHERE a."eventId" = e."eventId"
        ) AS "attendeesCount",
        (
          SELECT COUNT(*)::int
          FROM public."EventAttendee" a
          WHERE a."eventId" = e."eventId"
            AND a."checkInDate" IS NOT NULL
        ) AS "presentCount"
      FROM public."Event" e
      LEFT JOIN public."EventType" ety
        ON ety."eventTypeId" = e."eventTypeId"
      WHERE e."organizationId" = ${organizationId}
        AND e."deletedAt" IS NULL
      ORDER BY e."startDate" DESC
      LIMIT 200
    `;

    return Response.json({ events: rows });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Could not load events" }, { status: 500 });
  }
}

export async function POST(request, { params: { organizationId } }) {
  try {
    const body = await request.json();

    const name = body?.name || null;
    const startDate = body?.startDate || null;
    const endDate = body?.endDate || null;
    const shortDescription = body?.shortDescription || null;
    const longDescription = body?.longDescription || null;
    const attendanceType = body?.attendanceType || "ONPREMISSES";
    const attendanceAddress = body?.attendanceAddress || null;
    const publishingDate = body?.publishingDate || null;
    const logoImageUrl = body?.logoImageUrl || null;
    const coverImageUrl = body?.coverImageUrl || null;
    const relatedProgramEventId = body?.relatedProgramEventId || null;
    const adminConfig = body?.adminConfig || null;

    // NEW: allow creating different Event types (Programas: STOCKS/CROWDFUNDING)
    const eventTypeName = body?.eventTypeName || null;

    if (!name) {
      return Response.json({ error: "Missing name" }, { status: 400 });
    }

    // If start/end are not provided (e.g. for Program create), use current year range.
    let effectiveStart = startDate;
    let effectiveEnd = endDate;
    if (!effectiveStart || !effectiveEnd) {
      const now = new Date();
      const year = now.getFullYear();
      const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
      const end = new Date(Date.UTC(year, 11, 31, 23, 59, 0));
      effectiveStart = start.toISOString();
      effectiveEnd = end.toISOString();
    }

    // Determine EventTypeId
    const desiredType = eventTypeName
      ? String(eventTypeName).toUpperCase()
      : "ONPREMISE";

    // NEW: limit to 1 program (STOCKS/CROWDFUNDING) per organization
    if (isProgramEventTypeName(desiredType)) {
      const existingProgram = await sql`
        SELECT e."eventId", e.name, e.status, ety.name AS "eventTypeName"
        FROM public."Event" e
        JOIN public."EventType" ety
          ON ety."eventTypeId" = e."eventTypeId"
        WHERE e."organizationId" = ${organizationId}
          AND e."deletedAt" IS NULL
          AND UPPER(ety.name) IN ('STOCKS', 'CROWDFUNDING')
        ORDER BY e."createdAt" DESC
        LIMIT 1
      `;

      if (existingProgram?.length) {
        return Response.json(
          {
            error: "Organization already has a program",
            existingEventId: existingProgram[0].eventId,
            existingProgram: existingProgram[0],
          },
          { status: 409 },
        );
      }
    }

    const ety = await sql`
      SELECT "eventTypeId"
      FROM public."EventType"
      WHERE UPPER(name) = ${desiredType}
      LIMIT 1
    `;

    const eventTypeId = ety?.[0]?.eventTypeId;
    if (!eventTypeId) {
      return Response.json(
        { error: `Missing EventType ${desiredType} in database` },
        { status: 500 },
      );
    }

    const rows = await sql`
      INSERT INTO public."Event" (
        "organizationId",
        "eventTypeId",
        name,
        "startDate",
        "endDate",
        "shortDescription",
        "longDescription",
        "attendanceType",
        "attendanceAddress",
        status,
        "publishingDate",
        "logoImageURL",
        "coverImageURL",
        "relatedProgramEventId",
        "adminConfig"
      ) VALUES (
        ${organizationId},
        ${eventTypeId},
        ${name},
        ${effectiveStart},
        ${effectiveEnd},
        ${shortDescription},
        ${longDescription},
        ${attendanceType},
        ${attendanceAddress ? JSON.stringify(attendanceAddress) : null}::jsonb,
        'DRAFT',
        ${publishingDate},
        ${logoImageUrl},
        ${coverImageUrl},
        ${relatedProgramEventId},
        ${adminConfig ? JSON.stringify(adminConfig) : null}::jsonb
      )
      RETURNING "eventId"
    `;

    const eventId = rows?.[0]?.eventId || null;

    // NEW: keep EventTicketType in sync for Program categories
    if (eventId && isProgramEventTypeName(desiredType)) {
      try {
        const programConfig = adminConfig?.program || null;
        if (programConfig) {
          await syncProgramTicketTypes({ eventId, programConfig });
        }
      } catch (e) {
        // do not fail creation for this
        console.error("syncProgramTicketTypes failed", e);
      }
    }

    return Response.json({ eventId });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Could not create event" }, { status: 500 });
  }
}
