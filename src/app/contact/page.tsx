import { getDictionary } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import InteractiveMap from "@/components/InteractiveMap";
import Link from "next/link";
import SharkWallpaper from "@/components/SharkWallpaper";

export default async function Contact() {
  const dict = await getDictionary();
  const supabase = await createClient();

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
            Connect with us
          </div>
          <h1 className="text-5xl md:text-7xl font-headline font-bold text-on-surface tracking-tight mb-8">
            Prenons <span className="text-tertiary">Contact</span>.
          </h1>
          <p className="max-w-2xl text-on-surface-variant text-lg leading-relaxed font-body">
            Une question sur un événement, un projet ou simplement envie de discuter ? Notre équipe est à votre écoute.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Form & Map */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Interactive Map */}
            <div className="reveal-card h-[400px] rounded-3xl relative overflow-hidden group">
               <InteractiveMap />
               <div className="absolute top-6 left-6 z-[1000] p-4 glass-panel rounded-2xl border border-tertiary/20 shadow-2xl max-w-xs group-hover:-translate-y-1 transition-transform">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-tertiary flex items-center justify-center text-on-tertiary">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                    </div>
                    <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Où nous trouver ?</h3>
                  </div>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    Local BDE au Rez-de-chaussée du CERI, Face au foyer.
                  </p>
               </div>
            </div>

            {/* Contact Form */}
            <div className="glass-panel p-10 rounded-3xl border border-outline-variant/10 shadow-xl">
               <h2 className="text-2xl font-headline font-bold mb-8">Envoyer un Message</h2>
               <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Nom / Prénom</label>
                    <input
                      className="w-full bg-surface-container-high border-0 border-b border-outline-variant/15 text-on-surface focus:ring-0 focus:border-tertiary transition-all px-4 py-4 rounded-xl"
                      placeholder="Jean Dupont"
                      type="text"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Email universitaire</label>
                    <input
                      className="w-full bg-surface-container-high border-0 border-b border-outline-variant/15 text-on-surface focus:ring-0 focus:border-tertiary transition-all px-4 py-4 rounded-xl"
                      placeholder="jeandupont@univ-avignon.fr"
                      type="email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Sujet</label>
                  <input
                    className="w-full bg-surface-container-high border-0 border-b border-outline-variant/15 text-on-surface focus:ring-0 focus:border-tertiary transition-all px-4 py-4 rounded-xl"
                    placeholder="Objet de votre demande"
                    type="text"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Message</label>
                  <textarea
                    className="w-full bg-surface-container-high border-0 border-b border-outline-variant/15 text-on-surface focus:ring-0 focus:border-tertiary transition-all px-4 py-4 rounded-xl min-h-[150px] resize-none"
                    placeholder="Votre message ici..."
                  ></textarea>
                </div>
                <button
                  className="bg-tertiary text-on-tertiary font-bold py-4 px-10 rounded-2xl hover:shadow-[0_0_20px_rgba(123,208,255,0.4)] transition-all hover:scale-[1.02] active:scale-95 w-full md:w-auto"
                  type="submit"
                >
                  Envoyer le message
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Cards */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Quick Links Card */}
            <div className="glass-panel p-8 rounded-3xl border border-tertiary/20 bg-tertiary/5 shadow-xl relative overflow-hidden group">
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-tertiary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-tertiary/20 transition-all"></div>
               <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">bolt</span>
                  Aide Rapide
               </h2>
               <div className="space-y-4">
                  <Link href="/faq" className="flex items-center justify-between p-4 rounded-xl bg-surface-container-high/40 hover:bg-surface-container-high transition-colors">
                     <span className="text-sm">Consulter le Forum / FAQ</span>
                     <span className="material-symbols-outlined text-sm">north_east</span>
                  </Link>
                  <a href={helloassoUrl} target="_blank" className="flex items-center justify-between p-4 rounded-xl bg-surface-container-high/40 hover:bg-surface-container-high transition-colors">
                     <span className="text-sm">Donation HelloAsso</span>
                     <span className="material-symbols-outlined text-sm">favorite</span>
                  </a>
               </div>
            </div>

            {/* Local / Horaires Card */}
            <div className="glass-panel p-8 rounded-3xl border border-outline-variant/10 shadow-xl">
               <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">schedule</span>
                  Disponibilité Local
               </h2>
               <ul className="space-y-4">
                  <li className="flex justify-between text-xs">
                     <span className="text-on-surface-variant font-medium">Lundi — Vendredi</span>
                     <span className="text-on-surface font-bold text-success">12:30 — 13:45</span>
                  </li>
                  <li className="flex justify-between text-xs">
                     <span className="text-on-surface-variant font-medium">Pause du midi</span>
                     <span className="text-on-surface font-bold">Ouvert</span>
                  </li>
               </ul>
               <p className="mt-6 text-[10px] text-on-surface-variant leading-relaxed italic border-t border-outline-variant/10 pt-4">
                  * Les horaires peuvent varier en fonction de la disponibilité des membres du bureau.
               </p>
            </div>

            {/* Follow Us Card */}
            <div className="glass-panel p-8 rounded-3xl border border-outline-variant/10 shadow-xl">
               <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">public</span>
                  Social Media
               </h2>
               <div className="flex gap-4">
                  <a href={instagramUrl} target="_blank" className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center hover:bg-tertiary hover:text-on-tertiary transition-all">
                     <span className="material-symbols-outlined">photo_camera</span>
                  </a>
                  <a href="#" className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all">
                     <span className="material-symbols-outlined">account_balance</span>
                  </a>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
