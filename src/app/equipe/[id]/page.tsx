import { getDictionary } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { createSeoMetadata } from "@/utils/seo";
import { getPublicMemberName } from "@/utils/member-display";
import ProfileSocialLinks from "@/components/ProfileSocialLinks";
import MemberAwards, { MembershipStatus, type MemberAward } from "@/components/MemberHonors";

type PoleRelation = { name: string | null };
type AssignmentRow = {
  id: string;
  role: string | null;
  role_label?: string | null;
  is_vp: boolean | null;
  created_at?: string | null;
  poles: PoleRelation | PoleRelation[] | null;
};

type MemberProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  hide_last_name?: boolean | null;
  membership_paid?: boolean | null;
  is_visible: boolean | null;
  role_label: string | null;
  role_description?: string | null;
  photo_url?: string | null;
  bio?: string | null;
  description?: string | null;
  email?: string | null;
  instagram?: string | null;
  discord?: string | null;
  social_links?: { linkedin?: string | null } | null;
  study_level?: string | null;
  responsibilities?: string | null;
  academic_journey?: string | null;
  member_assignments?: AssignmentRow | AssignmentRow[] | null;
};

type BoardRelation = { academic_year: string | null; theme: string | null };
type HistoryRow = {
  id: string;
  role_label: string | null;
  study_year?: string | null;
  ancien_bureau: BoardRelation | BoardRelation[] | null;
};

function normalizeRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] || null : value || null;
}

function normalizeList<T>(value: T | T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: member } = await supabase.from("members").select("*").eq("id", id).eq("is_visible", true).returns<MemberProfileRow[]>().single();
  
  if (!member || !member.is_visible) return { title: "Membre introuvable", robots: { index: false, follow: false } };
  
  const fullName = getPublicMemberName(member);
  const title = `${fullName} | ${member.role_label}`;
  const desc = (member.bio || member.role_description || `Découvrez le profil de ${fullName}, ${member.role_label} au BDE CERI.`).replace(/\s+/g, " ").slice(0, 160);
  
  return createSeoMetadata({
    path: `/equipe/${id}`,
    title,
    description: desc,
    image: member.photo_url,
  });
}

