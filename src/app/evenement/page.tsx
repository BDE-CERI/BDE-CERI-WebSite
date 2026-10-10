import { getDictionary, getLang } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import SharkWallpaper from "@/components/SharkWallpaper";
import { createSeoMetadata } from "@/utils/seo";
import { formatParisDateTime } from "@/utils/paris-time";

export const metadata = createSeoMetadata({
  path: "/evenement",
  title: "Événements étudiants à Avignon",
  description: "Retrouve les prochains événements, soirées, ateliers et rendez-vous étudiants organisés par le BDE CERI à Avignon.",
});

export default async function Evenements() {
  const dict = await getDictionary();
  const lang = await getLang();
  const dateLocale = lang === "en" ? "en-GB" : "fr-FR";
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  let { data: eventsData, error: eventsError } = await supabase
    .from("events")
    .select("*")
    .or("date_is_tbd.eq.true,date_start.gte." + nowIso)
    .order("date_is_tbd", { ascending: false })
    .order("date_start", { ascending: true });

  // Keep dated upcoming events visible if the optional TBD column has not
  // been added to this Supabase project yet.
  if (eventsError && /date_is_tbd/i.test(eventsError.message)) {
    const fallback = await supabase
      .from("events")
      .select("*")
      .gte("date_start", nowIso)
      .order("date_start", { ascending: true });
    eventsData = fallback.data;
    eventsError = fallback.error;
  }

  if (eventsError) {
    console.error("Impossible de charger les événements à venir :", eventsError);
  }

  const eventsList = eventsData || [];

  const styles = [
    { colSpan: "md:col-span-8", cardType: "image-bg" },
    { colSpan: "md:col-span-4", cardType: "solid", icon: "code", iconType: "schedule" },
    { colSpan: "md:col-span-4", cardType: "solid", icon: "local_cafe", iconType: "location_on" },
    { colSpan: "md:col-span-8", cardType: "image-bg-alt" }
  ];

  const formatDate = (isoStr: string | null, dateIsTbd = false) => {
    if (dateIsTbd || !isoStr) return dict.events.coming_soon;
    return formatParisDateTime(isoStr, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }, dateLocale);
  };

  return (
    <div className="flex-grow pt-12 pb-24 px-4 sm:px-8 max-w-7xl mx-auto w-full flex flex-col gap-24 relative overflow-hidden">
      <SharkWallpaper />
      {/* Hero Section */}
      <header className="relative w-full rounded-xl overflow-hidden glass-panel border-b border-outline-variant/15 px-5 py-10 sm:p-12 md:p-24 flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-surface-container-low to-surface-container-lowest opacity-80 -z-10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-tertiary/5 rounded-full blur-[100px] -z-10"></div>
        <p className="font-label text-on-surface-variant tracking-[0.1em] uppercase text-sm mb-4">{dict.events.discover_night}</p>
        <h1 className="headline-display text-4xl sm:text-5xl md:text-7xl font-bold mb-6 text-gradient">{dict.events.title}</h1>
        <p className="font-body text-lg text-on-surface/80 max-w-2xl mx-auto leading-relaxed">
          {dict.events.description}
        </p>
      </header>

      {/* Events Grid */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8 auto-rows-[minmax(300px,auto)]">
        {eventsList.length === 0 ? <div className="col-span-full rounded-2xl border border-outline-variant/15 bg-surface-container-low p-8 text-center text-sm text-on-surface-variant">{dict.events.empty_upcoming}</div> : eventsList.map((event, index) => {
          const style = styles[index % styles.length];
          const displayDate = formatDate(event.date_start, event.date_is_tbd);
          const defaultImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuC1Csx9XytUFcnaj9-80c3AdoLyoCl09Hn3cYIXr5zFwE_ng0vT6M2wAFHhctqlYN1VAPzzczxDCRLK-arIqeAhrl7KQZ6EdMY7phY3BBI3qFbCTGAZRhquIcoobJIMnWPs2KNoKSOUs6X7BxtPSxx1EpQMG7AaQr_pfHjC8D2bVCSeCbhM9jyRB4QdORjjmDC2qaKxx_1Q98m9QKoQ_sAvjzIVWd62gbclKgX6iboqT2XNRdc4SilmWwrPDw79aU8fUgqS4olL4k6q";

          if (style.cardType === "image-bg") {
            return (
              <article key={event.id} className={`${style.colSpan} mysterious-card bg-surface-container-high rounded-xl p-8 flex flex-col justify-end min-h-[400px] border-b border-outline-variant/15 relative group cursor-pointer`}>
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-30 transition-opacity duration-500 rounded-xl"
                  style={{ backgroundImage: `url('${event.image_url || defaultImage}')` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest via-surface-container-high/80 to-transparent rounded-xl"></div>
                <div className="mysterious-card-content relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex flex-wrap items-center gap-2"><span className="bg-tertiary/20 text-tertiary px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">{event.category || "Event"}</span>{event.is_esport && <span className="inline-flex items-center gap-1 rounded-full bg-[#9146FF]/15 px-2.5 py-1 text-xs font-bold text-[#D1B4FF]"><span aria-hidden="true" className="material-symbols-outlined text-sm">sports_esports</span>eSport</span>}</div>
                    <span className="text-on-surface-variant text-sm font-label flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">calendar_month</span> {displayDate}
                    </span>
                  </div>
                  <h2 className="headline-display text-3xl md:text-4xl font-bold text-on-surface mb-2 group-hover:text-tertiary transition-colors">{event.title}</h2>
                  <p className="font-body text-on-surface-variant mb-6 max-w-lg whitespace-pre-line break-words line-clamp-5">{event.description}</p>
                  <Link href={`/evenement/${event.id}`}>
                    <button className="bg-tertiary text-on-tertiary px-6 py-3 rounded-lg font-bold flex items-center gap-2 w-max hover:shadow-[0_0_20px_rgba(123,208,255,0.3)] transition-all">
                      {dict.events.reveal_details}
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                  </Link>
                </div>
              </article>
            );
          }
          if (style.cardType === "solid") {
            return (
              <Link key={event.id} href={`/evenement/${event.id}`} className={style.colSpan}>
                <article className="mysterious-card bg-surface-container-low rounded-xl p-8 flex flex-col min-h-[350px] border-b border-outline-variant/15 relative cursor-pointer h-full">
                  <div className="flex justify-between items-start mb-auto mysterious-card-content">
                    <div className="flex flex-wrap items-center gap-2"><span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">{event.category || "Event"}</span>{event.is_esport && <span className="inline-flex items-center gap-1 rounded-full bg-[#9146FF]/15 px-2.5 py-1 text-xs font-bold text-[#D1B4FF]"><span aria-hidden="true" className="material-symbols-outlined text-sm">sports_esports</span>eSport</span>}</div>
                    <span className="material-symbols-outlined text-outline">{style.icon}</span>
                  </div>
                  <div className="mysterious-card-content mt-8">
                    <span className="text-on-surface-variant text-sm font-label flex items-center gap-1 mb-2">
                      <span className="material-symbols-outlined text-[16px]">{style.iconType}</span> {displayDate}
                    </span>
                    <h3 className="headline-display text-2xl font-bold text-on-surface mb-2">{event.title}</h3>
                    <p className="font-body text-on-surface-variant text-sm mb-6 whitespace-pre-line break-words line-clamp-5">{event.description}</p>
                  </div>
                </article>
              </Link>
            );
          }
          if (style.cardType === "image-bg-alt") {
            return (
              <Link key={event.id} href={`/evenement/${event.id}`} className={style.colSpan}>
                <article className="mysterious-card bg-surface-container-high rounded-xl p-8 flex flex-col justify-end min-h-[350px] border-b border-outline-variant/15 relative group cursor-pointer h-full">
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity duration-500 rounded-xl"
                    style={{ backgroundImage: `url('${event.image_url || defaultImage}')` }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest to-transparent rounded-xl"></div>
                  <div className="mysterious-card-content relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                      <div className="mb-4 flex flex-wrap items-center gap-2"><span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">{event.category || "Event"}</span>{event.is_esport && <span className="inline-flex items-center gap-1 rounded-full bg-[#9146FF]/15 px-2.5 py-1 text-xs font-bold text-[#D1B4FF]"><span aria-hidden="true" className="material-symbols-outlined text-sm">sports_esports</span>eSport</span>}</div>
                      <h3 className="headline-display text-2xl md:text-3xl font-bold text-on-surface mb-2">{event.title}</h3>
                      <p className="font-body text-on-surface-variant max-w-md whitespace-pre-line break-words line-clamp-5">{event.description}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-3xl font-bold text-tertiary font-headline mb-1">{displayDate}</div>
                    </div>
                  </div>
                </article>
              </Link>
            );
          }
          return null;
        })}
      </section>

      <section className="glass-modal p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-outline-variant/15 relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 max-w-xl">
          <h2 className="headline-display text-2xl font-bold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span>
            {dict.events.archives_title}
          </h2>
          <p className="font-body text-on-surface-variant">
            {dict.events.archives_desc}
          </p>
        </div>
        <Link href="/evenement/archives" className="relative z-10">
          <button className="bg-surface-container-highest text-primary border-b border-outline-variant/30 hover:border-primary px-6 py-3 rounded-lg font-medium transition-all hover:bg-surface-container-high whitespace-nowrap">
            {dict.events.archives_btn}
          </button>
        </Link>
      </section>
    </div>
  );
}
