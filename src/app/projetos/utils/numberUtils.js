export function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return min;
  }
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export function toMoneyNumber(value) {
  if (value == null || value === "") {
    return 0;
  }
  const cleaned = String(value).replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return n;
}
