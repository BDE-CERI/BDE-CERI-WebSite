import Link from "next/link";
import Image from "next/image";

export default function Footer({ dict }: { dict: any }) {
  return (
    <footer className="w-full py-12 border-t border-white/5 bg-[#070d1f] relative z-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8 max-w-7xl mx-auto">
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
            Facebook
          </Link>
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
        <div className="flex flex-col space-y-3 md:items-end">
          <span className="text-xs font-label uppercase tracking-widest text-[#dce1fb]/40 mb-2 md:text-right">{dict.footer.resources || 'Portal'}</span>
          <Link
            href="#"
            className="font-body text-xs tracking-wide text-[#dce1fb]/60 opacity-80 hover:opacity-100 hover:text-white transition-colors"
          >
            {dict.footer.download_app}
          </Link>
        </div>
      </div>
    </footer>
  );
}
