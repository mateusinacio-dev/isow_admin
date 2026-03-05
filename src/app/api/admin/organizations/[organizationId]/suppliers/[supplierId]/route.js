import sql from "@/app/api/utils/sql";

function normalizeText(value) {
  const t = String(value || "").trim();
  return t.length ? t : null;
}

export async function GET(request, { params: { organizationId, supplierId } }) {
  try {
    const [row] = await sql`
      SELECT
        s."supplierId",
        s."documentType",
        s."documentNumber",
        s."legalName",
        s."tradeName",
        s.email,
        s.phone,
        s.address,
        s."createdAt",
        s."updatedAt",
        (os."organizationSupplierId" IS NOT NULL) as linked
      FROM public."Supplier" s
      LEFT JOIN public."OrganizationSupplier" os
        ON os."supplierId" = s."supplierId"
        AND os."organizationId" = ${organizationId}
        AND os."deletedAt" IS NULL
      WHERE s."supplierId" = ${supplierId}
        AND s."deletedAt" IS NULL
      LIMIT 1
    `;

    if (!row) {
      return Response.json({ error: "Supplier not found" }, { status: 404 });
    }

    return Response.json({ supplier: row });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Could not load supplier" }, { status: 500 });
  }
}

export async function PATCH(request, { params: { supplierId } }) {
  try {
    const body = await request.json();

    const legalName = normalizeText(body?.legalName);
    const tradeName = normalizeText(body?.tradeName);
    const email = normalizeText(body?.email);
    const phone = normalizeText(body?.phone);
    const address = body?.address ?? null;

    const [updated] = await sql`
      UPDATE public."Supplier" s
      SET
        "legalName" = COALESCE(${legalName}, s."legalName"),
        "tradeName" = COALESCE(${tradeName}, s."tradeName"),
        email = COALESCE(${email}, s.email),
        phone = COALESCE(${phone}, s.phone),
        address = COALESCE(${address}, s.address),
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE s."supplierId" = ${supplierId}
        AND s."deletedAt" IS NULL
      RETURNING
        s."supplierId",
        s."documentType",
        s."documentNumber",
        s."legalName",
        s."tradeName",
        s.email,
        s.phone,
        s.address,
        s."createdAt",
        s."updatedAt"
    `;

    if (!updated) {
      return Response.json({ error: "Supplier not found" }, { status: 404 });
    }

    return Response.json({ supplier: updated });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not update supplier" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request,
  { params: { organizationId, supplierId } },
) {
  try {
    const [row] = await sql`
      UPDATE public."OrganizationSupplier" os
      SET
        "deletedAt" = CURRENT_TIMESTAMP,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE os."organizationId" = ${organizationId}
        AND os."supplierId" = ${supplierId}
        AND os."deletedAt" IS NULL
      RETURNING os."organizationSupplierId"
    `;

    if (!row) {
      return Response.json(
        { error: "Supplier link not found" },
        { status: 404 },
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not unlink supplier" },
      { status: 500 },
    );
  }
}
