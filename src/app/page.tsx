import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import HomeShowcase from "@/components/HomeShowcase";
import { getDictionary, getLang } from "@/locales/dictionaries";
import InteractiveBackground from "@/components/InteractiveBackground";
import { createSeoMetadata } from "@/utils/seo";

export const metadata = createSeoMetadata({
  path: "/",
  title: "Vie étudiante, événements et association",
  description: "Découvre le BDE CERI à Avignon : événements étudiants, projets, eSport, équipe et vie de campus.",
});

export default async function Home() {
  const [dict, lang] = await Promise.all([getDictionary(), getLang()]);
  const googleFormUrl = "https://forms.gle/placeholder";

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
              <a 
                href={googleFormUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-tertiary text-on-tertiary px-8 py-4 rounded-lg font-label font-bold tracking-wide hover:shadow-[0_0_20px_rgba(123,208,255,0.3)] transition-all transform hover:-translate-y-1 text-center"
              >
                {dict.home.join_us}
              </a>
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
                {/* Event Carousel Widget */}
                <div className="w-full max-w-md transform rotate-2 hover:rotate-0 transition-transform duration-700">
                    <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/20">
                         <div className="h-[400px] relative">
                             <Image 
                                src="/og-bde-ceri.jpg"
                                alt=""
                                fill
                                loading="lazy"
                                className="object-cover opacity-60"
                                sizes="400px"
                                suppressHydrationWarning
                             />
                             <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest to-transparent"></div>
                             <div className="absolute bottom-6 left-6 right-6">
                                 <span className="bg-tertiary text-on-tertiary text-[10px] font-bold px-2 py-0.5 rounded uppercase mb-2 inline-block">{dict.home.flash_event}</span>
                                <h3 className="text-xl font-headline font-bold text-white mb-1">{dict.home.discover_events}</h3>
                                <p className="text-xs text-white/70 line-clamp-2">{dict.home.description}</p>
                             </div>
                         </div>
                    </div>
                </div>
                
                <div className="absolute -left-12 top-1/4 w-64 p-6 glass-panel rounded-xl z-20 border border-outline-variant/15 shadow-[0_20px_40px_rgba(7,13,31,0.5)] transform -translate-x-4 hover:translate-x-0 transition-transform duration-500">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined">auto_awesome</span>
                    </div>
                    <div>
                       <p className="text-xs font-label text-on-surface-variant uppercase tracking-wider">{dict.home.next_experience}</p>
                      <p className="text-sm font-headline font-bold text-on-surface">Digital Horizons</p>
                    </div>
                  </div>
                   <p className="text-xs font-body text-on-surface-variant mb-4">{dict.home.featured_event_desc}</p>
                  <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary w-2/3 h-full rounded-full"></div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={<section aria-hidden="true" className="min-h-[28rem] bg-surface-container-lowest px-4 py-16 sm:px-6"><div className="mx-auto max-w-7xl"><div className="mx-auto mb-10 h-8 w-56 animate-pulse rounded-lg bg-surface-container-high"/><div className="h-72 animate-pulse rounded-2xl bg-surface-container-high sm:h-96"/></div></section>}>
        <HomeShowcase dict={dict} lang={lang} />
      </Suspense>
    </>
  );
}
