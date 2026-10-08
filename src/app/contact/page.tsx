import { getDictionary } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import LazyInteractiveMap from "@/components/LazyInteractiveMap";
import Link from "next/link";
import SharkWallpaper from "@/components/SharkWallpaper";
import { createSeoMetadata } from "@/utils/seo";

export const metadata = createSeoMetadata({
  path: "/contact",
  title: "Contacter le BDE CERI",
  description: "Contacter le Bureau des étudiants du CERI à Avignon : adresse, réseaux sociaux, horaires du local et demandes de partenariat.",
});

export default async function Contact() {
  const [dict, supabase] = await Promise.all([getDictionary(), createClient()]);

  // Fetch dynamic site settings for address, social links, helloasso url
  const { data: settings } = await supabase
    .from("site_settings")
    .select("key, value");

  const getSetting = (key: string, fallback = "") => {
    return settings?.find(s => s.key === key)?.value ?? fallback;
  };

  const helloassoUrl = getSetting("helloasso_url", "https://www.helloasso.com");
  const instagramUrl = getSetting("instagram_url", "#");
  const address = getSetting("address", "339 Chemin des Meinajaries, 84000 Avignon");

  return (
    <div className="bg-surface min-h-screen relative overflow-hidden">
      <SharkWallpaper />
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-6 py-24">
        
        {/* Header Section */}
        <section className="mb-20">
          <div className="inline-block px-3 py-1 mb-6 rounded-full border border-tertiary/20 bg-tertiary/5 text-tertiary text-[10px] font-bold uppercase tracking-[0.2em]">
            {dict.contact.badge}
          </div>
          <h1 className="text-5xl md:text-7xl font-headline font-bold text-on-surface tracking-tight mb-8">
            <span className="text-tertiary">{dict.contact.page_title}</span>
          </h1>
          <p className="max-w-2xl text-on-surface-variant text-lg leading-relaxed font-body">
            {dict.contact.description}
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Form & Map */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Interactive Map */}
            <div className="reveal-card h-[400px] rounded-3xl relative overflow-hidden group">
               <LazyInteractiveMap />
               <div className="absolute top-6 left-6 z-[1000] p-4 glass-panel rounded-2xl border border-tertiary/20 shadow-2xl max-w-xs group-hover:-translate-y-1 transition-transform">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-tertiary flex items-center justify-center text-on-tertiary">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                    </div>
                    <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">{dict.contact.map_title}</h3>
                  </div>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    {dict.contact.map_description}
                  </p>
               </div>
            </div>

            {/* Canaux Officiels */}
            <div className="glass-panel p-10 rounded-3xl border border-outline-variant/10 shadow-xl space-y-8">
               <div>
                  <h2 className="text-2xl font-headline font-bold mb-2">{dict.contact.channels_title}</h2>
                 <p className="text-sm text-on-surface-variant leading-relaxed">
                    {dict.contact.channels_description}
                 </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Discord Invitation Card */}
                 <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 bg-surface-container-low hover:bg-surface-container-high transition-all flex flex-col justify-between group/card relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-[#5865F2]/5 rounded-full blur-2xl group-hover/card:bg-[#5865F2]/10 transition-all"></div>
                   <div>
                     <div className="w-12 h-12 rounded-xl bg-[#5865F2]/10 flex items-center justify-center text-[#5865F2] mb-4">
                       <span className="material-symbols-outlined text-2xl font-bold">forum</span>
                     </div>
                      <h3 className="text-lg font-headline font-bold mb-2 text-on-surface">{dict.contact.discord_title}</h3>
                     <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
                        {dict.contact.discord_description}
                     </p>
                   </div>
                   <a 
                     href="https://discord.gg/bde-ceri" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#5865F2] text-white font-bold hover:shadow-[0_0_15px_rgba(88,101,242,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all text-xs"
                   >
                      <span>{dict.contact.discord_button}</span>
                     <span className="material-symbols-outlined text-sm">north_east</span>
                   </a>
                 </div>

                 {/* Instagram Card */}
                 <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 bg-surface-container-low hover:bg-surface-container-high transition-all flex flex-col justify-between group/card relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 rounded-full blur-2xl group-hover/card:bg-tertiary/10 transition-all"></div>
                   <div>
                     <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary mb-4">
                       <span className="material-symbols-outlined text-2xl font-bold">photo_camera</span>
                     </div>
                      <h3 className="text-lg font-headline font-bold mb-2 text-on-surface">{dict.contact.instagram_title}</h3>
                     <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
                        {dict.contact.instagram_description}
                     </p>
                   </div>
                   <a 
                     href={instagramUrl} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-tr from-primary via-tertiary to-secondary text-on-tertiary font-bold hover:shadow-[0_0_15px_rgba(123,208,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all text-xs"
                   >
                      <span>{dict.contact.instagram_button}</span>
                     <span className="material-symbols-outlined text-sm">north_east</span>
                   </a>
                 </div>

                 {/* Email Card */}
                 <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 bg-surface-container-low hover:bg-surface-container-high transition-all flex flex-col justify-between group/card relative overflow-hidden">
                   <div>
                     <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                       <span className="material-symbols-outlined text-2xl font-bold">mail</span>
                     </div>
                      <h3 className="text-lg font-headline font-bold mb-2 text-on-surface">{dict.contact.association_email_title}</h3>
                     <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
                        {dict.contact.association_email_description}
                     </p>
                   </div>
                   <a 
                     href="mailto:bde-ceri@univ-avignon.fr"
                     className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/10 text-on-surface font-bold hover:scale-[1.02] active:scale-[0.98] transition-all text-xs"
                   >
                     <span>bde-ceri@univ-avignon.fr</span>
                     <span className="material-symbols-outlined text-sm">mail</span>
                   </a>
                 </div>

                 {/* LinkedIn Card */}
                 <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 bg-surface-container-low hover:bg-surface-container-high transition-all flex flex-col justify-between group/card relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover/card:bg-primary/10 transition-all"></div>
                   <div>
                     <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-[#0A66C2] mb-4">
                       <span className="material-symbols-outlined text-2xl font-bold">work</span>
                     </div>
                      <h3 className="text-lg font-headline font-bold mb-2 text-on-surface">{dict.contact.linkedin_title}</h3>
                     <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
                        {dict.contact.linkedin_description}
                     </p>
                   </div>
                   <a 
                     href="https://linkedin.com/company/bde-ceri" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/10 text-on-surface font-bold hover:scale-[1.02] active:scale-[0.98] transition-all text-xs"
                   >
                      <span>{dict.contact.linkedin_button}</span>
                     <span className="material-symbols-outlined text-sm">north_east</span>
                   </a>
                 </div>
               </div>
            </div>
          </div>

          {/* Right Column: Cards */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Quick Links Card */}
            <div className="glass-panel p-8 rounded-3xl border border-tertiary/20 bg-tertiary/5 shadow-xl relative overflow-hidden group">
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-tertiary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-tertiary/20 transition-all"></div>
               <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">bolt</span>
                   {dict.contact.quick_help}
               </h2>
               <div className="space-y-4">
                  <Link href="/faq" className="flex items-center justify-between p-4 rounded-xl bg-surface-container-high/40 hover:bg-surface-container-high transition-colors">
                      <span className="text-sm">{dict.contact.faq_link}</span>
                     <span className="material-symbols-outlined text-sm">north_east</span>
                  </Link>
                  <a href={helloassoUrl} target="_blank" className="flex items-center justify-between p-4 rounded-xl bg-surface-container-high/40 hover:bg-surface-container-high transition-colors">
                      <span className="text-sm">{dict.contact.helloasso_donation}</span>
                     <span className="material-symbols-outlined text-sm">favorite</span>
                  </a>
               </div>
            </div>

            {/* Local / Horaires Card */}
            <div className="glass-panel p-8 rounded-3xl border border-outline-variant/10 shadow-xl">
               <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">schedule</span>
                   {dict.contact.local_hours}
               </h2>
               <ul className="space-y-4">
                  <li className="flex justify-between text-xs">
                      <span className="text-on-surface-variant font-medium">{dict.contact.weekdays}</span>
                     <span className="text-on-surface font-bold text-success">12:30 — 13:45</span>
                  </li>
                  <li className="flex justify-between text-xs">
                      <span className="text-on-surface-variant font-medium">{dict.contact.lunch_break}</span>
                      <span className="text-on-surface font-bold">{dict.contact.open}</span>
                  </li>
               </ul>
               <p className="mt-6 text-[10px] text-on-surface-variant leading-relaxed italic border-t border-outline-variant/10 pt-4">
                   * {dict.contact.hours_note}
               </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
