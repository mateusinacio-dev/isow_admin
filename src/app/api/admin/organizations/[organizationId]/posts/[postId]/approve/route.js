import sql from "@/app/api/utils/sql";
import { requireOrganizationAccess } from "@/app/api/admin/organizations/utils/authz";
import { auth } from "@/auth";

export async function POST(request, { params: { organizationId, postId } }) {
  try {
    const { response } = await requireOrganizationAccess(organizationId);
    if (response) {
      return response;
    }

    const session = await auth();
    const authUserId = session?.user?.id;

    // Find the User row linked to this auth user
    let approverUserId = null;
    if (authUserId) {
      const [userRow] = await sql(
        'SELECT "userId" FROM public."User" WHERE "userAuthId" = $1 LIMIT 1',
        [String(authUserId)],
      );
      if (userRow) {
        approverUserId = userRow.userId;
      }
    }

    // Verify the post belongs to this organization
    const [post] = await sql(
      `SELECT "postId", status FROM public."Post"
       WHERE "postId" = $1 AND "organizationId" = $2 AND "deletedAt" IS NULL
       LIMIT 1`,
      [postId, organizationId],
    );

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.status === "APPROVED") {
      return Response.json({ message: "Post already approved" });
    }

    const setClauses = [
      "\"status\" = 'APPROVED'",
      '"approvedPublicationAt" = CURRENT_TIMESTAMP',
    ];
    const vals = [postId, organizationId];

    if (approverUserId) {
      setClauses.push(`"approvedByUserId" = $3`);
      vals.push(approverUserId);
    }

    await sql(
      `UPDATE public."Post"
       SET ${setClauses.join(", ")}, "updatedAt" = CURRENT_TIMESTAMP
       WHERE "postId" = $1 AND "organizationId" = $2`,
      vals,
    );

    return Response.json({ message: "Post approved" });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Could not approve post" }, { status: 500 });
  }
}
