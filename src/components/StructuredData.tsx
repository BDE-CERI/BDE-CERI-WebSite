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

export default function StructuredData() {
  return <JsonLd data={[organization, website]} />;
}

export function JsonLd({ data }: { data: unknown }) {
  const jsonLd = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />;
}
