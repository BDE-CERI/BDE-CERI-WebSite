"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { hasSiteAdminAccess } from "@/utils/member-roles";
import {
  isEventRegistrationId,
  parseEventRegistrationStatus,
  parseEventRegistrationLogs,
  parseEventRegistrationsList,
} from "@/utils/event-registrations";
import type {
  EventRegistrationErrorCode,
  EventRegistrationsListResult,
  EventRegistrationLogsResult,
  RegistrationActionResult,
} from "@/types/event-registrations";

const migration = "202610100001_event_system_setup.sql";

const messages: Record<EventRegistrationErrorCode, { fr: string; en: string }> = {
  AUTH_REQUIRED: {
    fr: "Connectez-vous à votre compte BDE pour vous inscrire.",
    en: "Sign in to your BDE account to register.",
  },
  MEMBER_REQUIRED: {
    fr: "Votre compte doit être associé à un profil BDE pour vous inscrire. Contactez le bureau.",
    en: "Your account must be linked to a BDE profile to register. Contact the board.",
  },
  EVENT_NOT_FOUND: {
    fr: "Cet événement n’est plus disponible.",
    en: "This event is no longer available.",
  },
  CLOSED: {
    fr: "Les inscriptions à cet événement sont closes.",
    en: "Registration for this event is closed.",
  },
  FULL: {
    fr: "Cet événement est complet. Votre inscription n’a pas été enregistrée.",
    en: "This event is full. Your registration has not been saved.",
  },
  INVALID_INPUT: {
    fr: "Cette demande est invalide. Rechargez la page puis réessayez.",
    en: "This request is invalid. Reload the page and try again.",
  },
  FORBIDDEN: {
    fr: "La liste des inscrits est réservée aux administrateurs du site.",
    en: "The attendee list is restricted to site administrators.",
  },
  CONFIGURATION_REQUIRED: {
    fr: "Les inscriptions ne sont pas encore disponibles. Contactez le bureau.",
    en: "Registration is not available yet. Contact the board.",
  },
  UNAVAILABLE: {
    fr: "Impossible de confirmer votre demande pour le moment. Réessayez.",
    en: "Your request could not be confirmed right now. Please try again.",
  },
};

function failure(code: EventRegistrationErrorCode, english: boolean): Extract<RegistrationActionResult, { success: false }> {
  return { success: false, code, error: messages[code][english ? "en" : "fr"] };
}

function databaseFailure(error: unknown): EventRegistrationErrorCode {
  if (typeof error !== "object" || error === null) return "UNAVAILABLE";
  const details = error as Record<string, unknown>;
  const message = typeof details.message === "string" ? details.message : "";
  const code = typeof details.code === "string" ? details.code : "";
  const known: EventRegistrationErrorCode[] = ["AUTH_REQUIRED", "MEMBER_REQUIRED", "EVENT_NOT_FOUND", "CLOSED", "FULL", "FORBIDDEN"];
  for (const value of known) {
    if (new RegExp("\\bER_" + value + "\\b").test(message)) return value;
  }
  if (["PGRST202", "PGRST204", "42883", "42P01", "42703"].includes(code)) return "CONFIGURATION_REQUIRED";
  return "UNAVAILABLE";
}

async function mutateRegistration(eventId: string, english: boolean, operation: "register" | "cancel"): Promise<RegistrationActionResult> {
  if (!isEventRegistrationId(eventId)) return failure("INVALID_INPUT", english);

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return failure("AUTH_REQUIRED", english);

    // A legacy RPC can still write registrations. Verify the payment-aware
    // contract BEFORE calling it, so a missing migration never creates a free
    // registration for an event configured as paid in the application.
    const { data: currentData, error: currentError } = await supabase.rpc(
      "bde_event_registration_status", { p_event_id: eventId },
    );
    if (currentError) return failure(databaseFailure(currentError), english);
    if (!parseEventRegistrationStatus(currentData as unknown, eventId)) {
      return failure("CONFIGURATION_REQUIRED", english);
    }

    // The RPC derives both the member and the identity from the verified session.
    // No member ID, name, date, quota or eligibility is accepted from the browser.
    const { data, error } = await supabase.rpc(
      operation === "register" ? "bde_register_for_event" : "bde_cancel_event_registration",
      { p_event_id: eventId },
    );
    if (error) return failure(databaseFailure(error), english);

    const status = parseEventRegistrationStatus(data as unknown, eventId);
    if (!status) return failure("UNAVAILABLE", english);

    try {
      revalidatePath("/evenement");
      revalidatePath("/evenement/" + eventId);
      revalidatePath("/profil");
    } catch {
      // A cache failure does not undo the registration already saved by the RPC.
    }

    return { success: true, status };
  } catch {
    return failure("UNAVAILABLE", english);
  }
}

