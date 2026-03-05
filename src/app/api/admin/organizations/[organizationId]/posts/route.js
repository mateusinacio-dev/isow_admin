import sql from "@/app/api/utils/sql";
import { requireOrganizationAccess } from "@/app/api/admin/organizations/utils/authz";

export async function GET(request, { params: { organizationId } }) {
  try {
    const { response } = await requireOrganizationAccess(organizationId);
    if (response) {
      return response;
    }

    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status") || "all";

    let statusClause = "";
    const values = [organizationId];

    if (statusFilter === "approved") {
      statusClause = "AND p.status = 'APPROVED'";
    } else if (statusFilter === "pending") {
      statusClause = "AND p.status = 'AWAITING_APPROVAL'";
    }

    const query = `
      SELECT
        p."postId",
        p.caption,
        p."subCaption",
        p."thumbnailUrl",
        p."streamUrl",
        p."ownerType",
        p.status,
        p."organizationId",
        p."projectId",
        p."eventId",
        p."createdAt",
        p."sendByUserId",
        p."approvedPublicationAt",
        p."approvedByUserId",
        u."fullName" AS "senderName",
        u."profilePictureUrl" AS "senderAvatar",
        proj.name AS "projectName",
        ev.name AS "eventName",
        et."eventTypeId",
        etp.name AS "eventTypeName"
      FROM public."Post" p
      LEFT JOIN public."User" u ON u."userId" = p."sendByUserId"
      LEFT JOIN public."Project" proj ON proj."projectId" = p."projectId"
      LEFT JOIN public."Event" ev ON ev."eventId" = p."eventId"
      LEFT JOIN public."EventType" etp ON etp."eventTypeId" = ev."eventTypeId"
      LEFT JOIN public."EventType" et ON et."eventTypeId" = ev."eventTypeId"
      WHERE p."organizationId" = $1
        AND p."deletedAt" IS NULL
        ${statusClause}
      ORDER BY p."createdAt" DESC
      LIMIT 200
    `;

    const rows = await sql(query, values);

    // Group posts by category
    const groups = [];
    const generalPosts = [];
    const programMap = new Map();
    const projectMap = new Map();

    for (const row of rows) {
      const eventType = String(row.eventTypeName || "").toUpperCase();
      const isProgram = eventType === "STOCKS" || eventType === "CROWDFUNDING";

      if (row.projectId && row.projectName) {
        const key = row.projectId;
        if (!projectMap.has(key)) {
          projectMap.set(key, { id: key, name: row.projectName, posts: [] });
        }
        projectMap.get(key).posts.push(row);
      } else if (row.eventId && isProgram) {
        const key = row.eventId;
        if (!programMap.has(key)) {
          programMap.set(key, {
            id: key,
            name: row.eventName || "Programa",
            posts: [],
          });
        }
        programMap.get(key).posts.push(row);
      } else {
        generalPosts.push(row);
      }
    }

    if (generalPosts.length > 0) {
      groups.push({
        key: "general",
        label: "Geral da ONG",
        posts: generalPosts,
      });
    }

    for (const [, prog] of programMap) {
      groups.push({
        key: `program-${prog.id}`,
        label: `Programa ${prog.name}`,
        posts: prog.posts,
      });
    }

    for (const [, proj] of projectMap) {
      groups.push({
        key: `project-${proj.id}`,
        label: proj.name,
        posts: proj.posts,
      });
    }

    return Response.json({ groups, total: rows.length });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Could not load posts" }, { status: 500 });
  }
}
