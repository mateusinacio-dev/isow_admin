export function formatDocStatus(status) {
  if (status === "OK") return "OK";
  if (status === "WARNING") return "Atenção";
  if (status === "EXPIRING_SOON") return "Vence em breve";
  if (status === "EXPIRED") return "Vencido";
  if (status === "MISSING") return "Faltando";
  return status || "-";
}

export function statusPillClass(status) {
  if (status === "OK")
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (status === "WARNING")
    return "bg-yellow-50 text-yellow-800 border-yellow-200";
  if (status === "EXPIRING_SOON")
    return "bg-orange-50 text-orange-800 border-orange-200";
  if (status === "EXPIRED") return "bg-red-50 text-red-800 border-red-200";
  if (status === "MISSING") return "bg-red-50 text-red-800 border-red-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
}

export function isoFromDateInput(dateStr) {
  if (!dateStr) {
    return null;
  }
  // date input gives YYYY-MM-DD; keep in ISO-like with time
  return `${dateStr}T00:00:00.000Z`;
}
