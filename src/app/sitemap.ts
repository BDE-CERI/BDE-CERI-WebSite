import type { MetadataRoute } from "next";
import { createClient } from "@/utils/supabase/server";

const siteUrl = "https://bdeceri.fr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/poles`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/esport`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/evenement`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/evenement/archives`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/equipe`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/boutique`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/adhesion`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/contact`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${siteUrl}/cgu`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/cgv`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/cookies`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const supabase = await createClient();
    const [eventsResult, newsResult, polesResult, membersResult, productsResult, tavernResult] = await Promise.all([
      supabase.from("events").select("id").in("status", ["upcoming", "ongoing", "past"]),
      supabase.from("news").select("id").eq("is_published", true),
      supabase.from("poles").select("id"),
      supabase.from("members").select("id, current_academic_year, category").eq("is_visible", true),
      supabase.from("products").select("id"),
      supabase.from("taverne_items").select("id"),
    ]);

    const years = (membersResult.data || [])
      .map((member) => member.current_academic_year)
      .filter((year): year is string => Boolean(year))
      .sort();
    const currentYear = years[years.length - 1];

    const dynamicRoutes = [
      ...(eventsResult.data || []).map(({ id }) => `/evenement/${id}`),
      ...(newsResult.data || []).map(({ id }) => `/news/${id}`),
      ...(polesResult.data || []).map(({ id }) => `/poles/${id}`),
      ...(membersResult.data || [])
        .filter((member) => member.current_academic_year === currentYear || member.category === "membre_honneur")
        .map(({ id }) => `/equipe/${id}`),
      ...(productsResult.data || []).map(({ id }) => `/boutique/${id}`),
      ...(tavernResult.data || []).map(({ id }) => `/boutique/${id}`),
    ];

    for (const path of new Set(dynamicRoutes)) {
      entries.push({ url: `${siteUrl}${path}`, changeFrequency: "monthly", priority: 0.5 });
    }
  } catch (error) {
    console.error("Could not load dynamic sitemap entries:", error);
  }

  return entries;
}
