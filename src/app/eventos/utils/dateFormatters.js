export function formatDateInput(value) {
  if (!value) {
    return "";
  }
  try {
    const d = new Date(value);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

export function formatTimeInput(value) {
  if (!value) {
    return "";
  }
  try {
    const d = new Date(value);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return "";
  }
}

export function combineDateTime(dateStr, timeStr) {
  if (!dateStr) {
    return null;
  }

  const safeTime = timeStr || "00:00";
  const local = new Date(`${dateStr}T${safeTime}:00`);
  if (Number.isNaN(local.getTime())) {
    return null;
  }
  return local.toISOString();
}

export function formatIsoDateBR(value) {
  // Avoid Date() parsing to prevent timezone shifts.
  // Accepts "YYYY-MM-DD" or ISO.
  const raw = String(value || "");
  const datePart = raw.includes("T") ? raw.split("T")[0] : raw;
  const parts = datePart.split("-");
  if (parts.length !== 3) {
    return datePart || "";
  }
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  return `${day}/${month}/${year}`;
}
