import sql from "@/app/api/utils/sql";
import { requireOrganizationAccess } from "@/app/api/admin/organizations/utils/authz";

async function getWallet(organizationId) {
  const [wallet] = await sql`
    SELECT
      w."walletId",
      w."organizationId",
      w."ownerType",
      w.status,
      w.virtual,
      w."bankName",
      w."bankNumber",
      w."bankBranchNumber",
      w."bankAccountNumber",
      w."pixKey",
      w."updatedAt",
      w."createdAt"
    FROM public."Wallet" w
    WHERE w."organizationId" = ${organizationId}
      AND w."deletedAt" IS NULL
    LIMIT 1
  `;
  return wallet || null;
}

export async function GET(request, { params: { organizationId } }) {
  try {
    const { response } = await requireOrganizationAccess(organizationId);
    if (response) {
      return response;
    }

    const wallet = await getWallet(organizationId);
    return Response.json({ wallet });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not load bank account" },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params: { organizationId } }) {
  try {
    const { response } = await requireOrganizationAccess(organizationId);
    if (response) {
      return response;
    }

    const body = await request.json();
    const bankName = body?.bankName ?? null;
    const bankNumber = body?.bankNumber ?? null;
    const bankBranchNumber = body?.bankBranchNumber ?? null;
    const bankAccountNumber = body?.bankAccountNumber ?? null;
    const pixKey = body?.pixKey ?? null;

    const existing = await getWallet(organizationId);

    if (!existing) {
      const [created] = await sql`
        INSERT INTO public."Wallet" (
          "organizationId",
          "ownerType",
          status,
          "accountRestrictions",
          virtual
        ) VALUES (
          ${organizationId},
          'ORGANIZATION',
          'ACTIVE',
          ${{}},
          true
        )
        RETURNING "walletId"
      `;

      if (!created?.walletId) {
        return Response.json(
          { error: "Could not create wallet" },
          { status: 500 },
        );
      }
    }

    const [updated] = await sql`
      UPDATE public."Wallet" w
      SET
        "bankName" = COALESCE(${bankName}, w."bankName"),
        "bankNumber" = COALESCE(${bankNumber}, w."bankNumber"),
        "bankBranchNumber" = COALESCE(${bankBranchNumber}, w."bankBranchNumber"),
        "bankAccountNumber" = COALESCE(${bankAccountNumber}, w."bankAccountNumber"),
        "pixKey" = COALESCE(${pixKey}, w."pixKey"),
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE w."organizationId" = ${organizationId}
        AND w."deletedAt" IS NULL
      RETURNING
        w."walletId",
        w."organizationId",
        w."ownerType",
        w.status,
        w.virtual,
        w."bankName",
        w."bankNumber",
        w."bankBranchNumber",
        w."bankAccountNumber",
        w."pixKey",
        w."updatedAt",
        w."createdAt"
    `;

    return Response.json({ wallet: updated });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not update bank account" },
      { status: 500 },
    );
  }
}
