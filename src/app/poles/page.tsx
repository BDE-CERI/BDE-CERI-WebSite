import { getDictionary } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import Image from "next/image";
import SharkWallpaper from "@/components/SharkWallpaper";
import PolesTree from "@/components/PolesTree";
import { createSeoMetadata } from "@/utils/seo";

export const metadata = createSeoMetadata({
  path: "/poles",
  title: "Les équipes et pôles du BDE",
  description: "Découvre les équipes du BDE CERI à Avignon et les projets qui font vivre l’association étudiante.",
});

export const dynamic = "force-dynamic";

export default async function Poles() {
  const dict = await getDictionary();
  const supabase = await createClient();

  const { data: polesData } = await supabase
    .from("poles")
    .select("*")
    .order("order_index", { ascending: true });

  // Fetch all visible members
  const { data: allMembers } = await supabase
    .from("members")
    .select("id, first_name, last_name, role, role_label, photo_url, pole_id")
    .eq("is_visible", true);

  // Fetch all assignments with member details
  const { data: assignmentsData } = await supabase
    .from("member_assignments")
    .select("role, is_vp, pole_id, members(id, first_name, last_name, photo_url, role_label, is_visible)");

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

  // Build the hierarchical tree data
  const polesTreeData = polesList.map((pole) => {
    // 1. Members directly assigned via pole_id
    const primary = allMembers?.filter(m => m.pole_id === pole.id) || [];
    
    // 2. Members assigned via member_assignments
    const assigned = assignmentsData
      ?.filter(a => a.pole_id === pole.id && a.members && (a.members as any).is_visible)
      .map(a => ({
        id: (a.members as any).id,
        first_name: (a.members as any).first_name,
        last_name: (a.members as any).last_name,
        photo_url: (a.members as any).photo_url,
        role_label: a.role || (a.members as any).role_label || "Membre",
        is_vp: a.is_vp || false,
      })) || [];

    const memberMap = new Map();

    primary.forEach(m => {
      memberMap.set(m.id, {
        id: m.id,
        first_name: m.first_name,
        last_name: m.last_name,
        photo_url: m.photo_url,
        role_label: m.role_label || "Membre du Pôle",
        is_vp: m.role === "vice_president_pole",
      });
    });

    assigned.forEach(m => {
      const existing = memberMap.get(m.id);
      if (!existing || m.is_vp) {
        memberMap.set(m.id, {
          id: m.id,
          first_name: m.first_name,
          last_name: m.last_name,
          photo_url: m.photo_url,
          role_label: m.role_label,
          is_vp: m.is_vp,
        });
      }
    });

    const list = Array.from(memberMap.values());
    const vp = list.find(m => m.is_vp) || null;
    const members = list.filter(m => !m.is_vp);

    return {
      ...pole,
      vp,
      members,
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
        <PolesTree poles={polesTreeData} labels={{ map_kicker: dict.poles.map_kicker, map_title: dict.poles.map_title, map_hint: dict.poles.map_hint, map_anchor: dict.poles.map_anchor, map_current: dict.poles.map_current, map_crew: dict.poles.map_crew, map_lead: dict.poles.map_lead, member_count: dict.poles.member_count, discover_pole: dict.poles.discover_pole, no_poles: dict.poles.no_poles, no_crew: dict.poles.no_crew, map_currents: dict.poles.map_currents, map_places: dict.poles.map_places }} />
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
