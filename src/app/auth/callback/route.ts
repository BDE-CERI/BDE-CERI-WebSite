import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  GOOGLE_FLOW_COOKIE,
  createGoogleAuthClient,
  getGoogleAuthOrigin,
  getGoogleAuthConfigurationError,
  googleAuthErrorPath,
  googleAuthProviderError,
  matchesGoogleAuthNonce,
  parseGoogleAuthFlow,
  type GoogleAuthErrorCode,
} from "@/utils/google-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = await getGoogleAuthOrigin();
  // The fallback is the site's established canonical origin, never a forwarded host.
  const redirectOrigin = origin || (process.env.NODE_ENV === "production" ? "https://bdeceri.fr" : "http://localhost:3000");
  const cookieStore = await cookies();
  const flow = parseGoogleAuthFlow(cookieStore.get(GOOGLE_FLOW_COOKIE)?.value);
  cookieStore.set(GOOGLE_FLOW_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: redirectOrigin.startsWith("https://"), path: "/auth/callback", maxAge: 0 });
  const redirectTo = (path: string) => {
    const response = NextResponse.redirect(new URL(path, redirectOrigin));
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  };
  const fail = (code: GoogleAuthErrorCode, sessionEnded = false) => redirectTo(googleAuthErrorPath(sessionEnded ? "login" : flow?.mode || "login", code, flow?.mode === "login" ? flow.returnTo : undefined));

  if (!flow || !matchesGoogleAuthNonce(flow, url.searchParams.get("flow"))) return fail("google_invalid_flow");
  if (!origin) return fail("google_origin_not_configured");
  const configurationError = await getGoogleAuthConfigurationError(flow.mode);
  if (configurationError) return fail(configurationError);
  if (url.searchParams.has("error")) return fail(googleAuthProviderError(url.searchParams.get("error_code") || url.searchParams.get("error")));
  const code = url.searchParams.get("code");
  if (!code || code.length > 2048) return fail("google_invalid_flow");

  let supabase: Awaited<ReturnType<typeof createGoogleAuthClient>> | null = null;
  try {
    supabase = await createGoogleAuthClient();
    if (flow.mode === "link") {
      const current = await supabase.auth.getUser();
      if (current.error || current.data.user?.id !== flow.expectedUserId) {
        await supabase.auth.signOut({ scope: "local" });
        return fail("google_account_mismatch", true);
      }
      const currentMember = await supabase.from("members").select("id").eq("auth_user_id", flow.expectedUserId).maybeSingle();
      if (currentMember.error || !currentMember.data) {
        await supabase.auth.signOut({ scope: "local" });
        return fail(currentMember.error ? "google_failed" : "google_access_denied", true);
      }
    }

    const exchanged = await supabase.auth.exchangeCodeForSession(code);
    if (exchanged.error || !exchanged.data.session) {
      await supabase.auth.signOut({ scope: "local" });
      return fail(exchanged.error ? googleAuthProviderError(exchanged.error.code) : "google_failed", true);
    }
    const verified = await supabase.auth.getUser();
    const user = verified.data.user;
    if (verified.error || !user) {
      await supabase.auth.signOut({ scope: "local" });
      return fail("google_session_expired", true);
    }
    if (flow.mode === "link" && user.id !== flow.expectedUserId) {
      await supabase.auth.signOut({ scope: "local" });
      return fail("google_account_mismatch", true);
    }
    if (!user.identities?.some(identity => identity.provider === "google")) {
      await supabase.auth.signOut({ scope: "local" });
      return fail("google_failed", true);
    }

    // OAuth never claims a profile by email and never changes business tables.
    const member = await supabase.from("members").select("id").eq("auth_user_id", user.id).maybeSingle();
    if (member.error || !member.data) {
      await supabase.auth.signOut({ scope: "local" });
      return fail(member.error ? "google_failed" : "google_access_denied", true);
    }
    revalidatePath("/", "layout");
    const destination = flow.mode === "link" ? "/profil?section=settings&google_status=linked" : flow.returnTo;
    return redirectTo(destination);
  } catch {
    if (supabase) await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    return fail("google_failed", !!supabase);
  }
}

