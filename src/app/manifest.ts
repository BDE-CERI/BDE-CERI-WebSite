import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BDE CERI Avignon",
    short_name: "BDE CERI",
    description: "Site officiel interactif du BDE CERI - Université d'Avignon",
    start_url: "/",
    display: "standalone",
    background_color: "#070d1f",
    theme_color: "#070d1f",
    icons: [
      {
        src: "/logos/requin.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logos/requin.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
