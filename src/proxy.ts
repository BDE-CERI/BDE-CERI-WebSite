import type { NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const nonce = btoa(String.fromCharCode(...nonceBytes));
  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
    : "https://qmfcnrhclvpxgqljbyxm.supabase.co";
  const supabaseWebSocketOrigin = supabaseOrigin.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    `img-src 'self' data: blob: https:`,
    `connect-src 'self' ${supabaseOrigin} ${supabaseWebSocketOrigin}`,
    "frame-src 'self' https://www.helloasso.com https://helloasso.com https://player.twitch.tv https://www.twitch.tv",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);
  const response = await updateSession(request, requestHeaders);
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  return response;
}

export const config = {
  matcher: [
    // OAuth consumes its own PKCE/session cookies. Static assets do not need Auth.
    "/((?!_next/static|_next/image|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|woff|woff2|ttf|otf|pdf|txt|xml)$).*)",
  ],
};
