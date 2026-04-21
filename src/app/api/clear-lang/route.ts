import { NextResponse } from "next/server";

// One-time cleanup route: clears the old 'lang' cookie that causes /fr redirect
export async function GET() {
  const response = NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SUPABASE_URL ? "http://localhost:3000" : "http://localhost:3000"));
  // Delete the old cookie that was causing Next.js to redirect to /fr
  response.cookies.set("lang", "", { maxAge: 0, path: "/" });
  response.cookies.set("NEXT_LOCALE", "", { maxAge: 0, path: "/" });
  return response;
}
