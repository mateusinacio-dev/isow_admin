export function normalizeEmailList(text) {
  if (!text) {
    return [];
  }
  const parts = String(text)
    .split(/\s|,|;/g)
    .map((p) => p.trim())
    .filter(Boolean);
  const unique = Array.from(new Set(parts.map((p) => p.toLowerCase())));
  return unique;
}
