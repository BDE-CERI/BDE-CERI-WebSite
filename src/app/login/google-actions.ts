"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  GOOGLE_FLOW_COOKIE,
  GOOGLE_FLOW_MAX_AGE,
  createGoogleAuthClient,
  createGoogleAuthFlow,
  encodeGoogleAuthFlow,
  getGoogleAuthOrigin,
  getGoogleAuthReadiness,
  googleAuthErrorPath,
  googleAuthProviderError,
  isTrustedGoogleAuthorizeUrl,
  type GoogleAuthErrorCode,
} from "@/utils/google-auth";

type StartResult = { url: string } | { error: GoogleAuthErrorCode; sessionEnded?: boolean };

async function startGoogleFlow(mode: "login" | "link"): Promise<StartResult> {
  const origin = await getGoogleAuthOrigin();
  if (!origin || !await getGoogleAuthReadiness()) return { error: "google_not_configured" };

  try {
    const supabase = await createGoogleAuthClient();
    let expectedUserId: string | undefined;
    if (mode === "link") {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return { error: "google_session_expired", sessionEnded: true };
      const member = await supabase.from("members").select("id").eq("auth_user_id", user.id).maybeSingle();
      if (member.error) return { error: "google_failed" };
      if (!member.data) {
        await supabase.auth.signOut({ scope: "local" });
        return { error: "google_access_denied", sessionEnded: true };
      }
      if (user.identities?.some(identity => identity.provider === "google")) return { url: "/profil?section=settings&google_status=linked" };
      expectedUserId = user.id;
    }

    const flow = mode === "link" && expectedUserId ? createGoogleAuthFlow("link", expectedUserId) : createGoogleAuthFlow("login");
    const callback = new URL("/auth/callback", origin);
    callback.searchParams.set("flow", flow.nonce);
    const cookieStore = await cookies();
    cookieStore.set(GOOGLE_FLOW_COOKIE, encodeGoogleAuthFlow(flow), {
      httpOnly: true,
      sameSite: "lax",
      secure: origin.startsWith("https://"),
      path: "/auth/callback",
      maxAge: GOOGLE_FLOW_MAX_AGE,
    });

    const credentials = {
      provider: "google" as const,
      options: {
        redirectTo: callback.toString(),
        scopes: "openid email profile",
        skipBrowserRedirect: true,
        queryParams: { prompt: "select_account" },
      },
    };
    const result = mode === "link" ? await supabase.auth.linkIdentity(credentials) : await supabase.auth.signInWithOAuth(credentials);
    if (result.error || !result.data.url || !isTrustedGoogleAuthorizeUrl(result.data.url)) {
      cookieStore.set(GOOGLE_FLOW_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: origin.startsWith("https://"), path: "/auth/callback", maxAge: 0 });
      return { error: result.error ? googleAuthProviderError(result.error.code) : "google_failed" };
    }
    return { url: result.data.url };
  } catch {
    const cookieStore = await cookies();
    cookieStore.set(GOOGLE_FLOW_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: origin.startsWith("https://"), path: "/auth/callback", maxAge: 0 });
    return { error: "google_failed" };
  }
}

export async function signInWithGoogle() {
  const result = await startGoogleFlow("login");
  redirect("url" in result ? result.url : googleAuthErrorPath("login", result.error));
}

export async function linkGoogleAccount() {
  const result = await startGoogleFlow("link");
  redirect("url" in result ? result.url : googleAuthErrorPath(result.sessionEnded ? "login" : "link", result.error));
}
