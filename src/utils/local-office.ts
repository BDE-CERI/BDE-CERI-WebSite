import "server-only";
import { createClient } from "@/utils/supabase/server";
import { defaultLocalHours, type LocalHoursSettings, type LocalOfficeData, type LocalOpeningShift } from "./local-office-shared";

export { defaultLocalHours, getLocalOfficeStatus, frenchPublicHoliday, localTimeMinutes } from "./local-office-shared";
export type { LocalHoursSettings, LocalMessage, LocalMessageSet, LocalOfficeData, LocalOfficeStatus, LocalOpeningShift } from "./local-office-shared";

function relation(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return value.length && typeof value[0] === "object" ? value[0] as Record<string, unknown> : null;
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}

export async function getLocalOfficeData(): Promise<LocalOfficeData> {
  try {
    const supabase = await createClient();
    const [settingsResult, shiftsResult] = await Promise.all([
      supabase.from("local_hours_settings").select("id, opens_at, closes_at, messages").eq("id", true).maybeSingle(),
      supabase.from("local_opening_shifts").select("id, weekday, starts_at, ends_at, keyholder_member_id, note, keyholder:members!local_opening_shifts_keyholder_member_id_fkey(first_name, last_name, hide_last_name)").order("weekday").order("starts_at"),
    ]);
    const row = settingsResult.data;
    const settings: LocalHoursSettings = row ? {
      id: true,
      opens_at: String(row.opens_at || defaultLocalHours.opens_at),
      closes_at: String(row.closes_at || defaultLocalHours.closes_at),
      messages: { ...defaultLocalHours.messages, ...((row.messages && typeof row.messages === "object") ? row.messages as LocalHoursSettings["messages"] : {}) },
    } : defaultLocalHours;
    const shifts: LocalOpeningShift[] = (shiftsResult.data || []).map((item) => {
      const member = relation(item.keyholder);
      const first = typeof member?.first_name === "string" ? member.first_name : "";
      const last = member?.hide_last_name === true ? "" : typeof member?.last_name === "string" ? member.last_name : "";
      return {
        id: item.id, weekday: Number(item.weekday), starts_at: String(item.starts_at), ends_at: String(item.ends_at),
        keyholder_member_id: item.keyholder_member_id, note: String(item.note || ""), keyholder_name: [first, last].filter(Boolean).join(" ") || "Responsable des clés",
      };
    });
    return { settings, shifts };
  } catch {
    return { settings: defaultLocalHours, shifts: [] };
  }
}
