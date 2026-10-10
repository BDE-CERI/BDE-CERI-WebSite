"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { hasSiteAdminAccess } from "@/utils/member-roles";

const sections = new Set(["events", "news", "poles", "account_requests", "badges"]);

export async function markAdminNotificationsRead(section: string): Promise<{ success: true } | { error: string }> {
  if (!sections.has(section)) return { error: "Section invalide." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Session expirée." };
  const [{ data: member }, { data: assurance }] = await Promise.all([
    supabase.from("members").select("id, category, role, is_dev").eq("auth_user_id", user.id).maybeSingle(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  if (!member || assurance?.currentLevel !== "aal2"
    || !hasSiteAdminAccess(member.category, member.role, member.is_dev)) {
    return { error: "Accès réservé aux administrateurs du site." };
  }
  const { error } = await supabase.from("admin_notification_reads").upsert({
    member_id: member.id,
    section,
    last_read_at: new Date().toISOString(),
  }, { onConflict: "member_id,section" });
  if (error) return { error: "Les notifications n’ont pas pu être marquées comme lues." };
  revalidatePath("/profil");
  return { success: true };
}
