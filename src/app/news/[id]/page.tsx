import { getDictionary, getLang } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { JsonLd } from "@/components/StructuredData";
import { createSeoMetadata } from "@/utils/seo";
import { formatParisDateTime } from "@/utils/paris-time";
import { getPublicMemberName } from "@/utils/member-display";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: newsItem } = await supabase.from("news").select("title, content, image_url, is_published").eq("id", id).single();
  
  if (!newsItem || !newsItem.is_published) return { title: "Actualité introuvable", robots: { index: false, follow: false } };
  
  const content = newsItem.content?.replace(/\s+/g, " ").trim() || "";
  const desc = content.length > 160 ? `${content.slice(0, 157).trimEnd()}…` : content || "Découvrez les actualités du BDE CERI à Avignon.";
  
  return createSeoMetadata({
    path: `/news/${id}`,
    title: newsItem.title,
    description: desc,
    image: newsItem.image_url,
    type: "article",
  });
}

export default async function NewsDetail({ params }: { params: Promise<{ id: string }> }) {
  const dict = await getDictionary();
  const lang = await getLang();
  const dateLocale = lang === "en" ? "en-GB" : "fr-FR";
  const supabase = await createClient();
  const { id } = await params;

  const { data: newsItem } = await supabase
    .from("news")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (!newsItem) {
    notFound();
  }

  const { data: author } = !newsItem.is_anonymous && newsItem.author_id
    ? await supabase.from("members").select("*").eq("id", newsItem.author_id).maybeSingle()
    : { data: null };
  const authorLabel = newsItem.is_anonymous ? dict.news.author_hidden
    : author ? getPublicMemberName(author) : "BDE CERI";

  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: newsItem.title,
    description: newsItem.content?.replace(/\s+/g, " ").trim().slice(0, 160),
    datePublished: newsItem.published_at,
    image: newsItem.image_url ? [newsItem.image_url] : undefined,
    author: author
      ? { "@type": "Person", name: getPublicMemberName(author) }
      : { "@type": "Organization", name: "BDE CERI Avignon" },
    publisher: { "@type": "Organization", name: "BDE CERI Avignon", url: "https://bdeceri.fr" },
    mainEntityOfPage: `https://bdeceri.fr/news/${id}`,
  };

  return (
    <div className="min-h-screen bg-surface">
      <JsonLd data={articleStructuredData} />
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src={newsItem.image_url || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1000"} 
            alt={newsItem.title}
            fill
            priority
            className="object-cover opacity-30"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent z-10"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-24">
          <div className="inline-block px-4 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary mb-6">
            <span className="text-xs font-bold uppercase tracking-widest">{dict.common.article}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-headline font-bold text-on-surface mb-6 tracking-tight">
             {newsItem.title}
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm text-on-surface-variant">
             <span className="flex items-center gap-1">
               <span className="material-symbols-outlined text-[16px]">schedule</span>
               {formatParisDateTime(newsItem.published_at, { day: 'numeric', month: 'long', year: 'numeric' }, dateLocale)}
             </span>
             <span aria-hidden="true">•</span>
             <span className="flex items-center gap-1">
               <span aria-hidden="true" className="material-symbols-outlined text-[16px]">{newsItem.is_anonymous ? "visibility_off" : "person"}</span>
               {authorLabel}
             </span>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="glass-panel p-8 md:p-12 rounded-3xl border border-outline-variant/10 text-on-surface-variant leading-relaxed text-lg whitespace-pre-wrap font-body">
           {newsItem.content}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12 border-t border-outline-variant/10 mb-12">
        <Link href="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group">
          <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
          {dict.header.home}
        </Link>
      </div>
    </div>
  );
}
