import { getDictionary } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import SharkWallpaper from "@/components/SharkWallpaper";
import PolesTree from "@/components/PolesTree";
import { createSeoMetadata } from "@/utils/seo";
import { getPublicMemberLastName } from "@/utils/member-display";
import type { ComponentProps } from "react";

type PoleRow = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
};

type MemberSummary = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  hide_last_name?: boolean | null;
  photo_url: string | null;
  role_label: string | null;
};

type PrimaryMember = MemberSummary & {
  role: string | null;
  pole_id: string | null;
};

type AssignmentRow = {
  role: string | null;
  is_vp: boolean | null;
  pole_id: string | null;
  members: (MemberSummary & { is_visible: boolean | null }) | (MemberSummary & { is_visible: boolean | null })[] | null;
};

type TreePole = ComponentProps<typeof PolesTree>["poles"][number];
type TreeMember = NonNullable<TreePole["vp"]>;

function normalizeRelation<T>(relation: T | T[] | null | undefined): T | null {
  return Array.isArray(relation) ? relation[0] || null : relation || null;
}

export const metadata = createSeoMetadata({
  path: "/poles",
  title: "Les équipes et pôles du BDE",
  description: "Découvre les équipes du BDE CERI à Avignon et les projets qui font vivre l’association étudiante.",
});

export const dynamic = "force-dynamic";

