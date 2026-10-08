import { getDictionary, getLang } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import PastBoards from "./PastBoards";
import Link from "next/link";
import Image from "next/image";
import SharkWallpaper from "@/components/SharkWallpaper";
import { Suspense } from "react";
import { createSeoMetadata } from "@/utils/seo";

export const metadata = createSeoMetadata({
  path: "/equipe",
  title: "L’équipe du BDE CERI",
  description: "Rencontre l’équipe du BDE CERI à Avignon : les étudiantes et étudiants engagés dans la vie de campus.",
});

export const dynamic = "force-dynamic";

// ─── Skeleton loader pour les cartes membres ────────────────────────────────
function MemberCardSkeleton({ large = false }: { large?: boolean }) {
  return (
    <div
      className={`${large ? "md:col-span-2 md:row-span-2" : "md:col-span-2 md:row-span-1"} relative w-full h-full rounded-xl overflow-hidden bg-surface-container-high shadow-lg outline outline-1 outline-outline-variant/15 animate-pulse`}
    >
      <div className="absolute inset-0 bg-surface-container-highest/60" />
      <div className="absolute inset-0 p-6 flex flex-col justify-end gap-3">
        <div className="h-4 w-24 rounded bg-surface-container-highest" />
        <div className="h-6 w-40 rounded bg-surface-container-highest" />
      </div>
    </div>
  );
}

function TeamGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[340px] gap-6">
      <MemberCardSkeleton large />
      <MemberCardSkeleton />
      <MemberCardSkeleton />
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="md:col-span-1 md:row-span-1 relative w-full h-full rounded-xl overflow-hidden bg-surface-container-high shadow-lg outline outline-1 outline-outline-variant/15 animate-pulse"
        >
          <div className="absolute inset-0 bg-surface-container-highest/60" />
        </div>
      ))}
    </div>
  );
}

