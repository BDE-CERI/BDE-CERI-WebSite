import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUserContext } from "@/utils/supabase/current-user";
import EventCarousel from "@/components/EventCarousel";
import NewsSection from "@/components/NewsSection";
import ShopAdBanner from "@/components/ShopAdBanner";
import { getShopAdvertisingImages } from "@/utils/shop-advertising";
import { getPublicMemberLastName } from "@/utils/member-display";
import { hasSiteAdminAccess } from "@/utils/member-roles";
import type { getDictionary } from "@/locales/dictionaries";
type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
export default async function HomeShowcase({ dict, lang }: { dict: Dictionary; lang: string }) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const [datedEventsResult, tbdEventsResult, { data: newsData }, { member }, shopImages] = await Promise.all([
    supabase.from("events").select("*")
      .gte("date_start", now).order("date_start", { ascending: true }).limit(5),
    supabase.from("events").select("*")
      .eq("date_is_tbd", true).order("date_start", { ascending: true }).limit(5),
    supabase.from("news").select("id, title, content, image_url, published_at, is_anonymous, author_id, members(first_name,last_name,hide_last_name,is_visible)")
      .eq("is_published", true).order("published_at", { ascending: false }).limit(4),
    getCurrentUserContext(), getShopAdvertisingImages(),
  ]);
  if (datedEventsResult.error) {
    console.error("Impossible de charger les événements datés de l'accueil :", datedEventsResult.error.message, datedEventsResult.error.code);
  }
  if (tbdEventsResult.error && !/date_is_tbd/i.test(tbdEventsResult.error.message)) {
    console.warn("Impossible de charger les événements sans date de l'accueil :", tbdEventsResult.error.message, tbdEventsResult.error.code);
  }
  const eventsData = [
    ...(datedEventsResult.data ?? []).map(event => ({ ...event, date_is_tbd: false })),
    ...(tbdEventsResult.data ?? []),
  ];
  const upcomingEvents = Array.from(new Map(eventsData.map(event => [event.id, event])).values())
    .sort((a, b) => Number(Boolean(b.date_is_tbd)) - Number(Boolean(a.date_is_tbd))
      || (a.date_start ? new Date(a.date_start).getTime() : Number.MAX_SAFE_INTEGER)
        - (b.date_start ? new Date(b.date_start).getTime() : Number.MAX_SAFE_INTEGER))
    .slice(0, 5);
  const isBoard = hasSiteAdminAccess(member?.category, member?.role, member?.is_dev);
  const isCOMMember = member?.member_assignments?.some(assignment => { const pole = Array.isArray(assignment.poles) ? assignment.poles[0] : assignment.poles; return typeof pole?.name === "string" && /(?:communication|\bcom\b)/i.test(pole.name); });
  const news = (newsData ?? []).map(item => {
    const author = Array.isArray(item.members) ? item.members[0] : item.members;
    return { id: item.id, title: item.title, content: item.content, image_url: item.image_url || undefined, published_at: item.published_at, is_anonymous: Boolean(item.is_anonymous), members: item.is_anonymous || !author ? undefined : { first_name: author.first_name || "", last_name: getPublicMemberLastName(author), hide_last_name: author.hide_last_name !== false } };
  });
  const secondaryEvent = upcomingEvents[1];
  return <>
    <NewsSection news={news} dict={dict} isAdmin={Boolean(isBoard || isCOMMember)} />
    <section className="relative z-10 bg-surface py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:mb-16 sm:flex-row sm:items-end sm:justify-between sm:gap-6"><div><h2 className="mb-2 text-sm font-label uppercase tracking-[0.1em] text-on-surface-variant">{dict.home.roster_title}</h2><h3 className="font-headline text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">{dict.home.discover_events}</h3></div><Link href="/evenement" className="flex items-center gap-1 space-x-1 text-sm font-label font-medium text-tertiary transition-colors hover:text-white"><span>{dict.home.view_all_events}</span><span aria-hidden="true" className="material-symbols-outlined text-sm">arrow_forward</span></Link></div>
        {upcomingEvents.length === 0 ? <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-8 text-center"><span aria-hidden="true" className="material-symbols-outlined text-3xl text-tertiary">event_busy</span><p className="mt-3 font-semibold text-on-surface">{lang === "en" ? "No upcoming events yet" : "Aucun événement à venir pour le moment"}</p></div> : <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <EventCarousel events={upcomingEvents} dict={dict} />
          {secondaryEvent ? <Link href={"/evenement/" + secondaryEvent.id} className="reveal-card relative flex min-h-[320px] flex-col justify-between rounded-xl border border-outline-variant/10 bg-surface-container-low/30 p-6 transition hover:border-tertiary/30 sm:min-h-[400px] sm:p-8"><div><div className="ghost-border-bottom mb-6 flex size-12 items-center justify-center rounded-lg bg-surface-container-lowest"><span aria-hidden="true" className="material-symbols-outlined text-primary">groups</span></div><h4 className="mb-2 font-headline text-xl font-bold text-on-surface">{secondaryEvent.title}</h4><p className="font-body text-sm text-on-surface-variant whitespace-pre-line break-words line-clamp-5">{secondaryEvent.short_description || secondaryEvent.description}</p></div><div className="mt-8 flex items-center justify-between rounded-lg bg-surface-container-lowest px-4 py-3 text-sm text-on-surface-variant"><span>{secondaryEvent.date_is_tbd ? (lang === "en" ? "Coming soon" : "Prochainement") : secondaryEvent.date_start ? new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "fr-FR", { dateStyle: "medium", timeZone: "Europe/Paris" }).format(new Date(secondaryEvent.date_start)) : ""}</span><span aria-hidden="true" className="material-symbols-outlined text-lg">arrow_forward</span></div></Link> : <div className="flex min-h-[320px] flex-col justify-center rounded-xl border border-outline-variant/10 bg-surface-container-low/30 p-8 sm:min-h-[400px]"><span aria-hidden="true" className="material-symbols-outlined text-3xl text-tertiary">event_upcoming</span><h4 className="mt-4 font-headline text-xl font-bold text-on-surface">{lang === "en" ? "Keep an eye out" : "Restez à l’affût"}</h4><p className="mt-2 text-sm leading-6 text-on-surface-variant">{lang === "en" ? "More events will appear here as soon as they are announced." : "Les prochains rendez-vous seront affichés dès leur annonce."}</p></div>}
        </div>}
      </div>
    </section>
    <div className="relative z-10 bg-surface py-8 sm:py-12"><ShopAdBanner images={shopImages} eyebrow={dict.home.shop_promo_eyebrow} title={dict.home.shop_promo_title} description={dict.home.shop_promo_desc} action={dict.home.shop_promo_action} english={lang === "en"} /></div>
  </>;
}
