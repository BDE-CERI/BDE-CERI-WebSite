import type { NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // OAuth consumes its own PKCE/session cookies. Static assets do not need Auth.
    "/((?!_next/static|_next/image|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|woff|woff2|ttf|otf|pdf|txt|xml)$).*)",
  ],
};
