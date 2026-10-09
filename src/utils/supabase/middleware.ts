import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return supabaseResponse;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        const previousCookies = supabaseResponse.cookies.getAll();
        const previousHeaders = new Headers(supabaseResponse.headers);
        supabaseResponse = NextResponse.next({ request });
        previousCookies.forEach(cookie => supabaseResponse.cookies.set(cookie));
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options));
        for (const name of ["cache-control", "expires", "pragma"]) {
          const value = previousHeaders.get(name);
          if (value) supabaseResponse.headers.set(name, value);
        }
        // @supabase/ssr supplies these headers to prevent shared session caching.
        Object.entries(cacheHeaders).forEach(([name, value]) =>
          supabaseResponse.headers.set(name, value));
      },
    },
  });

  // Verify the token and refresh it before Server Components read the cookies.
  // Authorization remains in the pages/actions and their SQL functions.
  await supabase.auth.getClaims();
  return supabaseResponse;
}
