export const PARIS_TIME_ZONE = "Europe/Paris";

type DateValue = string | number | Date | null | undefined;
export type ParisLocalDateResult = { iso: string; ambiguous: boolean } | { error: "invalid" | "nonexistent" };

type DateParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

const parisPartsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: PARIS_TIME_ZONE,
  calendar: "gregory",
  numberingSystem: "latn",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function validDate(value: DateValue): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parisParts(date: Date): DateParts {
  const parts = parisPartsFormatter.formatToParts(date);
  const part = (name: Intl.DateTimeFormatPartTypes) => Number(parts.find(value => value.type === name)?.value);
  return { year: part("year"), month: part("month"), day: part("day"), hour: part("hour"), minute: part("minute"), second: part("second") };
}

function wallTimestamp(parts: DateParts): number {
  // setUTCFullYear also handles years 1–99 without Date.UTC's 1900 offset.
  const date = new Date(0);
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  date.setUTCHours(parts.hour, parts.minute, parts.second, 0);
  return date.getTime();
}

function sameParts(left: DateParts, right: DateParts): boolean {
  return left.year === right.year && left.month === right.month && left.day === right.day
    && left.hour === right.hour && left.minute === right.minute && left.second === right.second;
}

/** A stable Paris display, independent of the browser or server's own time zone. */
export function formatParisDateTime(value: DateValue, options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" }, locale = "fr-FR"): string {
  const date = validDate(value);
  return date ? new Intl.DateTimeFormat(locale, { ...options, timeZone: PARIS_TIME_ZONE }).format(date) : "";
}

/** A daily key in Paris time, independent of the server or browser time zone. */
export function getParisDateKey(value: DateValue = new Date()): string {
  const date = validDate(value);
  if (!date) return "";
  const parts = parisParts(date);
  return String(parts.year).padStart(4, "0") + "-" + String(parts.month).padStart(2, "0") + "-" + String(parts.day).padStart(2, "0");
}

/** The YYYY-MM-DDTHH:mm value expected by a datetime-local input, in Paris time. */
export function toParisDateTimeLocal(value: DateValue): string {
  const date = validDate(value);
  if (!date) return "";
  const parts = parisParts(date);
  const pad = (number: number) => String(number).padStart(2, "0");
  return String(parts.year).padStart(4, "0") + "-" + pad(parts.month) + "-" + pad(parts.day) + "T" + pad(parts.hour) + ":" + pad(parts.minute);
}

/**
 * Convert a Paris wall-clock time to a UTC ISO instant.
 * A spring DST gap is rejected. If the autumn clock change repeats an hour,
 * the earlier occurrence is selected and ambiguous is true.
 * Strings already carrying an ISO offset must be validated as instants instead.
 */
export function parseParisDateTimeLocal(value: string): ParisLocalDateResult {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return { error: "invalid" };
  const parts: DateParts = {
    year: Number(match[1]), month: Number(match[2]), day: Number(match[3]),
    hour: Number(match[4]), minute: Number(match[5]), second: Number(match[6] || 0),
  };
  if (parts.year < 1 || parts.month < 1 || parts.month > 12 || parts.day < 1 || parts.day > 31
    || parts.hour > 23 || parts.minute > 59 || parts.second > 59) return { error: "invalid" };
  const timestamp = wallTimestamp(parts);
  const calendarDate = new Date(timestamp);
  if (calendarDate.getUTCFullYear() !== parts.year || calendarDate.getUTCMonth() + 1 !== parts.month
    || calendarDate.getUTCDate() !== parts.day) return { error: "invalid" };

  // Observe both sides of a possible DST change rather than relying on a
  // browser-local offset or hardcoding which Sunday changes the Paris clock.
  const offsets = new Set<number>();
  for (const hours of [-36, -12, 0, 12, 36]) {
    const probe = new Date(timestamp + hours * 3_600_000);
    offsets.add(wallTimestamp(parisParts(probe)) - probe.getTime());
  }
  const candidates = [...offsets].map(offset => timestamp - offset)
    .filter(candidate => sameParts(parisParts(new Date(candidate)), parts))
    .sort((left, right) => left - right);
  if (!candidates.length) return { error: "nonexistent" };
  return { iso: new Date(candidates[0]).toISOString(), ambiguous: candidates.length > 1 };
}
