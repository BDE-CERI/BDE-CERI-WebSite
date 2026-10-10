"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { setLanguage } from "@/locales/actions";
import type { getDictionary } from "@/locales/dictionaries";
import type { User } from "@supabase/supabase-js";
import { useTheme } from "@/context/ThemeContext";
import MobileNavigation, { type NavigationLink } from "./MobileNavigation";

interface MemberInfo {
  first_name: string;
  last_name: string;
  photo_url?: string | null;
  category?: string;
  role_label?: string;
}

export default function Header({ dict, lang, user, member }: {
  dict: Awaited<ReturnType<typeof getDictionary>>;
  lang: string;
  user: User | null;
  member: MemberInfo | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const languageBusy = useRef(false);
  const [languagePending, setLanguagePending] = useState(false);
  const [languageError, setLanguageError] = useState("");

  const handleLanguageToggle = async () => {
    if (languageBusy.current) return;
    languageBusy.current = true;
    setLanguagePending(true);
    setLanguageError("");
    const nextLang = lang === "fr" ? "en" : "fr";
    try {
      await setLanguage(nextLang);
      document.documentElement.lang = nextLang;
      router.refresh();
    } catch (error) {
      setLanguageError(lang === "en" ? "The language could not be changed. Please try again." : "La langue n’a pas pu être changée. Réessayez.");
      throw error;
    } finally {
      languageBusy.current = false;
      setLanguagePending(false);
    }
  };

  const links: NavigationLink[] = [
    { href: "/", label: dict.header.home, icon: "home", description: dict.header.home_description },
    { href: "/evenement", label: dict.header.events, icon: "event", description: dict.header.events_description },
    { href: "/boutique", label: dict.header.tavern, icon: "storefront", description: dict.header.shop_description },
    { href: "/poles", label: dict.header.poles, icon: "hub", description: dict.header.poles_description },
    { href: "/esport", label: "eSport", icon: "sports_esports", description: dict.header.esport_description },
    { href: "/equipe", label: dict.header.team, icon: "groups", description: dict.header.team_description },
    { href: "/contact", label: dict.header.contact, icon: "forum", description: dict.header.contact_description },
  ];
  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  const signedIn = !!user && !!member;
  const accountName = member ? [member.first_name, member.last_name].filter(Boolean).join(" ") : "";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-outline-variant/15 bg-surface pt-[env(safe-area-inset-top)] shadow-md lg:bg-surface/85 lg:shadow-lg lg:backdrop-blur-xl lg:pt-0">
      <nav aria-label={lang === "en" ? "Main navigation" : "Navigation principale"} className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label={lang === "en" ? "BDE CERI — Home" : "BDE CERI — Accueil"} className="group flex shrink-0 items-center gap-2 font-headline text-lg font-bold tracking-tight text-on-surface outline-offset-4 sm:gap-3 sm:text-xl">
          <Image src="/logos/BDE-CERI-logo.png" alt="" width={40} height={40} className="size-10 object-contain transition-transform motion-reduce:transition-none group-hover:scale-105" />
          <span>BDE CERI</span>
        </Link>

        <div className="hidden min-w-0 items-center gap-4 lg:flex xl:gap-6">
          {links.map(link => (
            <Link key={link.href} href={link.href} aria-current={isActive(link.href) ? "page" : undefined}
              className={"whitespace-nowrap border-b-2 py-2 font-headline text-xs font-semibold transition-colors xl:text-sm " +
                (isActive(link.href) ? "border-tertiary text-tertiary" : "border-transparent text-on-surface-variant hover:text-tertiary")}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:gap-2.5">
          <div className="hidden items-center gap-2 lg:flex">
            <button type="button" onClick={toggleTheme} aria-label={dict.theme[theme === "dark" ? "light" : "dark"]}
              title={dict.theme[theme === "dark" ? "light" : "dark"]} className="flex size-11 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface transition-colors hover:bg-surface-container-highest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary">
              <span aria-hidden="true" className="material-symbols-outlined text-xl">{theme === "dark" ? "light_mode" : "dark_mode"}</span>
            </button>
            <button type="button" onClick={() => void handleLanguageToggle().catch(() => undefined)} disabled={languagePending} aria-busy={languagePending}
              aria-label={dict.header.switch_language} title={dict.header.switch_language}
              className="flex size-11 items-center justify-center rounded-2xl border border-outline-variant/25 text-xs font-bold text-on-surface transition-colors hover:border-tertiary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary disabled:opacity-50">
              {languagePending ? <span aria-hidden="true" className="material-symbols-outlined animate-spin text-xl">progress_activity</span> : lang === "fr" ? "EN" : "FR"}
            </button>
          </div>

          {signedIn && member && <Link href="/profil" aria-label={(lang === "en" ? "My account — " : "Mon compte — ") + accountName}
            title={accountName} className="flex size-11 shrink-0 items-center justify-center rounded-2xl outline-offset-2 focus-visible:outline-2 focus-visible:outline-tertiary">
            {member.photo_url ? <Image src={member.photo_url} alt="" width={40} height={40} className="size-10 rounded-full border-2 border-tertiary/40 object-cover transition-colors hover:border-tertiary" />
              : <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full border-2 border-tertiary/40 bg-tertiary/10 text-sm font-bold text-tertiary">{member.first_name?.[0]}{member.last_name?.[0]}</span>}
          </Link>}

          <MobileNavigation links={links} pathname={pathname} lang={lang} theme={theme} onToggleTheme={toggleTheme} onToggleLanguage={handleLanguageToggle}
            member={member ? { first_name: member.first_name, last_name: member.last_name, photo_url: member.photo_url || undefined } : null} signedIn={signedIn} />
        </div>
      </nav>
      {languageError && <p role="alert" className="absolute right-4 top-full mt-2 max-w-xs rounded-xl border border-error/25 bg-surface-container-high p-3 text-xs text-error shadow-xl">{languageError}</p>}
    </header>
  );
}
