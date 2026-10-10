export type LocalMessage = { fr: string; en: string };
export type LocalMessageSet = Record<"open" | "no_shift" | "before_open" | "after_close" | "weekend" | "holiday", LocalMessage>;
export type LocalHoursSettings = { id: boolean; opens_at: string; closes_at: string; messages: LocalMessageSet };
export type LocalOpeningShift = { id: string; weekday: number; starts_at: string; ends_at: string; keyholder_member_id: string; note: string; keyholder_name: string };
export type LocalOfficeData = { settings: LocalHoursSettings; shifts: LocalOpeningShift[] };
export type LocalOfficeStatus = { state: keyof LocalMessageSet; isOpen: boolean; message: string; responsible: string | null; nowMinutes: number; weekday: number; holidayName: string | null; nextDay: string; nextOpening: string };

export const defaultLocalHours: LocalHoursSettings = {
  id: true, opens_at: "08:30:00", closes_at: "19:00:00",
  messages: {
    open: { fr: "Le local est ouvert jusqu’à {closing}. Responsable des clés : {responsible}.", en: "The local is open until {closing}. Keyholder: {responsible}." },
    no_shift: { fr: "Les horaires possibles sont {opening}–{closing}, mais aucun membre n’a annoncé de présence pour le moment. Le local peut donc être fermé.", en: "Possible opening hours are {opening}–{closing}, but no member has announced a shift yet. The local may be closed." },
    before_open: { fr: "Le local n’est pas encore ouvert aujourd’hui. Il ouvre à {opening}.", en: "The local is not open yet today. It opens at {opening}." },
    after_close: { fr: "Encore un petit creux ? Il faudra patienter : la Taverne devrait revenir {next_day} à partir de {next_opening}, selon la présence des membres.", en: "Still hungry? Please wait a little: the Tavern is expected to return {next_day} from {next_opening}, depending on member availability." },
    weekend: { fr: "La Taverne est fermée ce week-end. Elle devrait revenir {next_day} à partir de {next_opening}, selon la présence des membres.", en: "The Tavern is closed for the weekend. It is expected to return {next_day} from {next_opening}, depending on member availability." },
    holiday: { fr: "Le local est fermé ce jour férié. La Taverne devrait revenir {next_day} à partir de {next_opening}, selon la présence des membres.", en: "The local is closed for this public holiday. The Tavern is expected to return {next_day} from {next_opening}, depending on member availability." },
  },
};

export function localTimeMinutes(value: string) {
  const [hours, mins] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + mins;
}

function dateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = (name: string) => parts.find(part => part.type === name)?.value || "00";
  return value("year") + "-" + value("month") + "-" + value("day");
}

function easterSunday(year: number) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

export function frenchPublicHoliday(date: Date): string | null {
  const key = dateKey(date);
  const year = Number(key.slice(0, 4));
  const fixed: Record<string, string> = {
    [`${year}-01-01`]: "Jour de l’an", [`${year}-05-01`]: "Fête du Travail", [`${year}-05-08`]: "Victoire 1945",
    [`${year}-07-14`]: "Fête nationale", [`${year}-08-15`]: "Assomption", [`${year}-11-01`]: "Toussaint",
    [`${year}-11-11`]: "Armistice 1918", [`${year}-12-25`]: "Noël",
  };
  const easter = easterSunday(year);
  for (const [offset, name] of [[1, "Lundi de Pâques"], [39, "Ascension"], [50, "Lundi de Pentecôte"]] as const) {
    const holiday = new Date(easter.getTime() + offset * 86_400_000).toISOString().slice(0, 10);
    if (holiday === key) return name;
  }
  return fixed[key] || null;
}

function parisWeekday(date: Date) {
  const value = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short" }).format(date);
  return ({ Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 } as Record<string, number>)[value] || 1;
}

export function getLocalOfficeStatus(data: LocalOfficeData, date = new Date(), english = false): LocalOfficeStatus {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const weekday = ({ Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 } as Record<string, number>)[parts.find(part => part.type === "weekday")?.value || "Mon"] || 1;
  const nowMinutes = Number(parts.find(part => part.type === "hour")?.value || 0) * 60 + Number(parts.find(part => part.type === "minute")?.value || 0);
  const opens = localTimeMinutes(data.settings.opens_at), closes = localTimeMinutes(data.settings.closes_at);
  const holidayName = frenchPublicHoliday(date);
  const activeShift = data.shifts.find(shift => shift.weekday === weekday
    && nowMinutes >= opens && nowMinutes < closes
    && nowMinutes >= localTimeMinutes(shift.starts_at) && nowMinutes < localTimeMinutes(shift.ends_at));
  let state: LocalOfficeStatus["state"];
  if (holidayName) state = "holiday";
  else if (weekday > 5) state = "weekend";
  else if (nowMinutes < opens) state = "before_open";
  else if (nowMinutes >= closes) state = "after_close";
  else state = activeShift ? "open" : "no_shift";

  const next = new Date(date);
  for (let offset = 1; offset <= 14; offset++) {
    next.setTime(date.getTime() + offset * 86_400_000);
    if (parisWeekday(next) <= 5 && !frenchPublicHoliday(next)) break;
  }
  const nextDay = new Intl.DateTimeFormat(english ? "en-GB" : "fr-FR", { timeZone: "Europe/Paris", weekday: "long" }).format(next);
  const nextOpening = state === "open" && activeShift ? activeShift.ends_at.slice(0, 5) : data.settings.opens_at.slice(0, 5);
  const responsible = activeShift?.keyholder_name || null;
  const template = data.settings.messages[state] || defaultLocalHours.messages[state];
  const rawMessage = template?.[english ? "en" : "fr"] || defaultLocalHours.messages[state][english ? "en" : "fr"];
  const message = rawMessage.replaceAll("{opening}", data.settings.opens_at.slice(0, 5)).replaceAll("{closing}", data.settings.closes_at.slice(0, 5))
    .replaceAll("{responsible}", responsible || (english ? "not listed" : "non renseigné"))
    .replaceAll("{next_day}", nextDay).replaceAll("{next_opening}", nextOpening);
  return { state, isOpen: state === "open", message, responsible, nowMinutes, weekday, holidayName, nextDay, nextOpening };
}
