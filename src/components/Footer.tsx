import Link from "next/link";
import Image from "next/image";
import CookieSettingsButton from "@/components/CookieSettingsButton";
import type { fr } from "@/locales/fr";

export default function Footer({ dict }: { dict: typeof fr }) {
  return (
    <footer className="w-full py-12 border-t border-white/5 bg-surface-container-lowest relative z-20">
      <div className="grid grid-cols-1 gap-8 px-8 max-w-7xl mx-auto sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-3">
            <Image 
              src="/logos/BDE-CERI-logo.png" 
              alt="BDE CERI Logo" 
              width={32} 
              height={32} 
              className="w-8 h-8 object-contain" 
              suppressHydrationWarning
            />
            <span className="text-lg font-bold text-[#bcc7de] font-headline">BDE CERI</span>
          </div>
          <span className="font-body text-xs tracking-wide text-[#dce1fb]/60">
            {dict.footer.crafted}
          </span>
        </div>
        <div className="flex flex-col space-y-3">
          <span className="text-xs font-label uppercase tracking-widest text-[#dce1fb]/40 mb-2">{dict.footer.connect}</span>
          <Link
            href="#"
            className="font-body text-xs tracking-wide text-[#dce1fb]/60 opacity-80 hover:opacity-100 hover:text-white transition-colors"
          >
            Instagram
          </Link>
          <Link
            href="#"
            className="font-body text-xs tracking-wide text-[#dce1fb]/60 opacity-80 hover:opacity-100 hover:text-white transition-colors"
          >
            LinkedIn
          </Link>
        </div>
        <div className="flex flex-col space-y-3">
          <span className="text-xs font-label uppercase tracking-widest text-[#dce1fb]/40 mb-2">{dict.footer.join}</span>
          <a href="https://discord.gg/bde-ceri" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-body text-xs tracking-wide text-[#dce1fb]/70 opacity-90 transition-colors hover:text-white hover:opacity-100">
            <span aria-hidden="true" className="material-symbols-outlined text-base text-[#5865F2]">forum</span>
            Discord
            <span className="sr-only">(ouvre un nouvel onglet)</span>
          </a>
        </div>
        <div className="flex flex-col space-y-3 lg:items-end">
          <span className="text-xs font-label uppercase tracking-widest text-[#dce1fb]/40 mb-2 lg:text-right">{dict.footer.resources || "Liens utiles"}</span>
          <Link href="/adhesion" className="font-body text-xs tracking-wide text-[#dce1fb]/60 hover:text-white transition-colors">{dict.footer.membership}</Link>
          <Link href="/cgu" className="font-body text-xs tracking-wide text-[#dce1fb]/60 hover:text-white transition-colors">{dict.footer.terms}</Link>
          <Link href="/cgv" className="font-body text-xs tracking-wide text-[#dce1fb]/60 hover:text-white transition-colors">{dict.footer.sales}</Link>
          <Link href="/confidentialite" className="font-body text-xs tracking-wide text-[#dce1fb]/60 hover:text-white transition-colors">{dict.footer.privacy}</Link>
          <Link href="/cookies" className="font-body text-xs tracking-wide text-[#dce1fb]/60 hover:text-white transition-colors">{dict.footer.cookies}</Link>
          <Link href="/experience" className="font-body text-xs tracking-wide text-[#dce1fb]/60 hover:text-white transition-colors">{dict.footer.experience}</Link>
          <CookieSettingsButton>{dict.footer.cookie_settings}</CookieSettingsButton>
        </div>
      </div>
    </footer>
  );
}
