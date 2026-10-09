import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUserContext } from "@/utils/supabase/current-user";
import EventCarousel from "@/components/EventCarousel";
import NewsSection from "@/components/NewsSection";
import { formatParisDateTime } from "@/utils/paris-time";
import { getPublicMemberLastName } from "@/utils/member-display";
import type { getDictionary } from "@/locales/dictionaries";

type Dictionary = Awaited<ReturnType<typeof getDictionary>>;

export default async function HomeShowcase({ dict, lang }: { dict: Dictionary; lang: string }) {
  const supabase = await createClient();
  const dateLocale = lang === "en" ? "en-GB" : "fr-FR";
  const [{ data: eventsData }, { data: newsData }, { member }] = await Promise.all([
    supabase.from("events")
      .select("id, title, category, description, short_description, image_url, date_start, location")
      .eq("status", "upcoming")
      .gte("date_start", new Date().toISOString())
      .order("date_start", { ascending: true })
      .limit(5),
    supabase.from("news")
      .select("id, title, content, image_url, published_at, is_anonymous, author_id, members(first_name,last_name,hide_last_name,is_visible)")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(4),
    getCurrentUserContext(),
  ]);

  const isBoard = member?.category === "bureau_restreint" || ["president", "tresorier", "secretaire", "vp_general"].includes(member?.role || "");
  const isCOMMember = member?.member_assignments?.some(assignment => {
    const pole = Array.isArray(assignment.poles) ? assignment.poles[0] : assignment.poles;
    return typeof pole?.name === "string" && /(?:communication|\bcom\b)/i.test(pole.name);
  });
  const news = (newsData ?? []).map(item => {
    const author = Array.isArray(item.members) ? item.members[0] : item.members;
    return {
      id: item.id, title: item.title, content: item.content,
      image_url: item.image_url || undefined, published_at: item.published_at,
      is_anonymous: Boolean(item.is_anonymous),
      members: item.is_anonymous || !author ? undefined : {
        first_name: author.first_name || "",
        last_name: getPublicMemberLastName(author),
        hide_last_name: author.hide_last_name !== false,
      },
    };
  });

  const defaultEvents = [
    { id: "1", title: "The Midnight Masquerade", category: "Headline Event", description: "Our flagship event of the semester. Formal attire required. Identities optional.", short_description: null, date_start: new Date(new Date().setMonth(9, 31)).toISOString(), location: "Secret Location", image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuC1Csx9XytUFcnaj9-80c3AdoLyoCl09Hn3cYIXr5zFwE_ng0vT6M2wAFHhctqlYN1VAPzzczxDCRLK-arIqeAhrl7KQZ6EdMY7phY3BBI3qFbCTGAZRhquIcoobJIMnWPs2KNoKSOUs6X7BxtPSxx1EpQMG7AaQr_pfHjC8D2bVCSeCbhM9jyRB4QdORjjmDC2qaKxx_1Q98m9QKoQ_sAvjzIVWd62gbclKgX6iboqT2XNRdc4SilmWwrPDw79aU8fUgqS4olL4k6q" },
    { id: "2", title: "Alumni Mixer", category: "Mixer", description: "Connect with past members in an intimate, low-light setting. Drinks provided.", short_description: null, date_start: new Date(new Date().setMonth(10, 12)).toISOString(), location: "CERI" },
  ];
  const upcomingEvents = eventsData && eventsData.length > 0 ? eventsData : defaultEvents;
  const secondaryEvent = upcomingEvents[1] || upcomingEvents[0];
  const formatDate = (isoStr: string) => formatParisDateTime(isoStr, { month: "short", day: "numeric" }, dateLocale);
  const formatTime = (isoStr: string) => formatParisDateTime(isoStr, { hour: "2-digit", minute: "2-digit" }, dateLocale);

  return <>
    <NewsSection news={news} dict={dict} isAdmin={Boolean(isBoard || isCOMMember)} />
    <section className="relative z-10 bg-surface py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:mb-16 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div><h2 className="mb-2 text-sm font-label uppercase tracking-[0.1em] text-on-surface-variant">{dict.home.roster_title}</h2><h3 className="font-headline text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">{dict.home.discover_events}</h3></div>
          <Link href="/evenement" className="flex items-center gap-1 space-x-1 text-sm font-label font-medium text-tertiary transition-colors hover:text-white"><span>{dict.home.view_all_events}</span><span className="material-symbols-outlined text-sm">arrow_forward</span></Link>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <EventCarousel events={upcomingEvents} dict={dict} />
          <div className="reveal-card relative flex min-h-[320px] flex-col justify-between rounded-xl border border-outline-variant/10 bg-surface-container-low/30 p-6 sm:min-h-[400px] sm:p-8">
            <div><div className="ghost-border-bottom mb-6 flex size-12 items-center justify-center rounded-lg bg-surface-container-lowest"><span className="material-symbols-outlined text-primary">groups</span></div><h4 className="mb-2 font-headline text-xl font-bold text-on-surface">{secondaryEvent.title}</h4><p className="font-body text-sm text-on-surface-variant">{secondaryEvent.short_description || secondaryEvent.description}</p></div>
            <div className="mt-8 space-y-3"><div className="ghost-border-bottom flex items-center justify-between rounded-lg bg-surface-container-lowest px-4 py-3 text-sm text-on-surface-variant"><span>{formatDate(secondaryEvent.date_start)}</span><span>{formatTime(secondaryEvent.date_start)}</span></div><Link href={"/evenement/" + secondaryEvent.id} className="block w-full rounded-lg border border-outline-variant/30 py-3 text-center font-label text-sm text-on-surface transition-all hover:bg-tertiary hover:text-on-tertiary">{dict.events.reveal_details}</Link></div>
          </div>
        </div>
      </div>
    </section>
  </>;
}