export async function registerForEvent(eventId: string, english = false): Promise<RegistrationActionResult> {
  return mutateRegistration(eventId, english === true, "register");
}

export async function cancelEventRegistration(eventId: string, english = false): Promise<RegistrationActionResult> {
  return mutateRegistration(eventId, english === true, "cancel");
}

export async function listEventRegistrations(
  eventId: string,
  offset = 0,
  query = "",
  english = false,
): Promise<EventRegistrationsListResult> {
  const isEnglish = english === true;
  if (!isEventRegistrationId(eventId)
    || typeof offset !== "number" || !Number.isSafeInteger(offset) || offset < 0 || offset > 1_000_000
    || typeof query !== "string" || query.length > 120) {
    return { success: false, error: failure("INVALID_INPUT", isEnglish).error };
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: failure("AUTH_REQUIRED", isEnglish).error };

    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, category, role, is_dev")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (memberError) return { success: false, error: failure("UNAVAILABLE", isEnglish).error };
    if (!member || !hasSiteAdminAccess(member.category, typeof member.role === "string" ? member.role : null, member.is_dev)) {
      return { success: false, error: failure("FORBIDDEN", isEnglish).error };
    }
    const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError || assurance?.currentLevel !== "aal2") return { success: false, error: failure("FORBIDDEN", isEnglish).error };

    // SQL checks the same administrator rights again; the application guard is not
    // used as a replacement for database permissions.
    const { data, error } = await supabase.rpc("bde_admin_list_event_registrations", {
      p_event_id: eventId,
      p_offset: offset,
      p_limit: 50,
      p_query: query.trim(),
    });

    if (error) {
      const code = databaseFailure(error);
      return {
        success: false,
        error: code === "CONFIGURATION_REQUIRED"
          ? isEnglish
            ? "Event registration is not configured. Apply the Supabase migration " + migration + " and reload the page."
            : "Le système d’inscription n’est pas configuré. Appliquez la migration Supabase " + migration + ", puis rechargez la page."
          : failure(code, isEnglish).error,
      };
    }

    const result = parseEventRegistrationsList(data as unknown);
    if (!result) return {
      success: false,
      error: isEnglish
        ? "The payment-aware attendee list is not configured. Apply the Supabase migration " + migration + " and reload the page."
        : "La liste des inscrits avec tarifs n’est pas configurée. Appliquez la migration Supabase " + migration + ", puis rechargez la page.",
    };
    return { success: true, ...result };
  } catch {
    return { success: false, error: failure("UNAVAILABLE", isEnglish).error };
  }
}

export async function listEventRegistrationLogs(eventId: string | null, offset = 0, english = false): Promise<EventRegistrationLogsResult> {
  const isEnglish = english === true;
  if (!(eventId === null || isEventRegistrationId(eventId)) || !Number.isSafeInteger(offset) || offset < 0 || offset > 1_000_000) {
    return { success: false, error: failure("INVALID_INPUT", isEnglish).error };
  }
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: failure("AUTH_REQUIRED", isEnglish).error };
    const { data: member, error: memberError } = await supabase.from("members").select("id, category, role, is_dev").eq("auth_user_id", user.id).maybeSingle();
    if (memberError) return { success: false, error: failure("UNAVAILABLE", isEnglish).error };
    if (!member || !hasSiteAdminAccess(member.category, typeof member.role === "string" ? member.role : null, member.is_dev)) {
      return { success: false, error: failure("FORBIDDEN", isEnglish).error };
    }
    const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError || assurance?.currentLevel !== "aal2") return { success: false, error: failure("FORBIDDEN", isEnglish).error };
    const { data, error } = await supabase.rpc("bde_admin_list_event_registration_logs", {
      p_event_id: eventId, p_offset: offset, p_limit: 100,
    });
    if (error) {
      const code = databaseFailure(error);
      return { success: false, error: code === "CONFIGURATION_REQUIRED"
        ? (isEnglish ? "Event history is not configured. Apply migration " : "L’historique n’est pas configuré. Appliquez la migration ") + migration + (isEnglish ? " in Supabase." : " dans Supabase.")
        : failure(code, isEnglish).error };
    }
    const result = parseEventRegistrationLogs(data as unknown);
    if (!result) return { success: false, error: (isEnglish ? "Apply migration " : "Appliquez la migration ") + migration + (isEnglish ? " in Supabase, then reload." : " dans Supabase, puis rechargez la page.") };
    return { success: true, ...result };
  } catch {
    return { success: false, error: failure("UNAVAILABLE", isEnglish).error };
  }
}
