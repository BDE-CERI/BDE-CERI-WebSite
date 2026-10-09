"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { AccountActionResult } from "@/types/account-settings";

type Language = "fr" | "en";
type DatabaseError = { message: string; code?: string; details?: string } | null;
const boardRoles = ["president", "tresorier", "secretaire", "vp_general"];

class AccountActionError extends Error {}

function language(formData: FormData): Language {
  return formData.get("language") === "en" ? "en" : "fr";
}

function message(lang: Language, fr: string, en: string) {
  return lang === "en" ? en : fr;
}

function field(formData: FormData, key: string, max: number, lang: Language, required = false) {
  const raw = formData.get(key);
  if (raw !== null && typeof raw !== "string") {
    throw new AccountActionError(message(lang, "Un champ de la demande est invalide.", "A request field is invalid."));
  }
  const value = (raw ?? "").trim();
  if (required && !value) throw new AccountActionError(message(lang, "Complétez les champs obligatoires.", "Complete the required fields."));
  if (value.length > max) {
    throw new AccountActionError(message(lang, "Un champ dépasse la longueur autorisée (" + max + " caractères).", "A field exceeds the allowed length (" + max + " characters)."));
  }
  return value;
}

async function accountAccess(lang: Language, boardOnly = false) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new AccountActionError(message(lang, "Votre session a expiré. Reconnectez-vous avant de poursuivre.", "Your session has expired. Sign in again to continue."));
  }
  const { data: member, error } = await supabase.from("members")
    .select("id, category, role").eq("auth_user_id", user.id).maybeSingle();
  if (error) throw new AccountActionError(message(lang, "Impossible de vérifier votre compte BDE. Réessayez.", "Your BDE account could not be verified. Try again."));
  if (!member) throw new AccountActionError(message(lang, "Votre compte n’est pas lié à un membre du BDE. Contactez le bureau restreint.", "Your account is not linked to a BDE member. Contact the executive board."));
  if (boardOnly && member.category !== "bureau_restreint" && !boardRoles.includes(member.role ?? "")) {
    throw new AccountActionError(message(lang, "Le traitement des demandes est réservé au bureau restreint.", "Only the executive board can review requests."));
  }
  return supabase;
}

function accountDatabaseError(error: DatabaseError, lang: Language) {
  if (!error) return;
  const details = error.message + " " + (error.details ?? "");
  if (["PGRST202", "42883", "42P01", "42703"].includes(error.code ?? "") || /schema cache/i.test(details)) {
    throw new AccountActionError(message(lang,
      "Les demandes de changement d’email nécessitent une mise à jour de Supabase. Appliquez la migration 202610090005_account_settings.sql après la migration 003, puis réessayez. Votre saisie reste dans ce formulaire.",
      "Email change requests require a Supabase update. Apply migration 202610090005_account_settings.sql after migration 003, then try again. Your input remains in this form."));
  }
  if (/BDE_EMAIL_PENDING_EXISTS/.test(details) || error.code === "23505") {
    throw new AccountActionError(message(lang, "Vous avez déjà une demande en attente. Le bureau restreint doit la traiter avant une nouvelle demande.", "You already have a pending request. The executive board must review it before you submit another."));
  }
  if (/BDE_EMAIL_NOT_UPDATED/.test(details)) {
    throw new AccountActionError(message(lang,
      "La demande reste en attente : le nouvel email doit d’abord être enregistré dans Supabase Auth et dans le profil membre. Ce bouton ne modifie aucune adresse.",
      "The request remains pending: the new email must first be saved in Supabase Auth and in the member profile. This button does not change either email."));
  }
  if (/BDE_EMAIL_LINK_CHANGED/.test(details)) {
    throw new AccountActionError(message(lang, "Le rattachement du compte a changé. Vérifiez le membre et son compte Auth avant de clôturer cette demande.", "The account link has changed. Check the member and their Auth account before resolving this request."));
  }
  if (/BDE_EMAIL_ALREADY_REVIEWED/.test(details)) {
    throw new AccountActionError(message(lang, "Cette demande a déjà été traitée. Rechargez la liste.", "This request has already been reviewed. Refresh the list."));
  }
  if (/BDE_EMAIL_ALREADY_CURRENT/.test(details)) {
    throw new AccountActionError(message(lang, "Cette adresse est déjà enregistrée dans votre compte et votre profil.", "This email is already saved in your account and profile."));
  }
  if (/BDE_EMAIL_CURRENT_UNAVAILABLE/.test(details)) {
    throw new AccountActionError(message(lang, "Votre compte Auth n’a pas d’adresse email disponible. Contactez le bureau restreint.", "Your Auth account has no available email address. Contact the executive board."));
  }
  if (error.code === "42501") {
    throw new AccountActionError(message(lang, "Cette opération n’est pas autorisée pour votre compte.", "Your account is not allowed to perform this action."));
  }
  if (error.code === "P0002") {
    throw new AccountActionError(message(lang, "Cette demande n’est plus disponible. Rechargez la liste.", "This request is no longer available. Refresh the list."));
  }
  if (error.code === "22023" || error.code === "23514") {
    throw new AccountActionError(message(lang, "Les champs de la demande sont invalides. Vérifiez l’adresse et les textes.", "The request fields are invalid. Check the email and text fields."));
  }
  if (["40001", "40P01"].includes(error.code ?? "")) {
    throw new AccountActionError(message(lang, "Une autre modification était en cours. Réessayez.", "Another update was in progress. Try again."));
  }
  throw new AccountActionError(message(lang, "La demande n’a pas pu être enregistrée. Rechargez votre compte avant de réessayer.", "The request could not be saved. Refresh your account before trying again."));
}

