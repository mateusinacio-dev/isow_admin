import sql from "@/app/api/utils/sql";

export async function getEventById(eventId, organizationId) {
  const [event] = await sql`
    SELECT
      e."eventId",
      e."organizationId",
      e."projectId",
      e.name,
      e.status,
      e."startDate",
      e."endDate",
      e."attendanceType",
      e."attendanceURL",
      e."attendanceAddress",
      e."logoImageURL" AS "logoImageUrl",
      e."coverImageURL" AS "coverImageUrl",
      ety.name AS "eventTypeName"
    FROM public."Event" e
    LEFT JOIN public."EventType" ety
      ON ety."eventTypeId" = e."eventTypeId"
    WHERE e."eventId" = ${eventId}
      AND e."organizationId" = ${organizationId}
      AND e."deletedAt" IS NULL
    LIMIT 1
  `;
  return event;
}

export async function getRelatedEvents(organizationId, eventId, projectId) {
  return await sql`
    WITH base AS (
      SELECT
        e."eventId",
        e.name,
        e."startDate",
        e."endDate",
        (e."attendanceAddress"->>'city') AS city,
        (e."attendanceAddress"->>'state') AS state,
        ety.name AS "eventTypeName",
        COUNT(DISTINCT et."eventTicketId")::int AS "ticketsTotal",
        COUNT(DISTINCT ea."eventAttendeeId")::int AS "attendees",
        COUNT(DISTINCT ea."eventAttendeeId") FILTER (WHERE ea."checkInDate" IS NOT NULL)::int AS "presentes"
      FROM public."Event" e
      LEFT JOIN public."EventType" ety ON ety."eventTypeId" = e."eventTypeId"
      LEFT JOIN public."EventTicket" et
        ON et."eventId" = e."eventId" AND et."deletedAt" IS NULL
      LEFT JOIN public."EventAttendee" ea
        ON ea."eventId" = e."eventId"
      WHERE e."organizationId" = ${organizationId}
        AND e."deletedAt" IS NULL
        AND e."eventId" <> ${eventId}
        AND ety.name = 'ONPREMISE'
        AND (
          ${projectId}::text IS NULL
          OR e."projectId" = ${projectId}
        )
      GROUP BY e."eventId", e.name, e."startDate", e."endDate", city, state, ety.name
    )
    SELECT
      b.*,
      (b.attendees > 0) AS "ticketsSent",
      (b."startDate" >= NOW()) AS "isFuture"
    FROM base b
    ORDER BY b."startDate" ASC;
  `;
}