// ─── Grille des membres (composant asynchrone) ──────────────────────────────
async function TeamGrid({ dict, lang, currentYear }: { dict: any; lang: string; currentYear: string }) {
  const supabase = await createClient();

  const { data: membersData } = await supabase
    .from("members")
    .select("*, member_assignments(role, poles(name))")
    .eq("is_visible", true)
    .or(`current_academic_year.eq.${currentYear},category.eq.membre_honneur`)
    .order("rank", { ascending: true })
    .order("last_name", { ascending: true });

  const defaultMembers = [
    {
      id: "1",
      first_name: "Alexandre",
      last_name: "Dubois",
      role_label: "Président",
      category: "bureau_restreint",
      bio: "Architect of the association's vision.",
      photo_url:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBI3WY4TEapgFAVHln9TwyfroFn44tFdfUoczArTvQV_g0ML-cC9VW7AFLEc3NXL4zVlE7r0yaaRn4ygIfdgfimkTHz7B8MfVis8NUu6-bIXUmHIT4dfYrFNT88drRjYJUaSkourx6THa0SotvlEtqyLNg6oMpU07qODR3n7lta3dVFiUqEnLJ4v168bNr-9IvHrRi6Btu4lpI6ZX5dwduZ2rlay0X9NSI7xEh9kcQlbRhXG9kmIFl4V94INau0kNXzdkZxv9m8IFYW",
      photo_position: "center",
    },
    {
      id: "2",
      first_name: "Clara",
      last_name: "Lemaire",
      role_label: "Vice-Présidente",
      category: "bureau_restreint",
      bio: "The tactical mind turning grand visions into flawless execution.",
      photo_url:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCd1n82jq0cqy39qT-RsIAWklu4zWVLtLEozbIad5CrA3sr8j8SXohrEwirmnSxgrB-NCpDHt404dEuDRPisb9shyFoU5y5aMkAcarsyGoTv3qhCiRvWmHG21tV3TAwdf4Pe6fFY9IlIa9R9lO9RtMlY6JbNAtwC2BKKkZaSr2JOL3ChBNws_J-nbu83Mnf6okn1kGFdVTCIGfQJDGaZcM8I1BjXU7dytUNnvjUEWF8YbuzhIvPPBWJrSMRd3XGz5BqjZi4bt1iotmk",
      photo_position: "top",
    },
    {
      id: "3",
      first_name: "Mathieu",
      last_name: "Blanc",
      role_label: "Trésorier",
      category: "bureau_restreint",
      bio: "Guardian of the vault.",
      photo_url:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBTI6Syj-RC3VpCfkmottMSmMMubEiz6pgbbTa23VA7TfE7GGQr2kCHY8UAWQviVJO0G4U5-B_hUHiYjbg6A6ooX4335RMewufnnYcy8cD5SXgZtJcQ_ZGfSdvYxexpBhjIrQam5bhHYE5jvw6dXHV5tx8MFXGpM7g2HgRBAOTt_l4xnYZ3baH4Sr5yKY5kPAAaehH5nRdIh1TEzB4cOShMfBZESbmhoyJ8Ys5lktM6eBU4YPGi-GzBQutEQK8aPiG6klfJwoArupck",
      photo_position: "center",
    },
    { id: "4", first_name: "Sophie", last_name: "", role_label: "Responsable Évènements", category: "bureau" },
    { id: "5", first_name: "Lucas", last_name: "", role_label: "Communications", category: "bureau" },
    { id: "6", first_name: "Emma", last_name: "", role_label: "Partenariats", category: "bureau" },
    { id: "7", first_name: "Hugo", last_name: "", role_label: "Tavern Master", category: "membre_actif" },
  ];

  const teamList = membersData && membersData.length > 0 ? membersData : defaultMembers;

  const isFr = lang === "fr";

  // Group members by category
  const bureauRestreint = teamList.filter((m: any) => m.category === "bureau_restreint" && m.first_name !== "Gautier");
  const bureau = teamList.filter((m: any) => m.category === "bureau" || (m.category === "bureau_restreint" && m.first_name === "Gautier"));
  const membresActifs = teamList.filter((m: any) => (m.category === "membre_actif" || !m.category) && m.first_name !== "Gautier" && m.category !== "membre_honneur");
  const membresHonneur = teamList.filter((m: any) => m.category === "membre_honneur");

  const getGridPosition = (index: number) => {
    if (index === 0) return { colSpan: "md:col-span-2", rowSpan: "md:row-span-2" };
    if (index === 1 || index === 2) return { colSpan: "md:col-span-2", rowSpan: "md:row-span-1" };
    return { colSpan: "md:col-span-1", rowSpan: "md:row-span-1" };
  };

  const getRoleIcon = (role: string) => {
    const r = role?.toLowerCase() || "";
    if (r.includes("président") || r.includes("president")) return "crown";
    if (r.includes("vice") || r.includes("vp")) return "verified_user";
    if (r.includes("trésorier") || r.includes("treasurer")) return "account_balance_wallet";
    if (r.includes("secrétaire") || r.includes("secretary")) return "edit_note";
    if (r.includes("chargé de mission")) return "badge";
    return null;
  };

  const getPhotoPosition = (member: any, index: number): string => {
    if (member.photo_position) return `object-${member.photo_position}`;
    if (index === 1) return "object-top";
    return "object-center";
  };

  const renderMemberCard = (member: any, layout: any, index: number) => {
    const fullName = member.last_name
      ? `${member.first_name} ${member.last_name}`
      : member.first_name;
    const photoPos = getPhotoPosition(member, index);
    const isPriority = index < 3;

    if (member.photo_url) {
      return (
        <Link
          key={member.id}
          href={`/equipe/${member.id}`}
          className={`${layout.colSpan} ${layout.rowSpan} group relative w-full h-full rounded-xl overflow-hidden bg-surface-container-high shadow-lg outline outline-1 outline-outline-variant/15 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(7,13,31,0.5)]`}
        >
          {/* Photo avec centrage contrôlé */}
          <div className="absolute inset-0 z-0">
            <Image
              alt={`Portrait de ${fullName}`}
              className={`w-full h-full object-cover ${photoPos} transition-all duration-700 filter grayscale group-hover:grayscale-0 group-hover:scale-105`}
              src={member.photo_url}
              fill
              priority={isPriority}
              loading={isPriority ? "eager" : "lazy"}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              suppressHydrationWarning
            />
          </div>

          {/* Role Badge */}
          {getRoleIcon(member.role_label) && (
            <div className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-surface-container-highest/60 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg group-hover:bg-primary group-hover:text-on-primary transition-colors duration-500">
              <span
                className="material-symbols-outlined text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {getRoleIcon(member.role_label)}
              </span>
            </div>
          )}

          {/* Gradient text protection overlay (stable, no solid color hide) */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-surface-container-high/95 via-surface-container-high/20 to-transparent transition-all duration-500 group-hover:from-surface-container-high/98 group-hover:via-surface-container-high/40 group-hover:to-transparent" />

          <div className="absolute inset-0 z-20 p-6 md:p-8 flex flex-col justify-end">
            <div className="transform transition-transform duration-500 group-hover:-translate-y-2 md:group-hover:-translate-y-4">
              <h3
                className={`font-headline ${layout.rowSpan?.includes("row-span-2") ? "text-3xl" : "text-xl md:text-2xl"} font-bold text-on-surface mb-1`}
              >
                {fullName}
              </h3>
              <div className="flex flex-wrap gap-2">
                <p
                  className={`font-body ${layout.rowSpan?.includes("row-span-2") ? "text-sm" : "text-xs"} uppercase tracking-wider ${layout.rowSpan?.includes("row-span-2") ? "text-tertiary" : "text-primary"}`}
                >
                  {member.role_label}
                </p>
                {member.member_assignments?.map((a: any, i: number) => (
                  <span
                    key={i}
                    className="text-[9px] px-1.5 py-0.5 rounded-md bg-surface-container-highest text-on-surface-variant border border-outline-variant/10 uppercase font-bold tracking-tighter"
                  >
                    {a.role}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-500 ease-in-out group-hover:grid-rows-[1fr] group-hover:opacity-100">
              <div className="overflow-hidden">
                <p
                  className={`font-body ${layout.rowSpan?.includes("row-span-2") ? "text-base pt-4 mt-4" : "text-xs pt-3 mt-3"} text-on-surface-variant border-t border-outline-variant/20`}
                >
                  {member.bio || member.description}
                </p>
                <div className="flex gap-4 mt-6">
                  <span className="text-xs font-bold text-tertiary uppercase tracking-widest flex items-center gap-1">
                    Voir le profil complet
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      );
    }

    // Carte sans photo
    return (
      <Link
        key={member.id}
        href={`/equipe/${member.id}`}
        className={`${layout.colSpan} ${layout.rowSpan} group relative w-full h-full rounded-xl overflow-hidden bg-surface-container-high shadow-lg outline outline-1 outline-outline-variant/15 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(7,13,31,0.5)]`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-surface-container-highest to-surface z-0" />

        {getRoleIcon(member.role_label) && (
          <div className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-surface-container-highest/60 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg group-hover:bg-primary group-hover:text-on-primary transition-colors duration-500">
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {getRoleIcon(member.role_label)}
            </span>
          </div>
        )}

        <div className="absolute inset-0 z-10 bg-surface-container-high/80 transition-all duration-500 group-hover:bg-surface-variant/40 group-hover:backdrop-blur-[20px]" />

        <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
          <span className="material-symbols-outlined text-primary mb-auto opacity-50 text-4xl group-hover:scale-110 transition-transform">
            person
          </span>
          <div className="transform transition-transform duration-500 group-hover:-translate-y-1">
            <h3 className="font-headline text-xl font-bold text-on-surface mb-1">{fullName}</h3>
            <div className="flex flex-wrap gap-1">
              <p className="font-body text-xs uppercase tracking-wider text-primary">
                {member.role_label}
              </p>
              {member.member_assignments?.map((a: any, i: number) => (
                <span
                  key={i}
                  className="text-[8px] px-1 py-0.5 rounded bg-surface-container-highest text-on-surface-variant border border-outline-variant/10 uppercase font-bold"
                >
                  {a.role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  const hasHonneur = membresHonneur.length > 0;

  return (
    <div className={`grid grid-cols-1 ${hasHonneur ? "lg:grid-cols-4 gap-12" : ""} w-full`}>
      {/* Main active team columns */}
      <div className={`${hasHonneur ? "lg:col-span-3" : ""} flex flex-col gap-20`}>
        {/* Category: Bureau Restreint */}
        {bureauRestreint.length > 0 && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight uppercase">
                {isFr ? "Le Bureau Restreint" : "Executive Board"}
              </h2>
              <div className="h-px flex-1 bg-outline-variant/10" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[340px] gap-6">
              {bureauRestreint.map((member, index) => {
                const layout = getGridPosition(index);
                return renderMemberCard(member, layout, index);
              })}
            </div>
          </div>
        )}

        {/* Category: Bureau */}
        {bureau.length > 0 && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight uppercase">
                {isFr ? "Le Bureau" : "General Board"}
              </h2>
              <div className="h-px flex-1 bg-outline-variant/10" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 auto-rows-[300px] gap-6">
              {bureau.map((member, index) => {
                const layout = { colSpan: "col-span-1", rowSpan: "row-span-1" };
                return renderMemberCard(member, layout, index);
              })}
            </div>
          </div>
        )}

        {/* Category: Membres Actifs */}
        {membresActifs.length > 0 && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight uppercase">
                {isFr ? "Membres Actifs" : "Active Members"}
              </h2>
              <div className="h-px flex-1 bg-outline-variant/10" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[240px] gap-6">
              {membresActifs.map((member, index) => {
                const layout = { colSpan: "col-span-1", rowSpan: "row-span-1" };
                return renderMemberCard(member, layout, index);
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar: Membres d'Honneur */}
      {hasHonneur && (
        <div className="lg:col-span-1">
          <div className="flex flex-col gap-8 sticky top-24">
            <div className="flex items-center gap-4">
              <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">military_tech</span>
                {isFr ? "Honneur" : "Honor"}
              </h2>
              <div className="h-px flex-1 bg-outline-variant/10" />
            </div>

            <div className="flex flex-col gap-4">
              {membresHonneur.map((member) => {
                const fullName = member.last_name
                  ? `${member.first_name} ${member.last_name}`
                  : member.first_name;

                return (
                  <Link
                    key={member.id}
                    href={`/equipe/${member.id}`}
                    className="reveal-card p-4 rounded-2xl bg-surface-container-high/40 hover:bg-surface-container-high border border-outline-variant/15 transition-all duration-300 flex items-center gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-tertiary/20 ring-2 ring-tertiary/5 relative shrink-0">
                      {member.photo_url ? (
                        <Image
                          src={member.photo_url}
                          alt={fullName}
                          fill
                          className="object-cover transition-all duration-500 filter grayscale group-hover:grayscale-0 group-hover:scale-105"
                          sizes="48px"
                          suppressHydrationWarning
                        />
                      ) : (
                        <div className="w-full h-full bg-surface-container-low flex items-center justify-center text-outline text-lg">
                          <span className="material-symbols-outlined">person</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col text-left">
                      <h4 className="font-headline font-bold text-sm text-on-surface leading-tight transition-colors group-hover:text-tertiary">
                        {fullName}
                      </h4>
                      <span className="text-[10px] text-tertiary font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] fill-tertiary text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                        {member.role_label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────
export default async function Equipe() {
  const dict = await getDictionary();
  const lang = await getLang();
  const supabase = await createClient();

  // Fetch the latest active academic year dynamically from the members table
  const { data: yearData } = await supabase
    .from("members")
    .select("current_academic_year")
    .eq("is_visible", true)
    .order("current_academic_year", { ascending: false })
    .limit(1);

  const currentYear = yearData?.[0]?.current_academic_year || "2026-2027";

  return (
    <div className="flex-grow pt-12 pb-24 px-4 sm:px-8 max-w-7xl mx-auto w-full flex flex-col gap-24 relative overflow-hidden">
      <SharkWallpaper />

      <div className="relative z-10 w-full">
        {/* Hero Header */}
        <div className="mb-20 max-w-2xl">
          <p className="font-label text-sm uppercase tracking-[0.2em] text-primary mb-4">
            {dict.team.invitation}
          </p>
          <h1 className="font-headline text-5xl md:text-6xl font-bold tracking-tight text-on-surface leading-tight mb-6">
            {dict.team.title}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-container">
              {dict.team.title_highlight}
            </span>
            .
          </h1>
          <p className="font-body text-lg text-on-surface-variant max-w-xl">{dict.team.description}</p>
        </div>

        {/* Badge Année courante */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5">
            <span className="material-symbols-outlined text-primary text-[18px]">groups</span>
            <span className="text-xs font-bold text-primary uppercase tracking-[0.2em]">
              Bureau {currentYear}
            </span>
          </div>
          <div className="h-px flex-1 bg-outline-variant/15" />
        </div>

        {/* Bento Grid avec Suspense + Skeleton */}
        <Suspense fallback={<TeamGridSkeleton />}>
          <TeamGrid dict={dict} lang={lang} currentYear={currentYear} />
        </Suspense>

        {/* Past Boards Section (Lazy) */}
        <PastBoards dict={dict} />
      </div>
    </div>
  );
}
