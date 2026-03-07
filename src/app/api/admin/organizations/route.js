import sql from "@/app/api/utils/sql";
import {
  ensureIsowUser,
  requireSession,
} from "@/app/api/admin/organizations/utils/authz";

function slugify(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

async function generateUniqueHashtag(base) {
  const start = slugify(base) || "ong";
  for (let i = 0; i < 8; i += 1) {
    const suffix = i === 0 ? "" : `-${String(Math.random()).slice(2, 8)}`;
    const candidate = `${start}${suffix}`;
    const rows = await sql`
      SELECT 1
      FROM public."Organization" o
      WHERE o.hashtag = ${candidate}
      LIMIT 1
    `;
    if (!rows?.length) {
      return candidate;
    }
  }
  return `${start}-${Date.now()}`;
}

export async function GET() {
  try {
    const { session, response } = await requireSession();
    if (response) {
      return response;
    }

    const { user: isowUser, response: userResponse } =
      await ensureIsowUser(session);
    if (userResponse) {
      return userResponse;
    }

    const rows = await sql`
      SELECT
        o."organizationId",
        o."tradeName",
        o."legalName",
        o.hashtag,
        o."logoImageUrl",
        o."createdAt",
        ou."accessRole"
      FROM public."Organization" o
      JOIN public."OrganizationUser" ou
        ON ou."organizationId" = o."organizationId"
        AND ou."userId" = ${isowUser.userId}
        AND ou."deletedAt" IS NULL
      WHERE o."deletedAt" IS NULL
      ORDER BY o."createdAt" DESC
      LIMIT 200
    `;

    return Response.json({ organizations: rows });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not load organizations" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { session, response } = await requireSession();
    if (response) {
      return response;
    }

    const { user: isowUser, response: userResponse } =
      await ensureIsowUser(session);
    if (userResponse) {
      return userResponse;
    }

    const body = await request.json();
    const legalName = body?.legalName?.trim() || null;
    const tradeName = body?.tradeName?.trim() || null;
    const legalIdNumber = body?.legalIdNumber?.trim() || null;

    if (!legalName || !tradeName || !legalIdNumber) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const hashtag = await generateUniqueHashtag(tradeName || legalName);

    const creatorEmail = session?.user?.email || null;

    const [orgRows] = await sql.transaction((txn) => [
      txn`
        INSERT INTO public."Organization" (
          "legalIdNumber",
          "legalName",
          "tradeName",
          type,
          hashtag,
          "adminConfig"
        ) VALUES (
          ${legalIdNumber},
          ${legalName},
          ${tradeName},
          'ONG',
          ${hashtag},
          ${JSON.stringify({
        contact: { email: creatorEmail },
        admins: creatorEmail ? [{ emailOrName: creatorEmail }] : [],
      })}::jsonb
        )
        RETURNING
          "organizationId",
          "legalIdNumber",
          "legalName",
          "tradeName",
          type,
          hashtag,
          "adminConfig",
          "createdAt"
      `,
      txn`
        INSERT INTO public."OrganizationUser" (
          "organizationId",
          "userId",
          "accessRole"
        )
        VALUES (
          (SELECT "organizationId" FROM public."Organization" WHERE hashtag = ${hashtag} LIMIT 1),
          ${isowUser.userId},
          'ADMIN'
        )
      `,
      txn`
        INSERT INTO public."Wallet" (
          "organizationId",
          "ownerType",
          status,
          "accountRestrictions"
        )
        VALUES (
          (SELECT "organizationId" FROM public."Organization" WHERE hashtag = ${hashtag} LIMIT 1),
          'ORGANIZATION',
          'ACTIVE',
          '{}'::jsonb
        )
        ON CONFLICT ("organizationId") DO NOTHING
      `,
    ]);

    const organization = orgRows?.[0] || null;

    return Response.json({ organization });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not create organization" },
      { status: 500 },
    );
  }
}
