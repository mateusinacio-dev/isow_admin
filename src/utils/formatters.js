export function formatMoneyBRL(value) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value || 0));
  } catch {
    return String(value);
  }
}

export function formatDate(value) {
  if (!value) {
    return "–";
  }
  try {
    const d = new Date(value);
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return String(value);
  }
}

export function formatIsoDateLabel(value) {
  // Avoid Date() parsing here to prevent timezone shifts.
  // Accepts either "YYYY-MM-DD" or an ISO timestamp.
  const raw = String(value || "");
  const datePart = raw.includes("T") ? raw.split("T")[0] : raw;
  const parts = datePart.split("-");
  if (parts.length !== 3) {
    return datePart || "–";
  }
  const month = parts[1];
  const day = parts[2];
  return `${day}/${month}`; // dd/MM for axis
}

export function safeShortLabel(value, maxLen = 14) {
  const s = String(value || "");
  if (!s) {
    return "–";
  }
  if (s.length <= maxLen) {
    return s;
  }
  return `${s.slice(0, maxLen - 1)}…`;
}
