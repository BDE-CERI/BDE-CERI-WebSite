import { getDictionary } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

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
    <div className="min-h-screen bg-surface">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={pole.image_url || defaultImage} 
            alt={pole.name}
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-block px-4 py-1 rounded-full border mb-6" style={{ borderColor: `${pole.color}40`, backgroundColor: `${pole.color}10`, color: pole.color }}>
            <span className="text-xs font-bold uppercase tracking-widest">Pôle {pole.name}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-headline font-bold text-on-surface mb-6 tracking-tight">
            {pole.name}
          </h1>
          <p className="text-xl text-on-surface-variant font-body leading-relaxed max-w-2xl mx-auto">
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
              <h2 className="text-3xl font-headline font-bold mb-6">À propos du pôle</h2>
              <div className="text-on-surface-variant leading-loose space-y-6">
                {pole.full_content || (
                  <p>Le pôle {pole.name} joue un rôle crucial dans le fonctionnement du BDE CERI. Il est responsable de la coordination des projets liés à sa spécialité et veille à l'engagement des étudiants au sein du département informatique.</p>
                )}
              </div>
            </div>

            {/* Members Section */}
            <div>
              <h3 className="text-2xl font-headline font-bold mb-8">L'Équipe du Pôle</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {finalVp && (
                   <Link href={`/equipe/${finalVp.id}`} className="group">
                    <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-surface-container-high/40 border border-tertiary/20 group-hover:border-tertiary/50 transition-all">
                      <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-tertiary ring-4 ring-tertiary/10">
                        <img src={finalVp.photo_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"} alt="VP" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-sm font-bold text-on-surface">{finalVp.first_name} {finalVp.last_name}</span>
                      <span className="text-[10px] text-tertiary uppercase font-bold tracking-widest mt-1">Vice-Président</span>
                    </div>
                  </Link>
                )}
                {finalMembers?.map((member) => (
                  <Link key={member.id} href={`/equipe/${member.id}`} className="group">
                    <div className="flex flex-col items-center text-center p-4 rounded-2xl hover:bg-surface-container-high/40 transition-all border border-transparent hover:border-outline-variant/20">
                      <div className="w-16 h-16 rounded-full overflow-hidden mb-4 grayscale group-hover:grayscale-0 transition-all">
                        <img src={member.photo_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"} alt="Member" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-medium text-on-surface-variant group-hover:text-on-surface transition-colors">{member.first_name} {member.last_name}</span>
                      {member.display_role && (
                        <span className="text-[9px] text-on-surface-variant/60 uppercase font-bold mt-1">{member.display_role}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
             <div className="glass-panel p-8 rounded-2xl ghost-border">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">info</span>
                  Détails Rapides
                </h3>
                <ul className="space-y-4">
                  <li className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Statut</span>
                    <span className="text-success font-bold">Actif</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Année Académique</span>
                    <span className="text-on-surface">2024-2025</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Membres</span>
                    <span className="text-on-surface">{finalMembers.length + (finalVp ? 1 : 0)} personnes</span>
                  </li>
                </ul>
                <button className="w-full mt-8 py-3 bg-tertiary text-on-tertiary rounded-xl font-bold hover:scale-[1.02] transition-transform">
                  Nous Contacter
                </button>
             </div>
          </div>
        </div>
      </section>

      {/* Navigation Return */}
      <div className="max-w-7xl mx-auto px-6 py-12 border-t border-outline-variant/10">
        <Link href="/poles" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-ter transition-colors group">
          <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
          Retour aux pôles
        </Link>
      </div>
    </div>
  );
}
