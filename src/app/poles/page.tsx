import { getDictionary } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import SharkWallpaper from "@/components/SharkWallpaper";

export default async function Poles() {
  const dict = await getDictionary();
  const supabase = await createClient();

  const { data: polesData } = await supabase
    .from("poles")
    .select("*")
    .order("order_index", { ascending: true });

  // Fetch all VPs to match with poles
  const { data: primaryVps } = await supabase
    .from("members")
    .select("id, first_name, last_name, photo_url, pole_id")
    .eq("role", "vice_president_pole");

  const { data: secondaryVps } = await supabase
    .from("member_assignments")
    .select("role, is_vp, pole_id, members(id, first_name, last_name, photo_url)")
    .eq("is_vp", true);

  const defaultPoles = [
    {
      id: "1",
      name: "Événementiel",
      description: "Créateurs d'expériences mémorables et de soirées légendaires.",
      color: "#FF5252",
    },
    {
      id: "2",
      name: "Communication",
      description: "Les magiciens du visuel et des réseaux sociaux.",
      color: "#448AFF",
    }
  ];

  const polesList = polesData && polesData.length > 0 ? polesData : defaultPoles;

  return (
    <div className="relative overflow-hidden w-full bg-surface">
      <SharkWallpaper />
      
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-24 text-center">
        <div className="inline-block px-3 py-1 mb-6 rounded-full border border-tertiary/20 bg-tertiary/5 text-tertiary text-[10px] font-bold uppercase tracking-[0.2em]">
          {dict.poles.structure}
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-on-surface font-headline">
          L'Architecture de notre <span className="text-tertiary">BDE</span>
        </h1>
        <p className="max-w-2xl mx-auto text-on-surface-variant text-lg leading-relaxed font-body">
          Cinq piliers fondamentaux travaillant main dans la main pour propulser la vie étudiante du CERI vers de nouveaux sommets.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {polesList.map((pole) => {
            // Check direct member VP
            let vp = primaryVps?.find(v => v.pole_id === pole.id);
            
            // If not found, check assignments
            if (!vp) {
              const secondary = secondaryVps?.find(s => s.pole_id === pole.id);
              if (secondary && secondary.members) {
                 vp = {
                   id: (secondary.members as any).id,
                   first_name: (secondary.members as any).first_name,
                   last_name: (secondary.members as any).last_name,
                   photo_url: (secondary.members as any).photo_url,
                   pole_id: pole.id
                 };
              }
            }
            return (
              <div key={pole.id} className="reveal-card p-1 rounded-2xl bg-surface-container-high/40 hover:bg-surface-container-high transition-all duration-500 group">
                <div className="p-8 rounded-2xl h-full flex flex-col relative overflow-hidden">
                  {/* LED Effect Glow */}
                  <div 
                    className="absolute -top-12 -right-12 w-32 h-32 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-700" 
                    style={{ backgroundColor: pole.color || '#7BD0FF' }}
                  ></div>
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-outline-variant/15 bg-surface-container-low" style={{ boxShadow: `0 0 15px ${pole.color}20` }}>
                         <span className="material-symbols-outlined" style={{ color: pole.color || '#7BD0FF' }}>
                            {pole.name === 'Événementiel' ? 'star' : pole.name === 'Communication' ? 'campaign' : 'groups'}
                         </span>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-4 text-on-surface font-headline">{pole.name}</h3>
                    <p className="text-on-surface-variant mb-auto text-sm leading-relaxed font-body italic opacity-80 group-hover:opacity-100 transition-opacity">
                      "{pole.description}"
                    </p>
                    
                    <div className="mt-10 pt-6 border-t border-outline-variant/10 flex items-center justify-between">
                      {vp ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-tertiary/30 ring-2 ring-tertiary/5">
                                <img src={vp.photo_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2"} alt={vp.first_name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Vice-Président</span>
                                <span className="text-xs font-medium text-on-surface">{vp.first_name} {vp.last_name}</span>
                            </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-outline text-xs">?</div>
                            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">VP non assigné</span>
                        </div>
                      )}
                      
                      <Link href={`/poles/${pole.id}`}>
                        <button className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface hover:bg-tertiary hover:text-on-tertiary transition-all hover:scale-110 shadow-lg">
                          <span className="material-symbols-outlined text-sm">north_east</span>
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 mt-32 mb-20">
        <div className="relative overflow-hidden rounded-3xl bg-surface-container-high border border-outline-variant/20 p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 shadow-2xl">
          <div className="relative z-10 w-full md:w-1/2">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight font-headline">Rejoignez l'Élite</h2>
            <p className="text-on-surface-variant mb-8 text-lg font-body max-w-md italic">
              "L'excellence n'est pas un acte, mais une habitude de fer au sein de nos pôles."
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="https://forms.gle/placeholder" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-tertiary text-on-tertiary font-bold rounded-xl hover:shadow-[0_0_20px_rgba(123,208,255,0.4)] transition-all font-label">
                Soumettre ma candidature
              </a>
            </div>
          </div>
          <div className="w-full md:w-1/2 relative aspect-video">
            <div className="absolute inset-0 bg-tertiary/10 rounded-2xl animate-pulse"></div>
            <img
              alt="Collaboration"
              className="w-full h-full object-cover rounded-2xl opacity-40 mix-blend-luminosity border border-tertiary/20"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOt7bBqZtSFJ43qj63UphQTW8OUYNqopsBkpG9Vws5AazbobXkjZwjRwol5oVHwhe38cRGdXzJAgCJnTqcXHDqb7ltYt_QoVfJsr0NIdutXdgVX-NkfMo3R_NR20x3bONCMGHzuyWgnqFWYi2UzZ34HjOHQssObwkvZPDzqYrYOltJyaGtrHvS1_Y1dRtubqXa6FMPzZoHQMvpeDJdfHh0LoJU8Pr4vRDoRDwxXbBCv92rtWZ62f6-IHljNPAL6OYGaxGZJyVfERlH"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
