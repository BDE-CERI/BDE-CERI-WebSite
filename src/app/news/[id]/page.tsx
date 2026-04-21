import { getDictionary } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function NewsDetail({ params }: { params: Promise<{ id: string }> }) {
  // const dict = await getDictionary(); // Currently unused on this page
  const supabase = await createClient();
  const { id } = await params;

  const { data: newsItem } = await supabase
    .from("news")
    .select("*")
    .eq("id", id)
    .single();

  if (!newsItem) {
    notFound();
  }

  const { data: author } = await supabase
    .from("members")
    .select("*")
    .eq("id", newsItem.author_id)
    .single();

  return (
    <div className="min-h-screen bg-surface">
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={newsItem.image_url || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1000"} 
            alt={newsItem.title}
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-24">
          <div className="inline-block px-4 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary mb-6">
            <span className="text-xs font-bold uppercase tracking-widest">Actualité</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-headline font-bold text-on-surface mb-6 tracking-tight">
             {newsItem.title}
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm text-on-surface-variant">
             <span className="flex items-center gap-1">
               <span className="material-symbols-outlined text-[16px]">schedule</span>
               {new Date(newsItem.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
             </span>
             {author && (
               <>
                 <span>•</span>
                 <span className="flex items-center gap-1">
                   <span className="material-symbols-outlined text-[16px]">person</span>
                   {author.first_name} {author.last_name}
                 </span>
               </>
             )}
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
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
