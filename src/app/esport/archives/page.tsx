import Link from "next/link";
import { getLang } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import { createSeoMetadata } from "@/utils/seo";
import { formatParisDateTime } from "@/utils/paris-time";

export const metadata = createSeoMetadata({
  path: "/esport/archives",
  title: "Archives eSport du BDE CERI",
  description: "Retrouve les tournois et rencontres eSport passés du BDE CERI à Avignon.",
});

export default async function EsportArchivesPage() {
  const [lang, supabase] = await Promise.all([getLang(), createClient()]);
  const english = lang === "en";
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("events").select("*").eq("is_esport", true)
    .or(`status.eq.past,date_start.lt.${now}`).order("date_start", { ascending: false });
  const schemaMissing = Boolean(error && /is_esport/i.test(error.message));
  if (error && !schemaMissing) console.error("Impossible de charger les archives eSport :", error.message, error.code);
  const archives = data || [];

  return <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
    <Link href="/esport" className="mb-8 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#c7a5ff] hover:gap-3"><span aria-hidden="true" className="material-symbols-outlined text-lg">arrow_back</span>{english ? "Back to eSports" : "Retour à l’eSport"}</Link>
    <header className="mb-10 max-w-3xl">
      <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[#B98BFF]">CERI eSport</p>
      <h1 className="font-headline text-4xl font-bold text-on-surface sm:text-6xl">{english ? "eSports archive" : "Archives eSport"}</h1>
      <p className="mt-4 text-base leading-7 text-on-surface-variant">{english ? "Browse past BDE CERI tournaments and eSports meetups." : "Retrouve les tournois et rencontres eSport passés du BDE CERI."}</p>
    </header>
    {schemaMissing || error ? <div role="status" className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-8 text-sm text-on-surface-variant">{schemaMissing ? (english ? "Enable the eSports event category in Supabase to publish these events." : "La catégorie eSport doit être activée dans Supabase pour publier ces événements.") : (english ? "The eSports archive is temporarily unavailable." : "Les archives eSport sont momentanément indisponibles.")}</div> : archives.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {archives.map(event => <Link key={event.id} href={`/evenement/${event.id}`} className="group overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-low transition hover:-translate-y-1 hover:border-[#9146FF]/40 hover:shadow-xl">
        <div className="relative flex aspect-[16/9] items-end overflow-hidden bg-surface-container-high p-4">
          {event.image_url && <div aria-hidden="true" className="absolute inset-0 bg-cover bg-center opacity-60 transition duration-500 group-hover:scale-105 group-hover:opacity-80" style={{ backgroundImage: `url("${String(event.image_url).replaceAll('"', '%22')}")` }} />}
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-surface-container-highest to-transparent" />
          <span className="relative z-10 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-bold text-white">{event.date_start ? formatParisDateTime(event.date_start, { dateStyle: "medium" }, english ? "en-GB" : "fr-FR") : (english ? "Past event" : "Événement passé")}</span>
        </div>
        <div className="p-5">
          <h2 className="font-headline text-xl font-bold text-on-surface group-hover:text-[#c7a5ff]">{event.title}</h2>
          <p className="mt-2 line-clamp-4 whitespace-pre-line break-words text-sm leading-6 text-on-surface-variant">{event.description}</p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#c7a5ff]">{english ? "Event details" : "Détails de l’événement"}<span aria-hidden="true" className="material-symbols-outlined text-base">arrow_forward</span></span>
        </div>
      </Link>)}
    </div> : <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-10 text-center"><span aria-hidden="true" className="material-symbols-outlined text-4xl text-[#B98BFF]">sports_esports</span><p className="mt-3 text-sm text-on-surface-variant">{english ? "There are no past eSports events in the archive yet." : "Aucun événement eSport passé n’est encore archivé."}</p></div>}
  </main>;
}
