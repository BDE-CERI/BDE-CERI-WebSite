import { getDictionary } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import PastBoards from "./PastBoards";
import Link from "next/link";
import SharkWallpaper from "@/components/SharkWallpaper";

export default async function Equipe() {
  const dict = await getDictionary();
  const supabase = await createClient();

  const { data: membersData } = await supabase
    .from("members")
    .select("*, member_assignments(role, poles(name))")
    .eq("is_visible", true)
    .order("rank", { ascending: true })
    .order("last_name", { ascending: true });

  const defaultMembers = [
    {
      id: "1",
      first_name: "Alexandre",
      last_name: "Dubois",
      role_label: "President",
      bio: "Architect of the association's vision. Navigating the delicate balance between academic excellence and unforgettable nights.",
      photo_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBI3WY4TEapgFAVHln9TwyfroFn44tFdfUoczArTvQV_g0ML-cC9VW7AFLEc3NXL4zVlE7r0yaaRn4ygIfdgfimkTHz7B8MfVis8NUu6-bIXUmHIT4dfYrFNT88drRjYJUaSkourx6THa0SotvlEtqyLNg6oMpU07qODR3n7lta3dVFiUqEnLJ4v168bNr-9IvHrRi6Btu4lpI6ZX5dwduZ2rlay0X9NSI7xEh9kcQlbRhXG9kmIFl4V94INau0kNXzdkZxv9m8IFYW"
    },
    {
      id: "2",
      first_name: "Clara",
      last_name: "Lemaire",
      role_label: "Vice President",
      bio: "The tactical mind turning grand visions into flawless execution.",
      photo_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCd1n82jq0cqy39qT-RsIAWklu4zWVLtLEozbIad5CrA3sr8j8SXohrEwirmnSxgrB-NCpDHt404dEuDRPisb9shyFoU5y5aMkAcarsyGoTv3qhCiRvWmHG21tV3TAwdf4Pe6fFY9IlIa9R9lO9RtMlY6JbNAtwC2BKKkZaSr2JOL3ChBNws_J-nbu83Mnf6okn1kGFdVTCIGfQJDGaZcM8I1BjXU7dytUNnvjUEWF8YbuzhIvPPBWJrSMRd3XGz5BqjZi4bt1iotmk",
    },
    {
      id: "3",
      first_name: "Mathieu",
      last_name: "Blanc",
      role_label: "Treasurer",
      bio: "Guardian of the vault. Ensuring every event is spectacular and sustainable.",
      photo_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBTI6Syj-RC3VpCfkmottMSmMMubEiz6pgbbTa23VA7TfE7GGQr2kCHY8UAWQviVJO0G4U5-B_hUHiYjbg6A6ooX4335RMewufnnYcy8cD5SXgZtJcQ_ZGfSdvYxexpBhjIrQam5bhHYE5jvw6dXHV5tx8MFXGpM7g2HgRBAOTt_l4xnYZ3baH4Sr5yKY5kPAAaehH5nRdIh1TEzB4cOShMfBZESbmhoyJ8Ys5lktM6eBU4YPGi-GzBQutEQK8aPiG6klfJwoArupck"
    },
    { id: "4", first_name: "Sophie", last_name: "", role_label: "Head of Events" },
    { id: "5", first_name: "Lucas", last_name: "", role_label: "Communications" },
    { id: "6", first_name: "Emma", last_name: "", role_label: "Partnerships" },
    { id: "7", first_name: "Hugo", last_name: "", role_label: "Tavern Master" }
  ];

  const teamList = membersData && membersData.length > 0 ? membersData : defaultMembers;

  const getGridPosition = (index: number) => {
    if (index === 0) return { colSpan: "md:col-span-2", rowSpan: "md:row-span-2" };
    if (index === 1 || index === 2) return { colSpan: "md:col-span-2", rowSpan: "md:row-span-1" };
    return { colSpan: "md:col-span-1", rowSpan: "md:row-span-1" };
  };

  const getRoleIcon = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes("président") || r.includes("president")) return "crown";
    if (r.includes("vice") || r.includes("vp")) return "verified_user";
    if (r.includes("trésorier") || r.includes("treasurer")) return "account_balance_wallet";
    if (r.includes("secrétaire") || r.includes("secretary")) return "edit_note";
    if (r.includes("chargé de mission")) return "badge";
    return null;
  };

  return (
    <div className="flex-grow pt-12 pb-24 px-4 sm:px-8 max-w-7xl mx-auto w-full flex flex-col gap-24 relative overflow-hidden">
      <SharkWallpaper />
      
      <div className="relative z-10 w-full">
        {/* Hero Header */}
        <div className="mb-20 max-w-2xl">
          <p className="font-label text-sm uppercase tracking-[0.2em] text-primary mb-4">{dict.team.invitation}</p>
          <h1 className="font-headline text-5xl md:text-6xl font-bold tracking-tight text-on-surface leading-tight mb-6">
            {dict.team.title} <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-container">{dict.team.title_highlight}</span>.
          </h1>
          <p className="font-body text-lg text-on-surface-variant max-w-xl">
            {dict.team.description}
          </p>
        </div>

        {/* Bento Grid layout for Team Members */}
        <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[340px] gap-6">
          {teamList.map((member, index) => {
            const layout = getGridPosition(index);
            const fullName = member.last_name ? `${member.first_name} ${member.last_name}` : member.first_name;

            if (member.photo_url) {
              return (
                <Link key={member.id} href={`/equipe/${member.id}`} className={`${layout.colSpan} ${layout.rowSpan} group relative w-full h-full rounded-xl overflow-hidden bg-surface-container-high shadow-lg outline outline-1 outline-outline-variant/15 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(7,13,31,0.5)]`}>
                  <img
                    alt={`Portrait of ${member.role_label}`}
                    className={`absolute inset-0 w-full h-full object-cover ${index === 1 ? 'object-top' : 'object-center'} z-0 transition-transform duration-700 group-hover:scale-105`}
                    src={member.photo_url}
                  />
                  
                  {/* Role Badge */}
                  {getRoleIcon(member.role_label) && (
                    <div className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-surface-container-highest/60 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg group-hover:bg-primary group-hover:text-on-primary transition-colors duration-500">
                       <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                         {getRoleIcon(member.role_label)}
                       </span>
                    </div>
                  )}

                  <div className="absolute inset-0 z-10 bg-surface-container-high/90 transition-all duration-500 group-hover:bg-surface-variant/40 group-hover:backdrop-blur-[20px]"></div>
                  
                  <div className="absolute inset-0 z-20 p-6 md:p-8 flex flex-col justify-end">
                    <div className="transform transition-transform duration-500 group-hover:-translate-y-2 md:group-hover:-translate-y-4">
                      <h3 className={`font-headline ${index === 0 ? 'text-3xl' : 'text-2xl'} font-bold text-on-surface mb-1`}>{fullName}</h3>
                      <div className="flex flex-wrap gap-2">
                         <p className={`font-body ${index === 0 ? 'text-sm' : 'text-xs'} uppercase tracking-wider ${index === 0 ? 'text-tertiary' : 'text-primary'}`}>{member.role_label}</p>
                         {member.member_assignments?.map((a: any, i: number) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-md bg-surface-container-highest text-on-surface-variant border border-outline-variant/10 uppercase font-bold tracking-tighter">
                               {a.role}
                            </span>
                         ))}
                      </div>
                    </div>
                    <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-500 ease-in-out group-hover:grid-rows-[1fr] group-hover:opacity-100">
                      <div className="overflow-hidden">
                        <p className={`font-body ${index === 0 ? 'text-base pt-4 mt-4' : 'text-sm pt-3 mt-3'} text-on-surface-variant border-t border-outline-variant/20`}>
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

            return (
              <Link key={member.id} href={`/equipe/${member.id}`} className={`${layout.colSpan} ${layout.rowSpan} group relative w-full h-full rounded-xl overflow-hidden bg-surface-container-high shadow-lg outline outline-1 outline-outline-variant/15 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(7,13,31,0.5)]`}>
                <div className="absolute inset-0 bg-gradient-to-br from-surface-container-highest to-surface z-0"></div>
                
                {/* Role Badge */}
                {getRoleIcon(member.role_label) && (
                    <div className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-surface-container-highest/60 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg group-hover:bg-primary group-hover:text-on-primary transition-colors duration-500">
                       <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                         {getRoleIcon(member.role_label)}
                       </span>
                    </div>
                )}

                <div className="absolute inset-0 z-10 bg-surface-container-high/80 transition-all duration-500 group-hover:bg-surface-variant/40 group-hover:backdrop-blur-[20px]"></div>
                
                <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
                  <span className="material-symbols-outlined text-primary mb-auto opacity-50 text-4xl group-hover:scale-110 transition-transform">
                    person
                  </span>
                  <div className="transform transition-transform duration-500 group-hover:-translate-y-1">
                    <h3 className="font-headline text-xl font-bold text-on-surface mb-1">{fullName}</h3>
                    <div className="flex flex-wrap gap-1">
                       <p className="font-body text-xs uppercase tracking-wider text-primary">{member.role_label}</p>
                       {member.member_assignments?.map((a: any, i: number) => (
                          <span key={i} className="text-[8px] px-1 py-0.25 rounded bg-surface-container-highest text-on-surface-variant border border-outline-variant/10 uppercase font-bold">
                             {a.role}
                          </span>
                       ))}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Past Boards Section (Lazy) */}
        <PastBoards dict={dict} />
      </div>
    </div>
  );
}
