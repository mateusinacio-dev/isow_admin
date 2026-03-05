import sql from "@/app/api/utils/sql";

export async function GET(
  request,
  { params: { organizationId, programId, eventId } },
) {
  try {
    // Guard: program exists
    const [program] = await sql`
      SELECT e."eventId", e."projectId"
      FROM public."Event" e
      WHERE e."eventId" = ${programId}
        AND e."organizationId" = ${organizationId}
        AND e."deletedAt" IS NULL
      LIMIT 1
    `;

    if (!program) {
      return Response.json({ error: "Program not found" }, { status: 404 });
    }

    // Guard: target event exists and is ONPREMISE and related to program (same projectId when present)
    const [evt] = await sql`
      SELECT e."eventId"
      FROM public."Event" e
      LEFT JOIN public."EventType" ety ON ety."eventTypeId" = e."eventTypeId"
      WHERE e."eventId" = ${eventId}
        AND e."organizationId" = ${organizationId}
        AND e."deletedAt" IS NULL
        AND ety.name = 'ONPREMISE'
        AND (
          ${program.projectId}::text IS NULL
          OR e."projectId" = ${program.projectId}
        )
      LIMIT 1
    `;

    if (!evt) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    const rows = await sql`
      SELECT
        u."userId" AS "investorUserId",
        u."fullName" AS "investorName",
        u.email AS "investorEmail",
        COUNT(ea."eventAttendeeId")::int AS "ticketsCount",
        ARRAY_AGG(DISTINCT et."ticketNumber") FILTER (WHERE et."ticketNumber" IS NOT NULL) AS "ticketNumbers",
        ARRAY_AGG(
          DISTINCT COALESCE(au."fullName", ea."externalAttendeeName")
        ) FILTER (
          WHERE COALESCE(au."fullName", ea."externalAttendeeName") IS NOT NULL
        ) AS "indicatedNames"
      FROM public."EventAttendee" ea
      JOIN public."EventTicket" et ON et."eventTicketId" = ea."eventTicketId"
      LEFT JOIN public."User" u ON u."userId" = ea."buyerUserId"
      LEFT JOIN public."User" au ON au."userId" = ea."attendeeUserId"
      WHERE ea."eventId" = ${eventId}
        AND ea."buyerUserId" IS NOT NULL
      GROUP BY u."userId", u."fullName", u.email
      ORDER BY u."fullName" ASC;
    `;

    const investors = rows.map((r) => ({
      investorUserId: r.investorUserId,
      investorName: r.investorName,
      investorEmail: r.investorEmail,
      ticketsCount: Number(r.ticketsCount || 0),
      ticketNumbers: Array.isArray(r.ticketNumbers) ? r.ticketNumbers : [],
      indicatedNames: Array.isArray(r.indicatedNames) ? r.indicatedNames : [],
    }));

    return Response.json({ investors });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not load event investors" },
      { status: 500 },
    );
  }
}
