"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

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
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  if (typeof emailValue !== "string" || typeof passwordValue !== "string" || !emailValue.trim() || !passwordValue) {
    redirect("/login?error=true");
  }
  if (!await authenticateWithPassword(emailValue.trim(), passwordValue)) redirect("/login?error=true");
  revalidatePath("/", "layout");
  redirect("/");
}

export async function loginWithGoogle() {
  const supabase = await createClient();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirect("/login?error=google");
  }

  redirect(data.url);
}
