import sql from "@/app/api/utils/sql";

export async function getTicketStatus(eventId) {
  return await sql`
    SELECT et.status, COUNT(*)::int AS count
    FROM public."EventTicket" et
    WHERE et."eventId" = ${eventId}
      AND et."deletedAt" IS NULL
    GROUP BY et.status
    ORDER BY et.status
  `;
}

export async function getTicketTypes(eventId) {
  return await sql`
    SELECT
      ett."eventTicketTypeId" AS id,
      ett.name,
      COUNT(et."eventTicketId")::int AS total,
      COUNT(*) FILTER (WHERE et.status = 'SOLD')::int AS sold,
      COUNT(*) FILTER (WHERE et.status = 'LOCKED')::int AS locked
    FROM public."EventTicketType" ett
    LEFT JOIN public."EventTicket" et
      ON et."eventTicketTypeId" = ett."eventTicketTypeId"
      AND et."eventId" = ${eventId}
      AND et."deletedAt" IS NULL
    WHERE ett."eventId" = ${eventId}
      AND ett."deletedAt" IS NULL
    GROUP BY ett."eventTicketTypeId", ett.name
    ORDER BY ett.name ASC
  `;
}

export async function getTicketClusters(eventId) {
  return await sql`
    SELECT
      etc."eventTicketClusterId" AS id,
      etc.name,
      COUNT(et."eventTicketId")::int AS total,
      COUNT(*) FILTER (WHERE et.status = 'SOLD')::int AS sold,
      COUNT(*) FILTER (WHERE et.status = 'LOCKED')::int AS locked
    FROM public."EventTicketCluster" etc
    LEFT JOIN public."EventTicket" et
      ON et."eventTicketClusterId" = etc."eventTicketClusterId"
      AND et."eventId" = ${eventId}
      AND et."deletedAt" IS NULL
    WHERE etc."eventId" = ${eventId}
      AND etc."deletedAt" IS NULL
    GROUP BY etc."eventTicketClusterId", etc.name
    ORDER BY etc.name ASC
  `;
}
