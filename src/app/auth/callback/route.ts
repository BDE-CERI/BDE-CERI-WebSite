import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  if (!code) {
    return NextResponse.redirect(
      `${siteUrl}/login?error=google`
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Google OAuth error:", error.message);

    return NextResponse.redirect(
      `${siteUrl}/login?error=google`
    );
  }

  return NextResponse.redirect(`${siteUrl}/`);
}