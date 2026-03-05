import sql from "@/app/api/utils/sql";

function normalizeDoc(value) {
  return String(value || "")
    .trim()
    .replace(/[^0-9]/g, "");
}

function normalizeText(value) {
  const t = String(value || "").trim();
  return t.length ? t : null;
}

export async function GET(request, { params: { organizationId } }) {
  try {
    const url = new URL(request.url);
    const searchRaw = url.searchParams.get("search") || "";
    const search = String(searchRaw || "").trim();

    // Default: only suppliers linked to this organization.
    if (!search) {
      const rows = await sql`
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
          true as linked
        FROM public."OrganizationSupplier" os
        JOIN public."Supplier" s
          ON s."supplierId" = os."supplierId"
        WHERE os."organizationId" = ${organizationId}
          AND os."deletedAt" IS NULL
          AND s."deletedAt" IS NULL
        ORDER BY COALESCE(s."updatedAt", s."createdAt") DESC
        LIMIT 200
      `;

      return Response.json({ suppliers: rows });
    }

    // When searching, include results from the global supplier base too.
    const docDigits = normalizeDoc(search);
    const likeDoc = docDigits ? `%${docDigits}%` : null;
    const likeName = `%${search}%`;

    const rows = await sql`
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
      WHERE s."deletedAt" IS NULL
        AND (
          (${likeDoc} IS NOT NULL AND s."documentNumber" ILIKE ${likeDoc})
          OR (s."legalName" ILIKE ${likeName})
          OR (s."tradeName" ILIKE ${likeName})
        )
      ORDER BY (os."organizationSupplierId" IS NULL) ASC, COALESCE(s."updatedAt", s."createdAt") DESC
      LIMIT 50
    `;

    return Response.json({ suppliers: rows });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not load suppliers" },
      { status: 500 },
    );
  }
}

export async function POST(request, { params: { organizationId } }) {
  try {
    const body = await request.json();

    const supplierId = normalizeText(body?.supplierId);

    // 1) Link an existing supplier.
    if (supplierId) {
      const [supplier] = await sql`
        SELECT s."supplierId"
        FROM public."Supplier" s
        WHERE s."supplierId" = ${supplierId}
          AND s."deletedAt" IS NULL
        LIMIT 1
      `;

      if (!supplier) {
        return Response.json({ error: "Supplier not found" }, { status: 404 });
      }

      const [existingLink] = await sql`
        SELECT os."organizationSupplierId"
        FROM public."OrganizationSupplier" os
        WHERE os."organizationId" = ${organizationId}
          AND os."supplierId" = ${supplierId}
          AND os."deletedAt" IS NULL
        LIMIT 1
      `;

      if (!existingLink) {
        await sql`
          INSERT INTO public."OrganizationSupplier" (
            "organizationSupplierId",
            "organizationId",
            "supplierId",
            "createdAt",
            "updatedAt"
          ) VALUES (
            uuid_generate_v4(),
            ${organizationId},
            ${supplierId},
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
        `;
      }

      return Response.json({ ok: true, supplierId });
    }

    // 2) Create (or reuse) a supplier by CPF/CNPJ and link it to the org.
    const documentNumber = normalizeDoc(body?.documentNumber);
    const documentTypeRaw = normalizeText(body?.documentType);

    if (!documentNumber) {
      return Response.json(
        { error: "documentNumber is required" },
        { status: 400 },
      );
    }

    const inferredType = documentNumber.length > 11 ? "CNPJ" : "CPF";
    const documentType = documentTypeRaw || inferredType;

    const legalName = normalizeText(body?.legalName);
    const tradeName = normalizeText(body?.tradeName);
    const email = normalizeText(body?.email);
    const phone = normalizeText(body?.phone);
    const address = body?.address ?? null;

    let nextSupplierId = null;

    const [existingSupplier] = await sql`
      SELECT s."supplierId"
      FROM public."Supplier" s
      WHERE s."documentType" = ${documentType}
        AND s."documentNumber" = ${documentNumber}
        AND s."deletedAt" IS NULL
      LIMIT 1
    `;

    if (existingSupplier) {
      nextSupplierId = existingSupplier.supplierId;
    } else {
      const [created] = await sql`
        INSERT INTO public."Supplier" (
          "supplierId",
          "documentType",
          "documentNumber",
          "legalName",
          "tradeName",
          email,
          phone,
          address,
          "createdAt",
          "updatedAt"
        ) VALUES (
          uuid_generate_v4(),
          ${documentType},
          ${documentNumber},
          ${legalName},
          ${tradeName},
          ${email},
          ${phone},
          ${address},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        RETURNING "supplierId"
      `;

      nextSupplierId = created?.supplierId;
    }

    const [existingLink] = await sql`
      SELECT os."organizationSupplierId"
      FROM public."OrganizationSupplier" os
      WHERE os."organizationId" = ${organizationId}
        AND os."supplierId" = ${nextSupplierId}
        AND os."deletedAt" IS NULL
      LIMIT 1
    `;

    if (!existingLink) {
      await sql`
        INSERT INTO public."OrganizationSupplier" (
          "organizationSupplierId",
          "organizationId",
          "supplierId",
          "createdAt",
          "updatedAt"
        ) VALUES (
          uuid_generate_v4(),
          ${organizationId},
          ${nextSupplierId},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `;
    }

    return Response.json({ ok: true, supplierId: nextSupplierId });
  } catch (error) {
    console.error(error);

    // Unique constraint / re-link can surface here.
    const msg = String(error?.message || "");
    if (
      msg.toLowerCase().includes("unique") ||
      msg.toLowerCase().includes("duplicate")
    ) {
      return Response.json(
        { error: "Supplier already exists" },
        { status: 409 },
      );
    }

    return Response.json(
      { error: "Could not create/link supplier" },
      { status: 500 },
    );
  }
}
