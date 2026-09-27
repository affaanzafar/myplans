/**
 * Dates are always the user's LOCAL date, formatted YYYY-MM-DD — never UTC —
 * and displayed as "19 Feb".
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Local date as YYYY-MM-DD. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Today's local date as YYYY-MM-DD. */
export function todayKey(): string {
  return toDateKey(new Date());
}

/** True iff value is a real calendar date written as YYYY-MM-DD. */
export function isValidDateKey(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** "2026-02-19" -> "19 Feb". */
export function formatShort(key: string): string {
  const [, m, d] = key.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

/**
 * "19 Feb" for dates in the current year; "19 Feb 2025" for older years,
 * so the log stays honest across years.
 */
export function formatHeading(key: string, now: Date = new Date()): string {
  const y = Number(key.slice(0, 4));
  return y === now.getFullYear() ? formatShort(key) : `${formatShort(key)} ${y}`;
}
