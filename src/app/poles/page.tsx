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
      
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-24 text-center">
        <div className="inline-block px-3 py-1 mb-6 rounded-full border border-tertiary/20 bg-tertiary/5 text-tertiary text-[10px] font-bold uppercase tracking-[0.2em]">
          {dict.poles.structure}
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-on-surface font-headline">
          {dict.poles.hero_title}
        </h1>
        <p className="max-w-2xl mx-auto text-on-surface-variant text-lg leading-relaxed font-body">
          {dict.poles.description}
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6">
        <PolesTree poles={polesTreeData} />
      </section>

      <section className="max-w-7xl mx-auto px-6 mt-32 mb-20">
        <div className="relative overflow-hidden rounded-3xl bg-surface-container-high border border-outline-variant/20 p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 shadow-2xl">
          <div className="relative z-10 w-full md:w-1/2">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight font-headline">{dict.poles.recruitment_title}</h2>
            <p className="text-on-surface-variant mb-8 text-lg font-body max-w-md italic">
              “{dict.poles.recruitment_quote}”
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="https://forms.gle/placeholder" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-tertiary text-on-tertiary font-bold rounded-xl hover:shadow-[0_0_20px_rgba(123,208,255,0.4)] transition-all font-label">
                {dict.poles.apply}
              </a>
            </div>
          </div>
          <div className="w-full md:w-1/2 relative aspect-video">
            <div className="absolute inset-0 bg-tertiary/10 rounded-2xl animate-pulse"></div>
            <Image
              alt={dict.poles.collaboration_alt}
              className="object-cover rounded-2xl opacity-40 mix-blend-luminosity border border-tertiary/20"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOt7bBqZtSFJ43qj63UphQTW8OUYNqopsBkpG9Vws5AazbobXkjZwjRwol5oVHwhe38cRGdXzJAgCJnTqcXHDqb7ltYt_QoVfJsr0NIdutXdgVX-NkfMo3R_NR20x3bONCMGHzuyWgnqFWYi2UzZ34HjOHQssObwkvZPDzqYrYOltJyaGtrHvS1_Y1dRtubqXa6FMPzZoHQMvpeDJdfHh0LoJU8Pr4vRDoRDwxXbBCv92rtWZ62f6-IHljNPAL6OYGaxGZJyVfERlH"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
