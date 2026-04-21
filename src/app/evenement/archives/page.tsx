import { getDictionary } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function Archives() {
  const dict = await getDictionary();
  const supabase = await createClient();

  // Fetch past events
  const { data: archives } = await supabase
    .from("events")
    .select("*")
    .or("status.eq.past,date_start.lt.now()")
    .order("date_start", { ascending: false });

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString("fr-FR", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  return (
    <div className="flex-grow pt-12 pb-24 px-4 sm:px-8 max-w-7xl mx-auto w-full">
      <header className="mb-16">
        <Link href="/evenement" className="inline-flex items-center gap-2 text-tertiary mb-6 hover:gap-3 transition-all">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Retour aux événements à venir
        </Link>
        <h1 className="text-4xl md:text-6xl font-headline font-bold text-on-surface">Archives <span className="text-on-surface-variant">du BDE</span></h1>
        <p className="text-on-surface-variant mt-4 max-w-2xl">
          Revivez les moments forts qui ont marqué la vie étudiante du CERI. Une collection de souvenirs, de rires et de projets accomplis.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {archives && archives.length > 0 ? (
          archives.map((event) => (
            <Link key={event.id} href={`/evenement/${event.id}`} className="group">
              <article className="glass-panel rounded-2xl overflow-hidden border border-outline-variant/10 hover:border-tertiary/30 transition-all flex flex-col h-full">
                <div className="h-48 relative overflow-hidden">
                  <img 
                    src={event.image_url || "https://images.unsplash.com/photo-1511795409834-432f7b1728bb?auto=format&fit=crop&q=80&w=800"} 
                    alt={event.title}
                    className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/40 backdrop-blur-md px-2 py-1 rounded">
                      {formatDate(event.date_start)}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-headline font-bold text-on-surface mb-2">{event.title}</h3>
                  <p className="text-sm text-on-surface-variant line-clamp-2 italic">
                    "{event.description}"
                  </p>
                </div>
              </article>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-24 text-center">
            <span className="material-symbols-outlined text-6xl text-outline mb-4">inventory_2</span>
            <p className="text-on-surface-variant">Aucune archive disponible pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
