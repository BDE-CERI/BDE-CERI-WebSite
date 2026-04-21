import { getDictionary } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function MemberProfile({ params }: { params: Promise<{ id: string }> }) {
  const dict = await getDictionary();
  const supabase = await createClient();
  const { id } = await params;

  const getRoleIcon = (role: string) => {
    const r = role?.toLowerCase() || "";
    if (r.includes("président") || r.includes("president")) return "crown";
    if (r.includes("vice") || r.includes("vp")) return "verified_user";
    if (r.includes("trésorier") || r.includes("treasurer")) return "account_balance_wallet";
    if (r.includes("secrétaire") || r.includes("secretary")) return "edit_note";
    if (r.includes("chargé de mission")) return "badge";
    return null;
  };

  // Fetch Member data
  const { data: member } = await supabase
    .from("members")
    .select("*, member_assignments(*, poles(name))")
    .eq("id", id)
    .single();

  if (!member) {
    notFound();
  }

  // Fetch Historical Roles (Ancien Bureau)
  // We match by names as there is no direct foreign key for now
  const { data: history } = await supabase
    .from("ancien_bureau_members")
    .select(`
      *,
      ancien_bureau (
        academic_year,
        theme
      )
    `)
    .eq("first_name", member.first_name)
    .eq("last_name", member.last_name)
    .order("created_at", { ascending: false });

  const socialLinks = member.social_links || {};

  return (
    <div className="min-h-screen bg-surface">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left Column: Image & Basic Info */}
          <div className="lg:col-span-4 space-y-8">
            <div className="reveal-card p-2 rounded-3xl bg-surface-container-high shadow-2xl">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden relative group">
                <img 
                  src={member.photo_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=800"} 
                  alt={`${member.first_name} ${member.last_name}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest/80 via-transparent to-transparent"></div>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-2xl border border-outline-variant/10">
              <h3 className="text-sm font-bold uppercase tracking-widest text-tertiary mb-6">Contact & Social</h3>
              <div className="space-y-4">
                {member.email && (
                  <div className="flex items-center gap-3 text-on-surface-variant hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-tertiary text-lg">mail</span>
                    <a href={`mailto:${member.email}`} className="text-sm font-body">{member.email}</a>
                  </div>
                )}
                {member.instagram && (
                   <div className="flex items-center gap-3 text-on-surface-variant hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-tertiary text-lg">public</span>
                    <a href={member.instagram.startsWith('http') ? member.instagram : `https://instagram.com/${member.instagram.replace('@', '')}`} target="_blank" className="text-sm font-body">Instagram</a>
                  </div>
                )}
                {member.discord && (
                   <div className="flex items-center gap-3 text-on-surface-variant hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-tertiary text-lg">forum</span>
                    <span className="text-sm font-body">{member.discord}</span>
                  </div>
                )}
                {socialLinks.linkedin && (
                   <div className="flex items-center gap-3 text-on-surface-variant hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-tertiary text-lg">account_circle</span>
                    <a href={socialLinks.linkedin} target="_blank" className="text-sm font-body">LinkedIn</a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Bio, Roles, History */}
          <div className="lg:col-span-8 space-y-12">
            <div>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                  <h1 className="text-4xl md:text-6xl font-headline font-bold text-on-surface tracking-tight mb-2">
                    {member.first_name} {member.last_name}
                  </h1>
                  <p className="text-lg text-primary font-label font-bold uppercase tracking-widest flex items-center gap-2">
                    {getRoleIcon(member.role_label) && (
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {getRoleIcon(member.role_label)}
                      </span>
                    )}
                    {member.role_label}
                  </p>
                </div>
                <div className="px-4 py-2 bg-surface-container-highest rounded-full border border-outline-variant/15 text-xs font-bold text-on-surface-variant">
                  {member.study_level || "Étudiant au CERI"}
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <p className="text-xl text-on-surface-variant leading-relaxed font-body">
                  {member.bio || member.description || "Pas de description disponible pour ce membre."}
                </p>
              </div>
            </div>

            {/* Current Roles / Missions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-8 rounded-2xl border border-outline-variant/10">
                   <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                     <span className="material-symbols-outlined text-tertiary">verified_user</span>
                     Mandat Actuel
                   </h3>
                   <div className="space-y-6">
                     <div className="flex flex-col">
                         <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Rôle Principal</span>
                         <span className="text-sm font-bold text-primary">{member.role_label}</span>
                     </div>
                     
                     {member.member_assignments && member.member_assignments.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-outline-variant/10">
                           <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Autres Missions</span>
                           {member.member_assignments.map((a: any) => (
                              <div key={a.id} className="flex flex-col">
                                 <span className="text-xs font-bold text-on-surface">Pôle {a.poles?.name}</span>
                                 <span className="text-xs text-on-surface-variant">{a.role} {a.is_vp && "(VP)"}</span>
                              </div>
                           ))}
                        </div>
                     )}

                      {!member.member_assignments?.length && (
                        <div className="flex flex-col">
                            <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Responsabilités</span>
                            <span className="text-sm font-medium">{member.responsibilities || "Aucune responsabilité spécifique renseignée."}</span>
                        </div>
                      )}
                   </div>
                </div>

               <div className="glass-panel p-8 rounded-2xl border border-outline-variant/10">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary">history_edu</span>
                    Parcours Académique
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                    {member.academic_journey || `Actuellement en ${member.study_level || "cursus informatique"}, ce membre s'investit pour la cohésion et le dynamisme du CERI.`}
                  </p>
               </div>
            </div>

            {/* History Table / List */}
            {history && history.length > 0 && (
               <div>
                  <h3 className="text-2xl font-headline font-bold mb-8 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">history</span>
                    Historique au Bureau
                  </h3>
                  <div className="space-y-4">
                    {history.map((record: any) => (
                      <div key={record.id} className="flex items-center justify-between p-6 rounded-2xl border border-outline-variant/10 hover:bg-surface-container-high transition-colors">
                        <div className="flex flex-col">
                            <span className="text-xs text-primary font-bold">{record.ancien_bureau?.academic_year}</span>
                            <span className="text-lg font-bold text-on-surface">{record.role_label}</span>
                            <span className="text-xs text-on-surface-variant italic">Thème : {record.ancien_bureau?.theme || "N/A"}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Niveau à l'époque</span>
                            <p className="text-xs font-medium">{record.study_year || "N/A"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Nav */}
      <div className="max-w-7xl mx-auto px-6 py-12 border-t border-outline-variant/10">
        <Link href="/equipe" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-ter transition-colors group">
          <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
          Retour à l'équipe
        </Link>
      </div>
    </div>
  );
}