async function performAccountAction(name: string, lang: Language, action: () => Promise<void>): Promise<AccountActionResult> {
  try {
    await action();
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof AccountActionError) return { error: error.message };
    console.error("Account settings action failed (" + name + "):", error);
    return { error: message(lang, "Une erreur inattendue est survenue. Rechargez votre compte avant de réessayer.", "An unexpected error occurred. Refresh your account before trying again.") };
  }
}

function confirmedRequestId(value: unknown, lang: Language) {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new AccountActionError(message(lang, "L’enregistrement de la demande n’a pas pu être confirmé. Rechargez votre compte avant de réessayer.", "The request could not be confirmed. Refresh your account before trying again."));
  }
}

export async function requestEmailChange(formData: FormData): Promise<AccountActionResult> {
  const lang = language(formData);
  return performAccountAction("requestEmailChange", lang, async () => {
    const requestedEmail = field(formData, "requested_email", 254, lang, true);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestedEmail)) {
      throw new AccountActionError(message(lang, "Saisissez une adresse email valide.", "Enter a valid email address."));
    }
    const reason = field(formData, "reason", 2000, lang);
    const supabase = await accountAccess(lang);
    // Identity, membership, and current Auth email are resolved again in SQL.
    const { data, error } = await supabase.rpc("bde_request_email_change", { p_requested_email: requestedEmail, p_reason: reason });
    accountDatabaseError(error, lang);
    confirmedRequestId(data, lang);
    revalidatePath("/profil");
  });
}

export async function reviewEmailChangeRequest(formData: FormData): Promise<AccountActionResult> {
  const lang = language(formData);
  return performAccountAction("reviewEmailChangeRequest", lang, async () => {
    const requestId = field(formData, "request_id", 36, lang, true);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)) {
      throw new AccountActionError(message(lang, "L’identifiant de la demande est invalide. Rechargez la liste.", "The request ID is invalid. Refresh the list."));
    }
    const status = field(formData, "status", 20, lang, true);
    if (status !== "resolved" && status !== "rejected") {
      throw new AccountActionError(message(lang, "Choisissez de clôturer ou de refuser la demande.", "Choose to resolve or reject the request."));
    }
    const response = field(formData, "response", 2000, lang);
    const supabase = await accountAccess(lang, true);
    const { data, error } = await supabase.rpc("bde_review_email_change_request", { p_request_id: requestId, p_status: status, p_response: response });
    accountDatabaseError(error, lang);
    confirmedRequestId(data, lang);
    revalidatePath("/profil");
  });
}
