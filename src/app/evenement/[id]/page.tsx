import { getDictionary, getLang } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import type { Metadata } from "next";
import { JsonLd } from "@/components/StructuredData";
import { createSeoMetadata } from "@/utils/seo";

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

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dict = await getDictionary();
  const lang = await getLang();
  const dateLocale = lang === "en" ? "en-GB" : "fr-FR";
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (!event) notFound();

  const eventStructuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.date_start,
    image: event.image_url ? [event.image_url] : undefined,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: new Date(event.date_start).getTime() < Date.now()
      ? "https://schema.org/EventCompleted"
      : "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: event.location || "CERI, Avignon",
      address: { "@type": "PostalAddress", addressLocality: "Avignon", addressCountry: "FR" },
    },
    organizer: { "@type": "Organization", name: "BDE CERI Avignon", url: "https://bdeceri.fr" },
  };

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString(dateLocale, {
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    });
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

        <div className="max-w-7xl mx-auto px-8 w-full pb-12">
          <Link href="/evenement" className="text-secondary flex items-center gap-2 mb-8 hover:gap-3 transition-all font-bold text-sm uppercase tracking-widest">
            <span className="material-symbols-outlined">arrow_back</span>
            {dict.events.return_to_events}
          </Link>
          
          <div className="space-y-4">
            <span className="bg-tertiary/20 text-tertiary px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase backdrop-blur-md border border-tertiary/30">
              {event.category || dict.events.event_fallback}
            </span>
            <h1 className="headline-display text-5xl md:text-7xl font-bold text-on-surface tracking-tighter">
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
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-16 mt-16">
        <div className="lg:col-span-8 space-y-12 text-on-surface/90">
          <section className="prose prose-invert max-w-none">
            <p className="text-xl font-body leading-relaxed mb-8 opacity-80 italic">
              {event.description}
            </p>
            <div className="whitespace-pre-wrap font-body leading-loose text-lg">
              {event.full_content || dict.events.details_empty}
            </div>
          </section>

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
          <div className="glass-panel p-8 rounded-3xl ghost-border overflow-hidden relative">
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
                  <p className="font-body text-sm">{dict.common.starts} : {new Date(event.date_start).toLocaleTimeString(dateLocale, {hour: '2-digit', minute:'2-digit'})}</p>
                  {event.date_end && <p className="font-body text-sm">{dict.common.ends} : {new Date(event.date_end).toLocaleTimeString(dateLocale, {hour: '2-digit', minute:'2-digit'})}</p>}
                </div>
              </div>
            </div>

            <button className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl mt-10 hover:shadow-lg hover:shadow-primary/20 transition-all">
              {dict.events.register_button}
            </button>
            <p className="text-[10px] text-center mt-4 opacity-40 uppercase tracking-widest">{dict.common.sign_in_to_register}</p>
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
