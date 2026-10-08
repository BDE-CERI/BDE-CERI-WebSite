import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/profil", "/login", "/api/"],
    },
    sitemap: "https://bdeceri.fr/sitemap.xml",
    host: "https://bdeceri.fr",
  };
}
