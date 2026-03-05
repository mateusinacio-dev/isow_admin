import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

function safeString(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function randomToken() {
  try {
    return crypto.randomUUID();
  } catch {
    return String(Date.now()) + "-" + String(Math.random()).slice(2);
  }
}

async function linkUserToOrganizationsByAdminEmail({ isowUserId, email }) {
  if (!isowUserId || !email) {
    return;
  }

  // 1) Re-activate soft-deleted memberships when the email is listed as an admin.
  await sql`
    UPDATE public."OrganizationUser" ou
    SET
      "deletedAt" = NULL,
      "accessRole" = 'ADMIN',
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE ou."userId" = ${isowUserId}
      AND ou."deletedAt" IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public."Organization" o
        WHERE o."organizationId" = ou."organizationId"
          AND o."deletedAt" IS NULL
          AND EXISTS (
            SELECT 1
            FROM jsonb_array_elements(COALESCE(o."adminConfig"->'admins', '[]'::jsonb)) a
            WHERE LOWER(a->>'emailOrName') = LOWER(${email})
          )
      )
  `;

  // 2) Create new memberships when the email is listed as an admin.
  await sql`
    INSERT INTO public."OrganizationUser" ("organizationId", "userId", "accessRole")
    SELECT
      o."organizationId",
      ${isowUserId},
      'ADMIN'
    FROM public."Organization" o
    WHERE o."deletedAt" IS NULL
      AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(o."adminConfig"->'admins', '[]'::jsonb)) a
        WHERE LOWER(a->>'emailOrName') = LOWER(${email})
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public."OrganizationUser" ou
        WHERE ou."organizationId" = o."organizationId"
          AND ou."userId" = ${isowUserId}
          AND ou."deletedAt" IS NULL
      )
  `;
}

export async function requireSession() {
  const session = await auth();
  const authId = safeString(session?.user?.id);

  if (!authId) {
    return {
      session: null,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { session, response: null };
}

export async function ensureIsowUser(session) {
  const authId = safeString(session?.user?.id);
  if (!authId) {
    return {
      user: null,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const email = safeString(session?.user?.email);
  const name = safeString(session?.user?.name);

  try {
    const [existing] = await sql`
      SELECT u."userId", u."userAuthId", u.email, u."fullName", u."signInProvider"
      FROM public."User" u
      WHERE u."userAuthId" = ${authId}
        AND u."deletedAt" IS NULL
      LIMIT 1
    `;

    if (existing) {
      const currentProvider = existing.signInProvider;
      const hasAnythingProvider = currentProvider === 'ANYTHING';

      const needsBasicSync =
        (email && email !== existing.email) ||
        (name && name !== existing.fullName);

      const needsProviderSync = !hasAnythingProvider;

      if (needsBasicSync || needsProviderSync) {
        await sql`
          UPDATE public."User" u
          SET
            email = COALESCE(${email}, u.email),
            "fullName" = COALESCE(${name}, u."fullName"),
            "signInProvider" = 'ANYTHING',
            "updatedAt" = CURRENT_TIMESTAMP
          WHERE u."userId" = ${existing.userId}
        `;
      }

      // If the org has stored this email in "admins", automatically grant access.
      await linkUserToOrganizationsByAdminEmail({
        isowUserId: existing.userId,
        email,
      });

      return { user: existing, response: null };
    }

    const token = randomToken();
    const [created] = await sql`
      INSERT INTO public."User" (
        "userAuthId",
        "accessStatus",
        "fullName",
        email,
        "sharingToken",
        "signInProvider"
      ) VALUES (
        ${authId},
        'ACTIVE',
        ${name},
        ${email},
        ${token},
        'ANYTHING'
      )
      RETURNING "userId", "userAuthId", email, "fullName", "signInProvider"
    `;

    if (created?.userId) {
      await linkUserToOrganizationsByAdminEmail({
        isowUserId: created.userId,
        email,
      });
    }

    return { user: created || null, response: null };
  } catch (error) {
    console.error("ensureIsowUser error", error);
    return {
      user: null,
      response: Response.json(
        { error: "Internal Server Error" },
        { status: 500 },
      ),
    };
  }
}

export async function requireOrganizationAccess(organizationId) {
  const { session, response: sessionResponse } = await requireSession();
  if (sessionResponse) {
    return { session: null, isowUser: null, response: sessionResponse };
  }

  const { user: isowUser, response: userResponse } =
    await ensureIsowUser(session);
  if (userResponse) {
    return { session, isowUser: null, response: userResponse };
  }

  try {
    const [row] = await sql`
      SELECT ou."organizationUserId", ou."accessRole"
      FROM public."OrganizationUser" ou
      WHERE ou."organizationId" = ${organizationId}
        AND ou."userId" = ${isowUser.userId}
        AND ou."deletedAt" IS NULL
      LIMIT 1
    `;

    if (!row) {
      return {
        session,
        isowUser,
        response: Response.json({ error: "Forbidden" }, { status: 403 }),
      };
    }

    return { session, isowUser, membership: row, response: null };
  } catch (error) {
    console.error("requireOrganizationAccess error", error);
    return {
      session,
      isowUser,
      response: Response.json(
        { error: "Internal Server Error" },
        { status: 500 },
      ),
    };
  }
}
