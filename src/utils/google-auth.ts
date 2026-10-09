import "server-only";

import { randomBytes, timingSafeEqual } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

export const GOOGLE_FLOW_COOKIE = "bde_google_flow";
export const GOOGLE_FLOW_MAX_AGE = 10 * 60;

export type GoogleAuthErrorCode =
  | "google_not_configured"
  | "google_cancelled"
  | "google_failed"
  | "google_invalid_flow"
  | "google_access_denied"
  | "google_account_mismatch"
  | "google_linking_disabled"
  | "google_session_expired";

export type GoogleAuthFlow =
  | { nonce: string; mode: "login"; expectedUserId: null; issuedAt: number }
  | { nonce: string; mode: "link"; expectedUserId: string; issuedAt: number };

function configuredSupabaseUrl(): URL | null {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.username || url.password || (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && local && url.protocol === "http:"))) return null;
    return url;
  } catch {
    return null;
  }
}

/** Only the configured production origin or a local development origin is trusted. */
export async function getGoogleAuthOrigin(): Promise<string | null> {
  if (process.env.NODE_ENV === "production") {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || "");
      if (url.protocol !== "https:" || url.username || url.password) return null;
      const host = (await headers()).get("host");
      if (!host) return null;
      const requestOrigin = new URL("https://" + host);
      // Refuse aliases and preview hosts before setting a PKCE or flow cookie.
      return !requestOrigin.username && !requestOrigin.password && requestOrigin.origin === url.origin ? url.origin : null;
    } catch {
      return null;
    }
  }

  const host = (await headers()).get("host");
  if (!host) return "http://localhost:3000";
  try {
    const url = new URL("http://" + host);
    return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) && !url.username && !url.password ? url.origin : null;
  } catch {
    return null;
  }
}

/** Public Auth settings are checked live, independently at display, start and callback. */
export async function getGoogleAuthReadiness(): Promise<boolean> {
  const base = configuredSupabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key || !await getGoogleAuthOrigin()) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const settingsUrl = new URL(base.toString().replace(/\/$/, "") + "/auth/v1/settings");
    const response = await fetch(settingsUrl, {
      headers: { apikey: key },
      cache: "no-store",
      signal: controller.signal,
      redirect: "error",
    });
    if (!response.ok) return false;
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
    const settings = payload as Record<string, unknown>;
    const external = settings.external;
    return settings.disable_signup === true && !!external && typeof external === "object" && !Array.isArray(external)
      && (external as Record<string, unknown>).google === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export function createGoogleAuthFlow(mode: "login"): GoogleAuthFlow;
export function createGoogleAuthFlow(mode: "link", expectedUserId: string): GoogleAuthFlow;
export function createGoogleAuthFlow(mode: "login" | "link", expectedUserId?: string): GoogleAuthFlow {
  const common = { nonce: randomBytes(32).toString("base64url"), issuedAt: Date.now() };
  if (mode === "link" && expectedUserId) return { ...common, mode, expectedUserId };
  return { ...common, mode: "login", expectedUserId: null };
}

export function encodeGoogleAuthFlow(flow: GoogleAuthFlow): string {
  return Buffer.from(JSON.stringify(flow)).toString("base64url");
}

export function parseGoogleAuthFlow(value: string | undefined): GoogleAuthFlow | null {
  if (!value || value.length > 1024 || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const decoded: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) return null;
    const flow = decoded as Record<string, unknown>;
    if (typeof flow.nonce !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(flow.nonce) || typeof flow.issuedAt !== "number" || !Number.isSafeInteger(flow.issuedAt)) return null;
    const age = Date.now() - flow.issuedAt;
    if (age < 0 || age > GOOGLE_FLOW_MAX_AGE * 1000) return null;
    if (flow.mode === "login" && flow.expectedUserId === null) return { nonce: flow.nonce, issuedAt: flow.issuedAt, mode: "login", expectedUserId: null };
    if (flow.mode === "link" && typeof flow.expectedUserId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(flow.expectedUserId)) {
      return { nonce: flow.nonce, issuedAt: flow.issuedAt, mode: "link", expectedUserId: flow.expectedUserId };
    }
    return null;
  } catch {
    return null;
  }
}

export function matchesGoogleAuthNonce(flow: GoogleAuthFlow, nonce: string | null): boolean {
  return !!nonce && /^[A-Za-z0-9_-]{43}$/.test(nonce) && timingSafeEqual(Buffer.from(flow.nonce), Buffer.from(nonce));
}

export function googleAuthErrorPath(mode: GoogleAuthFlow["mode"], code: GoogleAuthErrorCode): string {
  return mode === "link" ? "/profil?section=settings&google_error=" + code : "/login?error=" + code;
}

export function googleAuthProviderError(value: unknown): GoogleAuthErrorCode {
  switch (value) {
    case "access_denied": return "google_cancelled";
    case "signup_disabled":
    case "email_exists":
    case "identity_already_exists": return "google_access_denied";
    case "manual_linking_disabled": return "google_linking_disabled";
    case "session_not_found":
    case "session_expired": return "google_session_expired";
    default: return "google_failed";
  }
}

export function isTrustedGoogleAuthorizeUrl(value: string): boolean {
  const base = configuredSupabaseUrl();
  try {
    const url = new URL(value);
    if (base && url.origin === base.origin && url.pathname === base.pathname.replace(/\/$/, "") + "/auth/v1/authorize") return url.searchParams.get("provider") === "google";
    return url.protocol === "https:" && url.hostname === "accounts.google.com" && !url.username && !url.password;
  } catch {
    return false;
  }
}

/**
 * Strip Google provider credentials before the Auth SDK can persist the session.
 * The app keeps only the Supabase access/refresh tokens it needs for its own session.
 */
export async function createGoogleAuthClient() {
  const cookieStore = await cookies();
  const base = configuredSupabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) throw new Error("Auth configuration unavailable");
  const tokenPath = base.pathname.replace(/\/$/, "") + "/auth/v1/token";

  const authFetch: typeof fetch = async (input, init) => {
    const response = await fetch(input, init);
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url);
    if (response.ok && url.origin === base.origin && url.pathname === tokenPath) {
      const payload: unknown = await response.json();
      if (payload && typeof payload === "object" && !Array.isArray(payload)) {
        const session = payload as Record<string, unknown>;
        delete session.provider_token;
        delete session.provider_refresh_token;
        const responseHeaders = new Headers(response.headers);
        responseHeaders.delete("content-length");
        responseHeaders.delete("content-encoding");
        return new Response(JSON.stringify(session), { status: response.status, statusText: response.statusText, headers: responseHeaders });
      }
      throw new Error("Unexpected Auth response");
    }
    return response;
  };

  return createServerClient(base.toString().replace(/\/$/, ""), key, {
    global: { fetch: authFetch },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: values => values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
    },
  });
}
