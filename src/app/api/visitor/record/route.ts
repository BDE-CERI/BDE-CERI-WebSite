import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createVisitorAdminClient } from "@/utils/visitor-admin";
import { getParisDateKey } from "@/utils/paris-time";

export const runtime = "nodejs";

function deviceType(userAgent: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|kindle|silk|playbook/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|ipod|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  if (request.cookies.get("bde_cookie_consent")?.value !== "accepted") {
    return new NextResponse(null, { status: 204 });
  }

  const admin = createVisitorAdminClient();
  const secret = process.env.VISITOR_HASH_SECRET;
  if (!admin || !secret) {
    return NextResponse.json({ recorded: false, reason: "analytics_not_configured" }, { status: 503 });
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = request.headers.get("x-real-ip")?.trim() || forwarded;
  if (!ip) return NextResponse.json({ recorded: false, reason: "ip_unavailable" }, { status: 503 });

  const visitDate = getParisDateKey();
  const visitorHash = createHmac("sha256", secret).update(visitDate).update(":").update(ip).digest("hex");
  const { error } = await admin.rpc("record_visitor_visit", {
    p_visit_date: visitDate,
    p_visitor_hash: visitorHash,
    p_device_type: deviceType(request.headers.get("user-agent") ?? ""),
  });
  if (error) {
    console.error("Could not record an opted-in visit:", error.message);
    return NextResponse.json({ recorded: false }, { status: 503 });
  }

  return NextResponse.json({ recorded: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
}