export default async function Poles() {
  const dict = await getDictionary();
  const supabase = await createClient();

  const en = dict.profil.title === "My Account";
  const l = (fr: string, english: string) => en ? english : fr;

  const { data: polesData, error: polesError } = await supabase
    .from("poles")
    .select("id, name, description, color")
    .order("order_index", { ascending: true })
    .returns<PoleRow[]>();

  const polesList = polesData || [];
  let allMembers: PrimaryMember[] = [];
  let assignmentsData: AssignmentRow[] = [];
  let unavailable = !!polesError;

  if (!polesError && polesList.length > 0) {
    const [membersResult, assignmentsResult] = await Promise.all([
      supabase
        .from("members")
        .select("*")
        .eq("is_visible", true)
        .returns<PrimaryMember[]>(),
      supabase
        .from("member_assignments")
        .select("role, is_vp, pole_id, members(*)")
        .returns<AssignmentRow[]>(),
    ]);
    unavailable = !!membersResult.error || !!assignmentsResult.error;
    allMembers = membersResult.data || [];
    assignmentsData = assignmentsResult.data || [];
  }

  const assignments = assignmentsData.flatMap(assignment => {
    const member = normalizeRelation(assignment.members);
    return member?.is_visible ? [{ ...assignment, member }] : [];
  });

  const polesTreeData: TreePole[] = polesList.map(pole => {
    const memberMap = new Map<string, TreeMember>();

    allMembers.filter(member => member.pole_id === pole.id).forEach(member => {
      memberMap.set(member.id, {
        id: member.id,
        first_name: member.first_name || "",
        last_name: getPublicMemberLastName(member),
        hide_last_name: member.hide_last_name !== false,
        photo_url: member.photo_url,
        role_label: member.role_label || l("Membre du pôle", "Team member"),
        is_vp: member.role === "vice_president_pole",
      });
    });

    assignments.filter(assignment => assignment.pole_id === pole.id).forEach(assignment => {
      const member = assignment.member;
      const existing = memberMap.get(member.id);
      if (!existing || assignment.is_vp) {
        memberMap.set(member.id, {
          id: member.id,
          first_name: member.first_name || "",
          last_name: getPublicMemberLastName(member),
          hide_last_name: member.hide_last_name !== false,
          photo_url: member.photo_url,
          role_label: assignment.role || member.role_label || l("Membre du pôle", "Team member"),
          is_vp: assignment.is_vp || false,
        });
      }
    });

    const list = Array.from(memberMap.values());
    return {
      id: pole.id,
      name: pole.name,
      description: pole.description || "",
      color: pole.color || "#7BD0FF",
      vp: list.find(member => member.is_vp) || null,
      members: list.filter(member => !member.is_vp),
    };
  });

  return (
    <div className="relative overflow-hidden w-full bg-surface">
      <SharkWallpaper />
      
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-12 pt-16 text-center md:pb-16 md:pt-24">
        <div className="inline-block px-3 py-1 mb-6 rounded-full border border-tertiary/20 bg-tertiary/5 text-tertiary text-[10px] font-bold uppercase tracking-[0.2em]">
          {dict.poles.structure}
        </div>
        <h1 className="mx-auto mb-6 max-w-5xl text-4xl font-bold tracking-tight text-on-surface font-headline sm:text-5xl md:text-7xl">
          {dict.poles.hero_title}
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-on-surface-variant font-body md:text-lg">
          {dict.poles.description}
        </p>
      </section>

      <section id="poles" className="relative z-10 mx-auto max-w-7xl px-6">
        {unavailable ? (
          <div role="alert" className="rounded-[2rem] border border-outline-variant/20 bg-surface-container-low px-6 py-12 text-center">
            <span aria-hidden="true" className="material-symbols-outlined mb-4 text-4xl text-on-surface-variant">cloud_off</span>
            <h2 className="font-headline text-xl font-bold">{l("Les pôles sont momentanément indisponibles", "Teams are temporarily unavailable")}</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-on-surface-variant">
              {l("Nous n’avons pas pu charger les pôles et leurs équipes. Réessayez dans quelques instants.", "We could not load the teams and their members. Please try again in a moment.")}
            </p>
            <form action="/poles" method="get" className="mt-6">
              <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-tertiary/30 px-5 py-2.5 text-sm font-bold text-tertiary transition-colors hover:bg-tertiary/10">
                <span aria-hidden="true" className="material-symbols-outlined text-lg">refresh</span>
                {l("Réessayer", "Try again")}
              </button>
            </form>
          </div>
        ) : (
          <PolesTree poles={polesTreeData} labels={{ map_kicker: dict.poles.map_kicker, map_title: dict.poles.map_title, map_hint: dict.poles.map_hint, map_anchor: dict.poles.map_anchor, map_current: dict.poles.map_current, map_crew: dict.poles.map_crew, map_lead: dict.poles.map_lead, member_count: dict.poles.member_count, discover_pole: dict.poles.discover_pole, no_poles: dict.poles.no_poles, no_crew: dict.poles.no_crew, map_currents: dict.poles.map_currents, map_places: dict.poles.map_places }} />
        )}
      </section>

      <section className="max-w-7xl mx-auto px-6 mt-32 mb-20">
        <div className="relative overflow-hidden rounded-3xl bg-surface-container-high border border-outline-variant/20 p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 shadow-2xl">
          <div className="relative z-10 w-full md:w-1/2">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight font-headline">{dict.poles.recruitment_title}</h2>
            <p className="text-on-surface-variant mb-8 text-lg font-body max-w-md italic">
              “{dict.poles.recruitment_quote}”
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="/contact" className="px-8 py-4 bg-tertiary text-on-tertiary font-bold rounded-xl hover:shadow-[0_0_20px_rgba(123,208,255,0.4)] transition-all font-label">
                {dict.poles.apply}
              </a>
            </div>
          </div>
          <div className="recruit-chart relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-tertiary/20 bg-[#071725] md:w-1/2">
            <svg aria-hidden="true" viewBox="0 0 600 340" className="absolute inset-0 h-full w-full" fill="none">
              <circle cx="300" cy="170" r="104" stroke="#83d9ff" strokeOpacity=".15" strokeDasharray="2 9" />
              <circle className="recruit-orbit" cx="300" cy="170" r="143" stroke="#83d9ff" strokeOpacity=".25" strokeDasharray="140 24 18 20" />
              <path className="recruit-route" d="M54 276C154 258 142 90 252 104s132 137 222 90 44-94 86-113" stroke="#83d9ff" strokeOpacity=".6" strokeWidth="1.5" strokeDasharray="5 8" />
              <path d="M0 280c102-42 150 8 244-14s141-66 220-38 95 31 136 5" stroke="#b9eaff" strokeOpacity=".12" />
              <path d="M0 305c102-42 150 8 244-14s141-66 220-38 95 31 136 5" stroke="#b9eaff" strokeOpacity=".08" />
              <circle className="recruit-beacon" cx="54" cy="276" r="5" fill="#83d9ff" />
              <circle className="recruit-beacon recruit-beacon-two" cx="560" cy="81" r="5" fill="#83d9ff" />
            </svg>
            <div className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full border border-tertiary/30 bg-[#dceef5] shadow-[0_0_55px_rgba(78,195,245,.24)]">
              <Image src="/logos/BDE-CERI-logo.png" alt="Logo du BDE CERI" width={110} height={110} className="h-24 w-24 object-contain" sizes="110px" />
            </div>
            <span className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-[#06131f]/80 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.2em] text-[#c7e4f1]/65">{dict.poles.recruit_visual_caption}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
