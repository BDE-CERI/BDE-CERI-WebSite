import { getDictionary, getLang } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import type { Metadata } from "next";
import { JsonLd } from "@/components/StructuredData";
import { createSeoMetadata } from "@/utils/seo";
import { formatParisDateTime } from "@/utils/paris-time";
import { getEventRegistrationStatus } from "@/utils/event-registrations";
import EventRegistration from "../EventRegistration";
import RichTextContent from "@/components/RichTextContent";
import { formatEventPrice, normalizeHelloAssoCheckoutUrl } from "@/utils/event-payment";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("title, description, image_url").eq("id", id).single();
  
  if (!event) return { title: "Événement introuvable", robots: { index: false, follow: false } };
  
  return createSeoMetadata({
    path: `/evenement/${id}`,
    title: event.title,
    description: event.description || "Détails de l'événement BDE CERI.",
    image: event.image_url,
  });
}

async function readEventDetail(id: string) {
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (!event) return null;
  const eventStatus = !event.date_is_tbd && (event.status === "past" || (event.date_start && new Date(event.date_start).getTime() < Date.now()))
    ? "https://schema.org/EventCompleted"
    : "https://schema.org/EventScheduled";
  return { event, eventStatus };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dict = await getDictionary();
  const lang = await getLang();
  const dateLocale = lang === "en" ? "en-GB" : "fr-FR";
  const eventDetail = await readEventDetail(id);
  if (!eventDetail) notFound();
  const { event, eventStatus } = eventDetail;
  const supabase = await createClient();
  const [registration, { data: { user } }] = await Promise.all([
    event.date_is_tbd ? Promise.resolve(null) : getEventRegistrationStatus(id),
    supabase.auth.getUser(),
  ]);
  const detailedContent = typeof event.full_content === "string" ? event.full_content.trim() : "";

  const eventPrice = event.registration_is_paid === true && Number.isSafeInteger(event.registration_price_cents) && event.registration_price_cents > 0 ? event.registration_price_cents as number : null;
  const paymentUrl = normalizeHelloAssoCheckoutUrl(event.helloasso_checkout_url);
  const eventStructuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.date_start || undefined,
    offers: eventPrice !== null && paymentUrl ? {
      "@type": "Offer",
      price: (eventPrice / 100).toFixed(2),
      priceCurrency: "EUR",
      url: paymentUrl,
    } : undefined,
    image: event.image_url ? [event.image_url] : undefined,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus,
    location: {
      "@type": "Place",
      name: event.location || "CERI, Avignon",
      address: { "@type": "PostalAddress", addressLocality: "Avignon", addressCountry: "FR" },
    },
    organizer: { "@type": "Organization", name: "BDE CERI Avignon", url: "https://bdeceri.fr" },
  };

  const formatDate = (isoStr: string | null) => {
    if (event.date_is_tbd || !isoStr) return dict.events.coming_soon;
    return formatParisDateTime(isoStr, {
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit',
      timeZoneName: 'short'
    }, dateLocale);
  };

  return (
    <div className="flex-grow pb-24">
      <JsonLd data={eventStructuredData} />
      {/* Hero Header */}
      <section className="relative h-[60vh] min-h-[500px] flex items-end">
        <div className="absolute inset-0 -z-10">
          {event.image_url ? (
            <Image 
              src={event.image_url} 
              alt={event.title} 
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <div className="w-full h-full bg-surface-container-highest" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full pb-12">
          <Link href="/evenement" className="text-secondary flex items-center gap-2 mb-8 hover:gap-3 transition-all font-bold text-sm uppercase tracking-widest">
            <span className="material-symbols-outlined">arrow_back</span>
            {dict.events.return_to_events}
          </Link>
          
          <div className="space-y-4">
            <span className="bg-tertiary/20 text-tertiary px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase backdrop-blur-md border border-tertiary/30">
              {event.category || dict.events.event_fallback}
            </span>
            <h1 className="headline-display break-words text-4xl sm:text-5xl md:text-7xl font-bold text-on-surface tracking-tighter">
              {event.title}
            </h1>
            <div className="flex flex-wrap gap-6 text-on-surface-variant font-label">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">calendar_today</span>
                {formatDate(event.date_start)}
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">location_on</span>
                {event.location}
              </div>
              {eventPrice !== null && <div className="flex items-center gap-2 font-semibold text-tertiary"><span aria-hidden="true" className="material-symbols-outlined">confirmation_number</span>{formatEventPrice(eventPrice, lang === "en")} {lang === "en" ? "per person" : "par personne"}</div>}
              {event.max_capacity && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">groups</span>
                  {event.max_capacity} {dict.events.max_places}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-16 mt-16">
        <div className="lg:col-span-8 space-y-12 text-on-surface/90">
          <section className="prose prose-invert max-w-none">
            <p className="text-xl font-body leading-relaxed opacity-80 italic">
              {event.description}
            </p>
          </section>
          {detailedContent && (
            <section aria-label={lang === "en" ? "Additional event details" : "Détails supplémentaires de l’événement"} className="prose prose-invert max-w-none">
              <RichTextContent content={detailedContent} className="font-body leading-loose text-lg" />
            </section>
          )}

          {/* Gallery placeholder or real gallery */}
          {event.gallery_urls && event.gallery_urls.length > 0 && (
            <section>
              <h2 className="headline-display text-3xl font-bold mb-8 flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary">collections</span>
                {dict.events.gallery}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {event.gallery_urls.map((url: string, i: number) => (
                  <div key={i} className="aspect-video rounded-2xl overflow-hidden ghost-border group relative">
                    <Image src={url} alt={`Gallery image ${i + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 50vw" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar / Quick Access */}
        <aside className="lg:col-span-4 space-y-8">
          <div className="glass-panel p-5 sm:p-8 rounded-3xl ghost-border overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
            <h3 className="font-headline text-2xl font-bold mb-6">{dict.common.information}</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary">pin_drop</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{dict.common.exact_location}</p>
                  <p className="font-body text-sm">{event.precise_location || event.location}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary">schedule</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{dict.common.schedule}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">{lang === "en" ? "Paris time" : "Heure de Paris"}</p>
                  <p className="font-body text-sm">{dict.common.starts} : {event.date_is_tbd || !event.date_start ? dict.events.coming_soon : formatParisDateTime(event.date_start, { hour: '2-digit', minute: '2-digit' }, dateLocale)}</p>
                  {!event.date_is_tbd && event.date_end && <p className="font-body text-sm">{dict.common.ends} : {formatParisDateTime(event.date_end, { hour: '2-digit', minute: '2-digit' }, dateLocale)}</p>}
                </div>
              </div>
            </div>

            {registration && !event.date_is_tbd && event.registration_enabled !== false
              ? <EventRegistration
                  key={id + ":" + JSON.stringify(registration.status) + ":" + !!user}
                  eventId={id}
                  initialStatus={registration.status}
                  signedIn={!!user}
                  english={lang === "en"}
                />
              : registration?.status?.registered
                ? <EventRegistration key={id + ":existing:" + !!user} eventId={id} initialStatus={registration.status} signedIn={!!user} english={lang === "en"} />
                : <p className="rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm leading-6 text-on-surface-variant">{event.date_is_tbd ? lang === "en" ? "The date will be announced soon. Registration is not open yet." : "La date sera annoncée prochainement. Les inscriptions ne sont pas encore ouvertes." : lang === "en" ? "Informational event — registration is not required." : "Événement informatif — aucune inscription n’est requise."}</p>}
          </div>

          <div className="p-8 border border-outline-variant/20 rounded-3xl bg-surface-container-lowest/30 backdrop-blur-sm">
            <h4 className="font-headline font-bold mb-4 text-sm">{dict.common.share_event}</h4>
            <div className="flex gap-3">
              {['facebook', 'X', 'link'].map((icon) => (
                <button key={icon} className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-sm">{icon === 'link' ? 'link' : 'share'}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
