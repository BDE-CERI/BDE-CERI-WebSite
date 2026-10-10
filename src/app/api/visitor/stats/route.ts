import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createVisitorAdminClient } from "@/utils/visitor-admin";
import { getParisDateKey } from "@/utils/paris-time";
import { hasSiteAdminAccess } from "@/utils/member-roles";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase.from("members").select("category, role, is_dev").eq("auth_user_id", user.id).maybeSingle();
  const isBoard = hasSiteAdminAccess(member?.category, member?.role, member?.is_dev);
  if (!isBoard) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") return NextResponse.json({ error: "MFA required" }, { status: 403 });

  const admin = createVisitorAdminClient();
  if (!admin) {
    console.error("Visitor statistics are missing NEXT_PUBLIC_SUPABASE_URL or a server Supabase key.");
    return NextResponse.json({ error: "Stats are not configured", code: "stats_not_configured" }, { status: 503 });
  }
  const now = new Date();
  const threshold = new Date(now.getTime() - 5 * 60_000).toISOString();
  const [total, active, devices] = await Promise.all([
    admin.from("visitor_stats_totals").select("total_visits").eq("id", 1).maybeSingle(),
    admin.from("visitor_daily_visits").select("visitor_hash", { count: "exact", head: true }).eq("visit_date", getParisDateKey(now)).gte("last_seen", threshold),
    admin.from("visitor_device_totals").select("device_type, visit_count").order("device_type"),
  ]);
  if (total.error || active.error || devices.error) {
    console.error("Visitor statistics queries failed:", {
      total: total.error?.code || total.error?.message,
      active: active.error?.code || active.error?.message,
      devices: devices.error?.code || devices.error?.message,
    });
    return NextResponse.json({ error: "Stats are unavailable", code: "stats_database_unavailable" }, { status: 503 });
  }

  return NextResponse.json({
    totalVisitors: Number(total.data?.total_visits ?? 0),
    activeVisitors: active.count ?? 0,
    activeWindowMinutes: 5,
    deviceTotals: (devices.data ?? []).map((device) => ({ ...device, visit_count: Number(device.visit_count) })),
    consentedOnly: true,
    recordingConfigured: !!process.env.VISITOR_HASH_SECRET,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
