import { NextRequest, NextResponse } from "next/server";

const CONSENT_COOKIE = "bde_cookie_consent";
const validChoice = (value: unknown): value is "accepted" | "rejected" => value === "accepted" || value === "rejected";

export async function GET(request: NextRequest) {
  const storedChoice = request.cookies.get(CONSENT_COOKIE)?.value;
  const choice = validChoice(storedChoice) ? storedChoice : null;
  return NextResponse.json({ choice }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  let body: { choice?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!validChoice(body.choice)) {
    return NextResponse.json({ error: "Invalid choice" }, { status: 400 });
  }

  const response = NextResponse.json({ choice: body.choice });
  response.cookies.set(CONSENT_COOKIE, body.choice, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return response;
}
