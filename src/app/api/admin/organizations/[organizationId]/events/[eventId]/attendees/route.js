import sql from "@/app/api/utils/sql";

export async function GET(request, { params: { organizationId, eventId } }) {
  try {
    // NOTE: organizationId is included for access control consistency even though
    // EventAttendee rows reference only eventId.
    const eventRows = await sql`
      SELECT "eventId"
      FROM public."Event"
      WHERE "eventId" = ${eventId}
        AND "organizationId" = ${organizationId}
        AND "deletedAt" IS NULL
      LIMIT 1
    `;

    if (!eventRows?.[0]?.eventId) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    const rows = await sql`
      SELECT
        ea."eventAttendeeId",
        ea."eventId",
        ea."eventTicketId",
        ea."buyerUserId",
        ea."attendeeUserId",
        ea."externalAttendeeName",
        ea."externalAttendeeEmail",
        ea."externalAttendeePhone",
        ea."creationDate",
        ea."checkInDate",
        et."ticketNumber",
        et.status AS "ticketStatus",
        ett.name AS "ticketTypeName",
        COALESCE(ett."fullPrice", 0) AS "ticketPrice",
        buyer."fullName" AS "buyerName",
        buyer.email AS "buyerEmail",
        buyer."mobilePhone" AS "buyerPhone"
      FROM public."EventAttendee" ea
      LEFT JOIN public."EventTicket" et
        ON et."eventTicketId" = ea."eventTicketId"
      LEFT JOIN public."EventTicketType" ett
        ON ett."eventTicketTypeId" = et."eventTicketTypeId"
      LEFT JOIN public."User" buyer
        ON buyer."userId" = ea."buyerUserId"
      WHERE ea."eventId" = ${eventId}
      ORDER BY COALESCE(buyer."fullName", ea."externalAttendeeName", '') ASC
      LIMIT 2000
    `;

    return Response.json({ attendees: rows });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not load attendees" },
      { status: 500 },
    );
  }
}
