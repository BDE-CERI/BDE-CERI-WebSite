import type { Metadata } from "next";

const siteUrl = "https://bdeceri.fr";
const defaultImage = `${siteUrl}/og-bde-ceri.jpg`;

export function createSeoMetadata({
  path,
  title,
  description,
  image,
  type = "website",
}: {
  path: string;
  title: string;
  description: string;
  image?: string | null;
  type?: "website" | "article";
}): Metadata {
  const socialTitle = `${title} | BDE CERI Avignon`;
  const socialImage = image || defaultImage;

  return {
    title,
    description,
    alternates: { canonical: new URL(path, siteUrl).toString() },
    openGraph: {
      title: socialTitle,
      description,
      url: new URL(path, siteUrl).toString(),
      siteName: "BDE CERI Avignon",
      locale: "fr_FR",
      type,
      images: [{ url: socialImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [socialImage],
    },
  };
}
