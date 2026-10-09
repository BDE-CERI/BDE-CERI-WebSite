import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createVisitorAdminClient } from "@/utils/visitor-admin";
import { getParisDateKey } from "@/utils/paris-time";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase.from("members").select("category, role").eq("auth_user_id", user.id).maybeSingle();
  const isBoard = member?.category === "bureau_restreint" || ["president", "tresorier", "secretaire", "vp_general"].includes(member?.role ?? "");
  if (!isBoard) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createVisitorAdminClient();
  if (!admin) return NextResponse.json({ error: "Stats are not configured" }, { status: 503 });
  const now = new Date();
  const threshold = new Date(now.getTime() - 5 * 60_000).toISOString();
  const [total, active, devices] = await Promise.all([
    admin.from("visitor_stats_totals").select("total_visits").eq("id", 1).maybeSingle(),
    admin.from("visitor_daily_visits").select("visitor_hash", { count: "exact", head: true }).eq("visit_date", getParisDateKey(now)).gte("last_seen", threshold),
    admin.from("visitor_device_totals").select("device_type, visit_count").order("device_type"),
  ]);
  if (total.error || active.error || devices.error) return NextResponse.json({ error: "Stats are unavailable" }, { status: 503 });

  return NextResponse.json({
    totalVisitors: Number(total.data?.total_visits ?? 0),
    activeVisitors: active.count ?? 0,
    activeWindowMinutes: 5,
    deviceTotals: (devices.data ?? []).map((device) => ({ ...device, visit_count: Number(device.visit_count) })),
    consentedOnly: true,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
