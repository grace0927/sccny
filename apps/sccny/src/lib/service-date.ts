/**
 * Client-safe date helpers for the PPT generation tool.
 *
 * The worship slides are always for a Sunday. These helpers centralize the
 * "coming Sunday" math (previously duplicated in the page and the API route)
 * and provide the upcoming-Sunday list used by the date picker. Plain JS only,
 * so both server routes and client components can import this.
 */

/** Coming Sunday at local midnight (today if today is Sunday). */
export function getComingSunday(from: Date = new Date()): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const dayOfWeek = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() + (dayOfWeek === 0 ? 0 : 7 - dayOfWeek));
  return d;
}

/** Format a Date as a `YYYY-MM-DD` local date string (date-input value). */
export function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Format a Date as a compact `YYYYMMDD` local string (presentation title / {J1}). */
export function formatCompact(d: Date): string {
  return toDateInputValue(d).replace(/-/g, "");
}

/**
 * List of upcoming Sundays starting from the coming Sunday.
 * `value` is `YYYY-MM-DD`; `label` adds "（本主日）" to the first entry.
 */
export function getUpcomingSundays(
  count: number = 8,
  from: Date = new Date()
): { value: string; label: string }[] {
  const first = getComingSunday(from);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(first);
    d.setDate(first.getDate() + i * 7);
    const value = toDateInputValue(d);
    return { value, label: i === 0 ? `${value}（本主日）` : value };
  });
}

/**
 * Parse a `YYYY-MM-DD` string into a local-midnight Date.
 * Built via `new Date(y, m-1, d)` to avoid the UTC-shift bug that
 * `new Date("YYYY-MM-DD")` introduces. Returns null on missing/invalid input.
 */
export function parseServiceDate(s?: string): Date | null {
  if (!s) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  const date = new Date(year, month - 1, day);
  // Reject overflow (e.g. 2026-02-31 rolling into March).
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

/** True if the date is the first Sunday of its month (date 1–7). */
export function isFirstSundayOfMonth(d: Date): boolean {
  return d.getDate() <= 7;
}
