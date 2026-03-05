import sql from "@/app/api/utils/sql";

function safeUpper(s) {
  return String(s || "").toUpperCase();
}

function normalizeName(name) {
  return String(name || "").trim();
}

function buildAnnualName(baseName) {
  const n = normalizeName(baseName);
  if (!n) {
    return "";
  }
  const lower = n.toLowerCase();
  if (lower.includes("(anual)") || lower.endsWith(" anual")) {
    return n;
  }
  return `${n} (anual)`;
}

export async function syncProgramTicketTypes({
  eventId,
  programConfig,
  sqlClient = sql,
}) {
  const kind = programConfig?.kind === "CONTINUOUS" ? "CONTINUOUS" : "BENEFITS";
  const categories = Array.isArray(programConfig?.categories)
    ? programConfig.categories
    : [];

  if (!eventId || categories.length === 0) {
    return { created: 0 };
  }

  // Load existing names (active only)
  const existingRows = await sqlClient`
    SELECT name
    FROM public."EventTicketType"
    WHERE "eventId" = ${eventId}
      AND "deletedAt" IS NULL
  `;

  const existing = new Set(
    (existingRows || []).map((r) => String(r?.name || "")),
  );

  let created = 0;

  for (const c of categories) {
    const rawName = normalizeName(c?.name);
    if (!rawName) {
      continue;
    }

    const isAutoChoice =
      Boolean(c?.isAutoChoice) || rawName.toLowerCase() === "minha escolha";

    const monthlyValue = Number(c?.monthlyValue || 0) || 0;

    // Monthly ticket type
    if (!isAutoChoice) {
      if (!existing.has(rawName)) {
        await sqlClient`
          INSERT INTO public."EventTicketType" (
            "eventId",
            name,
            "fullPrice"
          ) VALUES (
            ${eventId},
            ${rawName},
            ${monthlyValue}
          )
        `;
        existing.add(rawName);
        created += 1;
      }

      // Annual ticket type (programs with benefits always get annual)
      if (kind === "BENEFITS") {
        const annualName = buildAnnualName(rawName);
        const annualValue = Math.max(0, monthlyValue * 12);
        if (annualName && !existing.has(annualName)) {
          await sqlClient`
            INSERT INTO public."EventTicketType" (
              "eventId",
              name,
              "fullPrice"
            ) VALUES (
              ${eventId},
              ${annualName},
              ${annualValue}
            )
          `;
          existing.add(annualName);
          created += 1;
        }
      }
    } else {
      // Auto-choice is annual only and value is defined by the investor in the checkout.
      const annualName = buildAnnualName(rawName);
      if (annualName && !existing.has(annualName)) {
        await sqlClient`
          INSERT INTO public."EventTicketType" (
            "eventId",
            name,
            "fullPrice"
          ) VALUES (
            ${eventId},
            ${annualName},
            0
          )
        `;
        existing.add(annualName);
        created += 1;
      }
    }
  }

  return { created };
}

export function normalizeInvestorCategoryName(name) {
  const n = normalizeName(name);
  if (!n) {
    return "";
  }
  // strip optional "(anual)" for matching allocations
  return n.replace(/\s*\(anual\)\s*$/i, "").trim();
}

export function isProgramEventTypeName(eventTypeName) {
  const t = safeUpper(eventTypeName);
  return t === "STOCKS" || t === "CROWDFUNDING";
}
