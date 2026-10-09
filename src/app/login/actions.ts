"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { signInWithGoogle } from "./google-actions";
import { getEventLoginReturnPath } from "@/utils/login-return";

async function authenticateWithPassword(email: string, password: string): Promise<boolean> {
  let authenticated = false;
  try {
    const supabase = await createClient();
    const signedIn = await supabase.auth.signInWithPassword({ email, password });
    if (signedIn.error || !signedIn.data.user) return false;
    const verified = await supabase.auth.getUser();
    const user = verified.data.user;
    if (verified.error || !user || user.id !== signedIn.data.user.id) {
      await supabase.auth.signOut({ scope: "local" });
      return false;
    }

    authenticated = true;
    // Legacy association is allowed only after proving the existing password account.
    // OAuth callbacks never execute this email-based claim.
    const current = await supabase.from("members").select("id").eq("auth_user_id", user.id).maybeSingle();
    if (!current.error && !current.data && user.email && user.email_confirmed_at) {
      const legacy = await supabase.from("members").select("id").eq("email", user.email).is("auth_user_id", null).maybeSingle();
      if (!legacy.error && legacy.data) {
        const claimed = await supabase.from("members")
          .update({ auth_user_id: user.id })
          .eq("id", legacy.data.id)
          .eq("email", user.email)
          .is("auth_user_id", null)
          .select("id")
          .maybeSingle();
        if (!claimed.data) {
          // A concurrent claim may have completed; never overwrite an established link.
          await supabase.from("members").select("id").eq("auth_user_id", user.id).maybeSingle();
        }
      }
    }
    // A valid account with no matching member keeps the normal missing-profile flow.
    return true;
  } catch {
    // A business-table outage must not invalidate an already verified login.
    return authenticated;
  }
}

export async function login(formData: FormData) {
  const destination = getEventLoginReturnPath(formData.get("next"), "/");
  const loginErrorUrl = "/login?error=true" + (destination === "/" ? "" : "&next=" + encodeURIComponent(destination));
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  if (typeof emailValue !== "string" || typeof passwordValue !== "string" || !emailValue.trim() || !passwordValue) {
    redirect(loginErrorUrl);
  }
  if (!await authenticateWithPassword(emailValue.trim(), passwordValue)) redirect(loginErrorUrl);
  revalidatePath("/", "layout");
  redirect(destination);
}

export async function loginWithGoogle() {
  // Keep the existing action name compatible with the guarded PKCE flow.
  return signInWithGoogle();
}
