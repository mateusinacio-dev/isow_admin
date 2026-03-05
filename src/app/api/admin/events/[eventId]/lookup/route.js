import sql from "@/app/api/utils/sql";

/**
 * Lightweight lookup: given an eventId, return basic info including the
 * organizationId.  This allows the frontend to discover the owning org
 * when it only knows the eventId (e.g. after creating a program and
 * redirecting to its detail/edit page).
 */
export async function GET(request, { params: { eventId } }) {
  try {
    const rows = await sql`
      SELECT
        e."eventId",
        e."organizationId",
        e.name,
        e.status,
        ety.name AS "eventTypeName"
      FROM public."Event" e
      LEFT JOIN public."EventType" ety
        ON ety."eventTypeId" = e."eventTypeId"
      WHERE e."eventId" = ${eventId}
        AND e."deletedAt" IS NULL
      LIMIT 1
    `;

    const event = rows?.[0] || null;
    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    return Response.json({
      eventId: event.eventId,
      organizationId: event.organizationId,
      name: event.name,
      status: event.status,
      eventTypeName: event.eventTypeName,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Could not look up event" }, { status: 500 });
  }
}
