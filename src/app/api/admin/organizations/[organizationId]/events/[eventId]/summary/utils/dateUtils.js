export function monthsRemainingInYearFromLastCharge(lastChargeAt, year) {
  if (!lastChargeAt) {
    return 0;
  }
  const d = new Date(lastChargeAt);
  if (Number.isNaN(d.getTime())) {
    return 0;
  }
  if (d.getFullYear() !== year) {
    return 0;
  }
  const monthIndex = d.getMonth(); // 0..11
  return Math.max(0, 11 - monthIndex); // months after last charge month until Dec
}
