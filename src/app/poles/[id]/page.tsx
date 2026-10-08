import { getDictionary } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import SharkWallpaper from "@/components/SharkWallpaper";
import type { Metadata } from "next";
import { createSeoMetadata } from "@/utils/seo";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: pole } = await supabase.from("poles").select("name, description, image_url").eq("id", id).single();

  if (!pole) return { title: "Pôle introuvable", robots: { index: false, follow: false } };

  const title = `${pole.name} | Équipe du BDE`;
  const description = (pole.description || `Découvre l’équipe ${pole.name} et ses projets au BDE CERI à Avignon.`).replace(/\s+/g, " ").slice(0, 160);

  return createSeoMetadata({
    path: `/poles/${id}`,
    title,
    description,
    image: pole.image_url,
  });
}

export default async function PoleDetail({ params }: { params: Promise<{ id: string }> }) {
  const dict = await getDictionary();
  const supabase = await createClient();
  const { id } = await params;

  // Fetch Pole data
  const { data: pole } = await supabase
    .from("poles")
    .select("*")
    .eq("id", id)
    .single();

  if (!pole) {
    notFound();
  }

  const isJeuxPole = pole.name.toLowerCase().includes("jeux") || 
                     pole.name.toLowerCase().includes("gaming") || 
                     pole.name.toLowerCase().includes("esport");

  // 2. Fetch Primary VP and Members (direct pole_id)
  const { data: primaryVp } = await supabase
    .from("members")
    .select("*")
    .eq("pole_id", id)
    .eq("role", "vice_president_pole")
    .single();

  const { data: primaryMembers } = await supabase
    .from("members")
    .select("*")
    .eq("pole_id", id)
    .neq("role", "vice_president_pole")
    .order("last_name", { ascending: true });

  // 3. Fetch Secondary VP and Members (assignments)
  const { data: assignments } = await supabase
    .from("member_assignments")
    .select("role, is_vp, members(*)")
    .eq("pole_id", id);

  // 4. Merge and Deduplicate
  let finalVp = primaryVp || null;
  const memberMap = new Map();

  // Add primary members
  primaryMembers?.forEach(m => memberMap.set(m.id, { ...m, display_role: m.role_label }));

  // Add assigned members/vps
  assignments?.forEach(a => {
    const m = a.members as any;
    if (!m) return;

    if (a.is_vp) {
      if (!finalVp) finalVp = m;
    } else {
      if (!memberMap.has(m.id)) {
        memberMap.set(m.id, { ...m, display_role: a.role });
      }
    }
  });

  const finalMembers = Array.from(memberMap.values()).sort((a, b) => a.last_name.localeCompare(b.last_name));

  const defaultImage = "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1000";

  return (
    <div className="min-h-screen bg-surface relative overflow-hidden">
      <SharkWallpaper opacity={0.3} />
      
      {/* Dynamic glow behind the hero */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] blur-[150px] opacity-20 pointer-events-none rounded-full"
        style={{ backgroundColor: pole.color || 'var(--color-primary)' }}
      ></div>

      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden mt-16 md:mt-20 mx-4 md:mx-12 rounded-[3rem] shadow-2xl border border-outline-variant/10">
        <div className="absolute inset-0 z-0 bg-surface-container-highest">
          <Image 
            src={pole.image_url || defaultImage} 
            alt={pole.name}
            fill
            priority
            className="object-cover opacity-40 mix-blend-overlay"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent"></div>
          <div 
            className="absolute inset-0 opacity-30 mix-blend-color" 
            style={{ backgroundColor: pole.color || 'transparent' }}
          ></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div 
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full border mb-8 backdrop-blur-md shadow-lg" 
            style={{ borderColor: `${pole.color}40`, backgroundColor: `${pole.color}15`, color: pole.color }}
          >
            <span className="material-symbols-outlined text-sm">hub</span>
            <span className="text-xs font-bold uppercase tracking-[0.2em]">{dict.common.pole} {pole.name}</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-headline font-bold text-on-surface mb-6 tracking-tighter drop-shadow-2xl">
            {pole.name}
          </h1>
          <p className="text-xl md:text-2xl text-on-surface-variant font-body leading-relaxed max-w-2xl mx-auto drop-shadow-md">
            {pole.description}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            <div className="prose prose-invert max-w-none">
              <h2 className="text-3xl font-headline font-bold mb-6">{dict.poles.about_title}</h2>
              <div className="text-on-surface-variant leading-loose space-y-6">
                {pole.full_content || (
                  <p>{dict.poles.about_fallback.replace("{name}", pole.name)}</p>
                )}
              </div>
            </div>

            {/* Dynamic Jeux / eSport section */}
            {isJeuxPole && (
              <div className="p-8 rounded-3xl border border-tertiary/20 bg-tertiary/5 relative overflow-hidden shadow-xl space-y-6">
                <div className="absolute top-0 right-0 w-48 h-48 bg-tertiary/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-tertiary font-bold tracking-[0.2em] uppercase bg-tertiary/15 px-3 py-1 rounded-full">{dict.poles.section_esport}</span>
                    <h3 className="text-2xl font-headline font-bold text-on-surface mt-2 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping"></span>
                      🔴 {dict.poles.live_twitch}
                    </h3>
                  </div>
                  <Link href="/esport">
                    <button className="px-5 py-2.5 bg-tertiary text-on-tertiary font-bold rounded-xl text-xs flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(123,208,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                       {dict.poles.open_esport}
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    </button>
                  </Link>
                </div>
                
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {dict.poles.esport_description}
                </p>

                {/* Mini Player */}
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-outline-variant/10 shadow-lg">
                  <iframe
                    src="https://player.twitch.tv/?channel=bdeceri&parent=localhost&parent=127.0.0.1&parent=bdeceri.fr"
                    height="100%"
                    width="100%"
                    allowFullScreen
                    className="w-full h-full border-none"
                  ></iframe>
                </div>
              </div>
            )}

            {/* Members Section */}
            <div className="pt-8">
              <h3 className="text-3xl font-headline font-bold mb-10 flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary">groups</span>
                {dict.poles.team_heading}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {finalVp && (
                   <Link href={`/equipe/${finalVp.id}`} className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-tertiary/40 to-primary/40 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative flex flex-col items-center text-center p-6 rounded-3xl bg-surface-container-highest/80 backdrop-blur-md border border-tertiary/20 group-hover:border-tertiary/60 transition-all shadow-xl">
                      <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-tertiary ring-4 ring-tertiary/10 relative shadow-lg group-hover:scale-105 transition-transform duration-500">
                        <Image src={finalVp.photo_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"} alt="VP" fill className="object-cover" sizes="96px" />
                      </div>
                      <span className="text-sm font-bold text-on-surface group-hover:text-tertiary transition-colors">{finalVp.first_name} {finalVp.last_name}</span>
                       <span className="text-[10px] text-tertiary uppercase font-bold tracking-[0.2em] mt-2 bg-tertiary/10 px-3 py-1 rounded-full">{dict.poles.vice_president}</span>
                    </div>
                  </Link>
                )}
                {finalMembers?.map((member) => (
                  <Link key={member.id} href={`/equipe/${member.id}`} className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative flex flex-col items-center text-center p-6 rounded-3xl bg-surface-container-low/50 backdrop-blur-sm hover:bg-surface-container-high transition-all border border-outline-variant/10 hover:border-outline-variant/30">
                      <div className="w-20 h-20 rounded-full overflow-hidden mb-4 grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 relative ring-2 ring-transparent group-hover:ring-white/20">
                        <Image src={member.photo_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"} alt="Member" fill className="object-cover" sizes="80px" />
                      </div>
                      <span className="text-xs font-bold text-on-surface-variant group-hover:text-on-surface transition-colors">{member.first_name} {member.last_name}</span>
                      {member.display_role && (
                        <span className="text-[9px] text-on-surface-variant/60 uppercase font-bold tracking-wider mt-2">{member.display_role}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8 relative z-10">
             <div 
               className="glass-panel p-8 rounded-3xl border shadow-2xl relative overflow-hidden"
               style={{ borderColor: `${pole.color}30` }}
             >
                <div 
                  className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] -z-10 translate-x-1/2 -translate-y-1/2"
                  style={{ backgroundColor: `${pole.color}20` }}
                ></div>
                
                <h3 className="text-xl font-headline font-bold mb-8 flex items-center gap-3">
                  <span className="material-symbols-outlined" style={{ color: pole.color || 'var(--color-tertiary)' }}>info</span>
                   {dict.poles.quick_details}
                </h3>
                <ul className="space-y-6">
                  <li className="flex flex-col gap-1">
                     <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">{dict.common.pole_status}</span>
                    <span className="text-success font-bold text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                       {dict.poles.active}
                    </span>
                  </li>
                  <li className="flex flex-col gap-1">
                     <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">{dict.common.academic_year}</span>
                    <span className="text-on-surface text-sm font-bold">2024-2025</span>
                  </li>
                  <li className="flex flex-col gap-1">
                     <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">{dict.common.members}</span>
                    <span className="text-on-surface text-sm font-bold flex items-center gap-2">
                       <span className="material-symbols-outlined text-sm text-on-surface-variant">group</span>
                        {dict.common.member_count.replace("{count}", String(finalMembers.length + (finalVp ? 1 : 0)))}
                    </span>
                  </li>
                </ul>
                <button 
                  className="w-full mt-10 py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: pole.color || 'var(--color-tertiary)', color: '#000' }}
                >
                  <span className="material-symbols-outlined text-sm">mail</span>
                   {dict.poles.contact_pole}
                </button>
             </div>
          </div>
        </div>
      </section>

      {/* Navigation Return */}
      <div className="max-w-7xl mx-auto px-6 py-12 border-t border-outline-variant/10">
        <Link href="/poles" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-ter transition-colors group">
          <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
          {dict.poles.return_to_poles}
        </Link>
      </div>
    </div>
  );
}
