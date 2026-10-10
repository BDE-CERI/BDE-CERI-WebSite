import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import HomeShowcase from "@/components/HomeShowcase";
import { getDictionary, getLang } from "@/locales/dictionaries";
import InteractiveBackground from "@/components/InteractiveBackground";
import { createSeoMetadata } from "@/utils/seo";
import { createClient } from "@/utils/supabase/server";
import { getPublicMemberName } from "@/utils/member-display";
import { isMemberPoleVicePresident } from "@/utils/member-roles";
import HomeMemberCarousel, { type HomeMember } from "@/components/HomeMemberCarousel";

type HomeMemberRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  hide_last_name: boolean | null;
  role_label: string | null;
  role: string | null;
  pole_id: string | null;
  study_level: string | null;
  photo_url: string | null;
  member_assignments?: {
    role: string | null;
    role_label: string | null;
    is_vp: boolean | null;
    poles: { name: string | null } | { name: string | null }[] | null;
  }[] | null;
};

export const metadata = createSeoMetadata({
  path: "/",
  title: "Vie étudiante, événements et association",
  description: "Découvre le BDE CERI à Avignon : événements étudiants, projets, eSport, équipe et vie de campus.",
});

export default async function Home() {
  const [dict, lang, supabase] = await Promise.all([getDictionary(), getLang(), createClient()]);
  const [{ data: memberRows }, { data: poles }] = await Promise.all([
    supabase
      .from("members")
      .select("id, first_name, last_name, hide_last_name, role_label, role, pole_id, study_level, photo_url, member_assignments(role, role_label, is_vp, poles(name))")
      .eq("is_visible", true)
      .returns<HomeMemberRow[]>(),
    supabase.from("poles").select("id, name"),
  ]);
  const poleNames = new Map((poles || []).map(pole => [pole.id, pole.name]));

  const seenMemberIds = new Set<string>();
  const shuffledRows = (memberRows || []).filter(member => {
    if (seenMemberIds.has(member.id) || !member.photo_url?.trim()) return false;
    seenMemberIds.add(member.id);
    return true;
  });
  for (let index = shuffledRows.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledRows[index], shuffledRows[randomIndex]] = [shuffledRows[randomIndex], shuffledRows[index]];
  }
  const featuredMembers: HomeMember[] = shuffledRows.map(member => {
    const assignments = Array.isArray(member.member_assignments) ? member.member_assignments : member.member_assignments ? [member.member_assignments] : [];
    const assignmentPoleName = (assignment: NonNullable<HomeMemberRow["member_assignments"]>[number]) =>
      Array.isArray(assignment.poles) ? assignment.poles[0]?.name || "" : assignment.poles?.name || "";
    const primaryPole = member.pole_id ? poleNames.get(member.pole_id) || "" : "";
    const vpAssignment = assignments.find(assignment => assignment.is_vp && assignmentPoleName(assignment));
    const firstPole = (vpAssignment ? assignmentPoleName(vpAssignment) : "")
      || (isMemberPoleVicePresident(member.role, member.pole_id) ? primaryPole : "")
      || assignments.map(assignmentPoleName).find(Boolean)
      || primaryPole;
    return {
      id: member.id,
      name: getPublicMemberName(member) || (lang === "en" ? "BDE member" : "Membre du BDE"),
      role: member.role_label || "",
      studyLevel: member.study_level || "",
      pole: firstPole,
      photoUrl: member.photo_url,
    };
  });

  return (
    <>
      <section className="relative min-h-[calc(100svh-5rem)] md:min-h-[921px] flex items-center justify-center overflow-hidden bg-surface">
        <div className="absolute inset-0 z-0">
          <InteractiveBackground />
          <div className="absolute top-1/4 left-1/4 hidden md:block w-96 h-96 bg-primary-container rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 hidden md:block w-[30rem] h-[30rem] bg-tertiary-container rounded-full mix-blend-screen filter blur-[120px] opacity-40"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex flex-col md:flex-row items-center justify-between gap-16">
          <div className="w-full md:w-1/2 flex flex-col items-start space-y-8">
            <div className="inline-flex items-center space-x-2 bg-surface-container-lowest px-4 py-2 rounded-full ghost-border-bottom">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
              <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant">{dict.home.semester}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-headline font-bold text-on-surface leading-tight tracking-[-0.02em]">
              {dict.home.welcome} <br />
              <span className="festive-gradient-text">BDE CERI</span>.
            </h1>
            <p className="text-lg md:text-xl font-body text-on-surface-variant max-w-lg leading-relaxed">
              {dict.home.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/evenement" className="glass-panel text-on-surface px-8 py-4 rounded-lg font-label font-medium tracking-wide border border-outline-variant/15 hover:bg-surface-variant/60 transition-all flex items-center justify-center">
                {dict.home.discover_events}
              </Link>
            </div>
          </div>
          <div className="w-full md:w-1/2 relative h-[500px] hidden md:block">
            <div className="absolute right-0 bottom-0 w-full h-full z-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-radial-gradient from-tertiary/10 to-transparent opacity-50 blur-3xl"></div>
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full max-w-md transform rotate-2 hover:rotate-0 transition-transform duration-700">
                  <HomeMemberCarousel members={featuredMembers} english={lang === "en"} />
                </div>
                
                <div className="absolute -right-6 top-5 z-20 w-72 translate-x-4 transform rounded-xl border border-[#C67A40]/30 bg-surface-container-low/95 p-5 shadow-[0_20px_40px_rgba(7,13,31,0.5)] backdrop-blur-xl transition-transform duration-500 hover:translate-x-0">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#C67A40]/15"><Image src="/logos/taverne-icon.png" alt="" width={40} height={34} className="size-10 object-contain" /></div>
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-bold uppercase tracking-[.15em] text-on-surface-variant">{dict.boutique.shop_name}</p>
                      <p className="text-sm font-headline font-bold text-on-surface">{dict.boutique.store_descriptor}</p>
                    </div>
                  </div>
                  <p className="mb-3 text-xs leading-5 text-on-surface-variant">{dict.home.shop_promo_desc}</p>
                  <Link href="/boutique" className="inline-flex items-center gap-1 text-xs font-bold text-[#C67A40] hover:underline">{dict.boutique.enter_tavern}<span aria-hidden="true" className="material-symbols-outlined text-sm">arrow_forward</span></Link>
                </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 overflow-hidden border-y border-outline-variant/10 bg-surface-container-low px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-tertiary">BDE CERI · Avignon</p>
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">{dict.home.about_title}</h2>
          </div>
          <div className="flex flex-col items-start gap-6">
            <p className="max-w-3xl text-base leading-7 text-on-surface-variant sm:text-lg">{dict.home.about_description}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/poles" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container px-5 py-3 text-sm font-bold text-on-surface transition hover:border-tertiary/50 hover:bg-surface-container-high">
                {dict.home.about_poles}<span aria-hidden="true" className="material-symbols-outlined text-lg text-tertiary">arrow_forward</span>
              </Link>
              <Link href="/equipe" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container px-5 py-3 text-sm font-bold text-on-surface transition hover:border-tertiary/50 hover:bg-surface-container-high">
                {dict.home.about_team}<span aria-hidden="true" className="material-symbols-outlined text-lg text-tertiary">groups</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={<section aria-hidden="true" className="min-h-[28rem] bg-surface-container-lowest px-4 py-16 sm:px-6"><div className="mx-auto max-w-7xl"><div className="mx-auto mb-10 h-8 w-56 animate-pulse rounded-lg bg-surface-container-high"/><div className="h-72 animate-pulse rounded-2xl bg-surface-container-high sm:h-96"/></div></section>}>
        <HomeShowcase dict={dict} lang={lang} />
      </Suspense>
      <section className="relative z-10 bg-surface px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 rounded-3xl border border-tertiary/20 bg-surface-container-low p-7 shadow-xl sm:flex-row sm:items-center sm:p-10">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-tertiary">BDE CERI</p>
            <h2 className="font-headline text-2xl font-bold text-on-surface sm:text-3xl">{dict.home.join_title}</h2>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">{dict.home.join_description}</p>
          </div>
          <Link href="/contact#recrutement" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-tertiary px-5 py-3 text-center text-sm font-bold text-on-tertiary transition hover:-translate-y-0.5 hover:shadow-lg">
            {dict.home.join_contact}<span aria-hidden="true" className="material-symbols-outlined text-lg">arrow_forward</span>
          </Link>
        </div>
      </section>
    </>
  );
}
