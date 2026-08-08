/**
 * Returns the current calendar quarter label, e.g. "Q3 2026".
 */
export function currentPeriod(date: Date = new Date()): string {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter} ${date.getFullYear()}`;
}
