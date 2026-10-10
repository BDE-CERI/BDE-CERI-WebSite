"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { hasSiteAdminAccess, isMemberPoleVicePresident, isRestrictedBoardMember } from "@/utils/member-roles";

type Result = { success: true } | { error: string };
const messageKeys = ["open", "no_shift", "before_open", "after_close", "weekend", "holiday"] as const;

function field(form: FormData, key: string, max: number, required = true) {
  const value = form.get(key);
  if (typeof value !== "string") throw new Error("Champ invalide : " + key);
  const clean = value.trim();
  if (required && !clean) throw new Error("Le champ « " + key + " » est obligatoire.");
  if (clean.length > max) throw new Error("Le champ « " + key + " » est trop long.");
  return clean;
}

function validTime(value: string) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }

async function authorizeLocalManagement() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Reconnectez-vous pour gérer le local.");
  const { data: member, error } = await supabase.from("members").select("id, category, role, pole_id, is_keyholder, is_dev").eq("auth_user_id", user.id).maybeSingle();
  if (error || !member) throw new Error("Votre profil membre n’a pas pu être vérifié.");
  const isBoard = isRestrictedBoardMember(member.category, member.role);
  const isAdmin = hasSiteAdminAccess(member.category, member.role, member.is_dev);
  const { data: vicePresidentAssignment, error: assignmentError } = await supabase.from("member_assignments").select("id").eq("member_id", member.id).eq("is_vp", true).limit(1).maybeSingle();
  if (assignmentError) throw new Error("Vos affectations n’ont pas pu être vérifiées.");
  const isKeyholder = member.category === "bureau" && member.is_keyholder === true && (!!vicePresidentAssignment || isMemberPoleVicePresident(member.role, member.pole_id));
  if (!isAdmin && !isKeyholder) throw new Error("La gestion du local est réservée aux administrateurs et aux responsables des clés.");
  if (isAdmin) {
    const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError || assurance?.currentLevel !== "aal2") throw new Error("Confirmez votre authentification à deux facteurs avant de modifier les horaires.");
  }
  return { supabase, member };
}

function revalidateLocal() {
  revalidatePath("/"); revalidatePath("/contact"); revalidatePath("/boutique"); revalidatePath("/profil");
}

export async function updateLocalHours(form: FormData): Promise<Result> {
  try {
    const { supabase } = await authorizeLocalManagement();
    const opens = field(form, "opens_at", 5), closes = field(form, "closes_at", 5);
    if (!validTime(opens) || !validTime(closes) || opens >= closes) throw new Error("Choisissez une plage horaire valide, avec une fermeture après l’ouverture.");
    const messages: Record<string, { fr: string; en: string }> = {};
    for (const key of messageKeys) {
      messages[key] = { fr: field(form, "message_" + key + "_fr", 500), en: field(form, "message_" + key + "_en", 500) };
    }
    const { error } = await supabase.from("local_hours_settings").update({ opens_at: opens, closes_at: closes, messages, updated_at: new Date().toISOString() }).eq("id", true);
    if (error) throw new Error(error.message);
    revalidateLocal();
    return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Les horaires n’ont pas pu être enregistrés." }; }
}

export async function saveLocalShift(form: FormData): Promise<Result> {
  try {
    const { supabase } = await authorizeLocalManagement();
    const id = field(form, "id", 36, false);
    const weekday = Number(field(form, "weekday", 1));
    const starts = field(form, "starts_at", 5), ends = field(form, "ends_at", 5);
    const keyholderId = field(form, "keyholder_member_id", 36);
    const note = field(form, "note", 180, false);
    if (!Number.isInteger(weekday) || weekday < 1 || weekday > 5) throw new Error("Choisissez un jour ouvré du lundi au vendredi.");
    if (!validTime(starts) || !validTime(ends) || starts >= ends) throw new Error("Choisissez une heure de fin après l’heure de début.");
    const { data: settings } = await supabase.from("local_hours_settings").select("opens_at, closes_at").eq("id", true).maybeSingle();
    if (!settings || starts < settings.opens_at.slice(0, 5) || ends > settings.closes_at.slice(0, 5)) throw new Error("La permanence doit rester dans les horaires possibles du local.");
    const { data: keyholder, error: memberError } = await supabase.from("members").select("id, category, role, pole_id, is_keyholder").eq("id", keyholderId).maybeSingle();
    if (memberError || !keyholder || keyholder.is_keyholder !== true) throw new Error("La personne sélectionnée doit avoir la responsabilité des clés.");
    const isRestrictedBoard = isRestrictedBoardMember(keyholder.category, keyholder.role);
    if (!isRestrictedBoard) {
      const { data: vicePresidentAssignment, error: assignmentError } = await supabase.from("member_assignments").select("id").eq("member_id", keyholderId).eq("is_vp", true).limit(1).maybeSingle();
      if (assignmentError || keyholder.category !== "bureau" || (!vicePresidentAssignment && !isMemberPoleVicePresident(keyholder.role, keyholder.pole_id))) throw new Error("Le responsable sélectionné doit être un VP de pôle ou membre du bureau restreint.");
    }
    let overlap = supabase.from("local_opening_shifts").select("id").eq("weekday", weekday).lt("starts_at", ends).gt("ends_at", starts);
    if (id) overlap = overlap.neq("id", id);
    const { data: collisions, error: overlapError } = await overlap.limit(1);
    if (overlapError) throw new Error(overlapError.message);
    if (collisions?.length) throw new Error("Ce créneau chevauche une autre permanence ce jour-là.");
    const row = { weekday, starts_at: starts, ends_at: ends, keyholder_member_id: keyholderId, note, updated_at: new Date().toISOString() };
    const result = id
      ? await supabase.from("local_opening_shifts").update(row).eq("id", id)
      : await supabase.from("local_opening_shifts").insert(row);
    if (result.error) throw new Error(result.error.message);
    revalidateLocal();
    return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "La permanence n’a pas pu être enregistrée." }; }
}

export async function deleteLocalShift(id: string): Promise<Result> {
  try {
    const { supabase } = await authorizeLocalManagement();
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id)) throw new Error("Identifiant de permanence invalide.");
    const { error } = await supabase.from("local_opening_shifts").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidateLocal();
    return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "La permanence n’a pas pu être supprimée." }; }
}