export default async function MemberProfile({ params }: { params: Promise<{ id: string }> }) {
  const dict = await getDictionary();
  const supabase = await createClient();
  const { id } = await params;

  const getRoleIcon = (role: string | null) => {
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
    .eq("is_visible", true)
    .returns<MemberProfileRow[]>()
    .single();

  if (!member) {
    notFound();
  }

  const badgePromise = supabase.from("member_badges").select("id, event_name, award, team_name, academic_year").eq("member_id", member.id).order("academic_year", { ascending: false }).order("created_at", { ascending: false });
  const historyPromise = supabase.from("ancien_bureau_members").select("*, ancien_bureau(academic_year, theme)").eq("first_name", member.first_name).eq("last_name", member.last_name).order("created_at", { ascending: false }).returns<HistoryRow[]>();
  const [{ data: badgeRows }, { data: history }] = await Promise.all([badgePromise, historyPromise]);
  const validAwards = new Set(["first", "second", "third", "jury_choice"]);
  const memberAwards = (badgeRows || []).filter(row => validAwards.has(row.award)).map(row => ({ ...row, award: row.award as MemberAward["award"] }));

  const assignments = normalizeList(member.member_assignments)
    .map(assignment => ({ ...assignment, poles: normalizeRelation(assignment.poles) }))
    .sort((a, b) => Number(b.is_vp) - Number(a.is_vp) || (a.created_at || "").localeCompare(b.created_at || ""));
  const historyRecords = (history || []).map(record => ({ ...record, ancien_bureau: normalizeRelation(record.ancien_bureau) }));
  const socialLinks = member.social_links || {};
  const publicName = getPublicMemberName(member);

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
                <Image 
                  src={member.photo_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=800"} 
                  alt={publicName}
                  fill
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest/80 via-transparent to-transparent z-10"></div>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-2xl border border-outline-variant/10">
              <h3 className="text-sm font-bold uppercase tracking-widest text-tertiary mb-6">{dict.common.contact_social}</h3>
              <ProfileSocialLinks email={member.email} instagram={member.instagram} discord={member.discord}
                linkedin={socialLinks.linkedin} english={dict.profil.title === "My Account"} />
            </div>
          </div>

          {/* Right Column: Bio, Roles, History */}
          <div className="lg:col-span-8 space-y-12">
            <div>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <h1 className="text-4xl md:text-6xl font-headline font-bold text-on-surface tracking-tight">{publicName}</h1>
                    <MembershipStatus paid={member.membership_paid === true} english={dict.profil.title === "My Account"} />
                  </div>
                  <MemberAwards awards={memberAwards} english={dict.profil.title === "My Account"} />
                  <p className="text-lg text-primary font-label font-bold uppercase tracking-widest flex items-center gap-2">
                    {getRoleIcon(member.role_label) && (
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {getRoleIcon(member.role_label)}
                      </span>
                    )}
                    {member.role_label}
                  </p>
                  {member.role_description && <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">{member.role_description}</p>}
                </div>
                <div className="px-4 py-2 bg-surface-container-highest rounded-full border border-outline-variant/15 text-xs font-bold text-on-surface-variant">
                  {member.study_level || dict.team.student_at_ceri}
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <p className="text-xl text-on-surface-variant leading-relaxed font-body">
                  {member.bio || member.description || dict.team.member_bio_empty}
                </p>
              </div>
            </div>

            {/* Current Roles / Missions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-8 rounded-2xl border border-outline-variant/10">
                   <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                     <span className="material-symbols-outlined text-tertiary">verified_user</span>
                     {dict.team.current_term}
                   </h3>
                   <div className="space-y-6">
                     <div className="flex flex-col">
                         <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">{dict.common.primary_role}</span>
                         <span className="text-sm font-bold text-primary">{member.role_label}</span>
                     </div>
                     
                     {assignments.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-outline-variant/10">
                           <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">{dict.common.other_assignments}</span>
                           {assignments.map((a) => (
                              <div key={a.id} className="flex flex-col">
                                 <span className="text-xs font-bold text-on-surface">{dict.common.pole} {a.poles?.name}</span>
                                 <span className="text-xs text-on-surface-variant">{a.role_label || a.role} {a.is_vp && "(VP)"}</span>
                              </div>
                           ))}
                        </div>
                     )}

                      {assignments.length === 0 && (
                        <div className="flex flex-col">
                            <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">{dict.common.responsibilities}</span>
                            <span className="text-sm font-medium">{member.responsibilities || dict.team.no_responsibilities}</span>
                        </div>
                      )}
                   </div>
                </div>

               <div className="glass-panel p-8 rounded-2xl border border-outline-variant/10">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary">history_edu</span>
                    {dict.team.academic_journey}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                    {member.academic_journey || (member.study_level ? `${dict.team.student_at_ceri} — ${member.study_level}` : dict.team.member_bio_empty)}
                  </p>
               </div>
            </div>

            {/* History Table / List */}
            {historyRecords.length > 0 && (
               <div>
                  <h3 className="text-2xl font-headline font-bold mb-8 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">history</span>
                    {dict.team.history_title}
                  </h3>
                  <div className="space-y-4">
                    {historyRecords.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-6 rounded-2xl border border-outline-variant/10 hover:bg-surface-container-high transition-colors">
                        <div className="flex flex-col">
                            <span className="text-xs text-primary font-bold">{record.ancien_bureau?.academic_year}</span>
                            <span className="text-lg font-bold text-on-surface">{record.role_label}</span>
                            <span className="text-xs text-on-surface-variant italic">{dict.team.theme_label} : {record.ancien_bureau?.theme || "N/A"}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">{dict.common.historical_level}</span>
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
          {dict.team.back_to_team}
        </Link>
      </div>
    </div>
  );
}
