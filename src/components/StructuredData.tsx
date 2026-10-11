import { headers } from "next/headers";

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "BDE CERI Avignon",
  alternateName: "Bureau des étudiants du CERI",
  url: "https://bdeceri.fr",
  logo: "https://bdeceri.fr/logos/requin-512.png",
};

const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "BDE CERI Avignon",
  url: "https://bdeceri.fr",
  inLanguage: ["fr-FR", "en"],
};

export default function StructuredData({ nonce }: { nonce?: string }) {
  return <JsonLd data={[organization, website]} nonce={nonce} />;
}

export async function JsonLd({ data, nonce }: { data: unknown; nonce?: string }) {
  const jsonLd = JSON.stringify(data).replace(/</g, "\\u003c");
  const scriptNonce = nonce ?? (await headers()).get("x-nonce") ?? undefined;
  return <script nonce={scriptNonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />;
}
