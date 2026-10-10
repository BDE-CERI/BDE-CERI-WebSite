import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { ExperienceMediaResource, ExperienceMediaSection } from "@/utils/experience-media";

export const dynamic = "force-dynamic";

const staticResources: ExperienceMediaResource[] = [
  { url: "/og-bde-ceri.jpg", section: "brand" },
  { url: "/logos/BDE-CERI-logo.png", section: "brand" },
  { url: "/logos/requin-tile.webp", section: "brand" },
  { url: "/logos/requin-512.png", section: "brand" },
];

function imageResources(rows: Array<{ image_url?: string | null; photo_url?: string | null }> | null, section: ExperienceMediaSection, field: "image_url" | "photo_url" = "image_url") {
  return (rows ?? []).flatMap(row => {
    const value = row[field];
    if (!value) return [];
    try {
      const url = new URL(value, process.env.NEXT_PUBLIC_SITE_URL || "https://bdeceri.fr");
      if (url.protocol !== "https:" && url.origin !== "https://bdeceri.fr") return [];
      return [{ url: url.toString(), section }];
    } catch {
      return [];
    }
  });
}

export async function GET() {
  const resources = [...staticResources];

  try {
    const supabase = await createClient();
    const [events, news, poles, members] = await Promise.all([
      supabase.from("events").select("image_url").in("status", ["upcoming", "ongoing"]).not("image_url", "is", null).order("date_start", { ascending: true, nullsFirst: false }).limit(16),
      supabase.from("news").select("image_url").eq("is_published", true).not("image_url", "is", null).order("published_at", { ascending: false }).limit(12),
      supabase.from("poles").select("image_url").not("image_url", "is", null).order("order_index", { ascending: true }).limit(12),
      supabase.from("members").select("photo_url").eq("is_visible", true).not("photo_url", "is", null).order("id", { ascending: true }).limit(24),
    ]);

    if (events.error || news.error || poles.error || members.error) {
      return NextResponse.json({ error: "The image list is temporarily unavailable." }, {
        status: 503,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      });
    }

    resources.push(
      ...imageResources(events.data, "events"),
      ...imageResources(news.data, "news"),
      ...imageResources(poles.data, "teams"),
      ...imageResources(members.data, "members", "photo_url"),
    );
  } catch {
    return NextResponse.json({ error: "The image list is temporarily unavailable." }, {
      status: 503,
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  }

  const uniqueResources = Array.from(new Map(resources.map(resource => [resource.url, resource])).values());
  const version = createHash("sha256")
    .update(uniqueResources.map(resource => `${resource.section}:${resource.url}`).sort().join("\n"))
    .digest("hex")
    .slice(0, 16);

  return NextResponse.json(
    { version, resources: uniqueResources },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
