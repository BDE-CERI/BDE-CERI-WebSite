"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { setLanguage } from "@/locales/actions";
import { User } from "@supabase/supabase-js";
import { useTheme } from "@/context/ThemeContext";

interface MemberInfo {
  first_name: string;
  last_name: string;
  photo_url?: string;
  category?: string;
  role_label?: string;
}

export default function Header({
  dict,
  lang,
  user,
  member,
}: {
  dict: any;
  lang: string;
  user: User | null;
  member: MemberInfo | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const handleLanguageToggle = async () => {
    await setLanguage(lang === "fr" ? "en" : "fr");
    router.refresh();
  };

  const links = [
    { href: "/", label: dict.header.home },
    { href: "/poles", label: dict.header.poles },
    { href: "/evenement", label: dict.header.events },
    { href: "/equipe", label: dict.header.team },
    { href: "/boutique", label: dict.header.tavern },
    { href: "/contact", label: dict.header.contact },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/40 backdrop-blur-xl transition-all duration-300 ease-in-out hover:backdrop-blur-3xl shadow-2xl border-none">
      <div className="flex justify-between items-center px-4 md:px-8 h-20 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 text-2xl font-bold tracking-tighter text-[#bcc7de] font-headline group">
          <Image
            src="/logos/BDE-CERI-logo.png"
            alt="BDE CERI Logo"
            width={40}
            height={40}
            className="w-10 h-10 object-contain group-hover:scale-110 transition-transform"
          />
          <span className="hidden sm:block">BDE CERI</span>
        </Link>

        {/* Nav links */}
        <div className="hidden lg:flex space-x-8">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-headline tracking-tight text-sm uppercase transition-all duration-300 ease-in-out ${
                  isActive
                    ? "text-[#7bd0ff] font-bold border-b-2 border-[#7bd0ff] pb-1"
                    : "text-[#dce1fb] opacity-80 hover:opacity-100 hover:text-[#7bd0ff]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side: theme + lang + user/login */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-highest hover:bg-primary/20 transition-all text-on-surface"
            title={dict.theme?.[theme === 'dark' ? 'light' : 'dark'] || "Toggle Theme"}
          >
            <span className="material-symbols-outlined text-[20px]">
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={handleLanguageToggle}
            className="group relative w-10 h-10 flex items-center justify-center overflow-hidden rounded-full border border-outline-variant/20 hover:border-primary/50 transition-all shadow-lg"
            title="Switch Language"
          >
            <span className="text-xl transform group-hover:scale-120 transition-transform">
                {lang === "fr" ? "🇬🇧" : "🇫🇷"}
            </span>
          </button>

          {user && member ? (
            /* Avatar connecté → /profil */
            <Link
              href="/profil"
              className="flex items-center gap-2 group"
              title={`${member.first_name} ${member.last_name}`}
            >
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt={member.first_name}
                  className="w-9 h-9 rounded-full object-cover border-2 border-tertiary/40 group-hover:border-tertiary transition-colors"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/20 border-2 border-tertiary/40 group-hover:border-tertiary transition-colors flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">
                    {member.first_name[0]}{member.last_name?.[0] ?? ""}
                  </span>
                </div>
              )}
            </Link>
          ) : (
            /* Icône login si pas connecté */
            <Link
              href="/login"
              className="text-blue-200 hover:text-[#7bd0ff] transition-colors p-2 rounded-full hover:bg-surface-container-highest flex items-center justify-center"
              title="Espace BDE"
            >
              <span className="material-symbols-outlined">admin_panel_settings</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
