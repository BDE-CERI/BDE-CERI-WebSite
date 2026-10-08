import { getLang } from "@/locales/dictionaries";
import EsportClient from "./EsportClient";
import { createSeoMetadata } from "@/utils/seo";

export const metadata = createSeoMetadata({
  path: "/esport",
  title: "eSport étudiant au CERI",
  description: "Suis les streams, tournois et équipes eSport du CERI à Avignon avec le BDE.",
});

export default async function EsportPage() {
  const lang = await getLang();
  return <EsportClient lang={lang === "en" ? "en" : "fr"} />;
}
