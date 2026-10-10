import { getLang } from "@/locales/dictionaries";
import EsportClient from "./EsportClient";
import { createSeoMetadata } from "@/utils/seo";
import { createClient } from "@/utils/supabase/server";

export const metadata = createSeoMetadata({
  path: "/esport",
  title: "eSport étudiant au CERI",
  description: "Suis les streams, tournois et équipes eSport du CERI à Avignon avec le BDE.",
});

export default async function EsportPage() {
  const lang = await getLang();
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("events").select("*").eq("is_esport", true)
    .or(`date_is_tbd.eq.true,date_start.gte.${now}`)
    .order("date_is_tbd", { ascending: false }).order("date_start", { ascending: true });
  const schemaMissing = Boolean(error && /is_esport|date_is_tbd/i.test(error.message));
  const eventsError = Boolean(error && !schemaMissing);
  if (error && !schemaMissing) console.error("Impossible de charger les événements eSport :", error.message, error.code);
  return <EsportClient lang={lang === "en" ? "en" : "fr"} events={data || []} schemaMissing={schemaMissing} eventsError={eventsError} />;
}
