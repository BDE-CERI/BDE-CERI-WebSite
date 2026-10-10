"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Choice = "accepted" | "rejected" | null;

function BrookieIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className="h-7 w-7 shrink-0 drop-shadow-sm">
      <path d="M7 4h18a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z" fill="#7c3f25" />
      <path d="M6 11c4 0 4-5 9-5s5 5 11 5v10c0 2-1 3-3 3H9c-2 0-3-1-3-3V11Z" fill="#b86a3e" />
      <path d="M6 12c4 0 4-4 9-4s5 4 11 4" fill="none" stroke="#f0c69b" strokeLinecap="round" strokeWidth="2" />
      <circle cx="12" cy="15" r="1.5" fill="#442216" />
      <circle cx="21" cy="17" r="1.7" fill="#442216" />
      <circle cx="14" cy="22" r="1.4" fill="#442216" />
      <path d="M23 4h3a3 3 0 0 1 3 3v3c-2 0-3-1-4-2s-2-2-2-4Z" fill="var(--md-sys-color-surface-container-high, #20283b)" />
    </svg>
  );
}

export default function CookieConsent({ english: isEnglish = false }: { english?: boolean }) {
  const pathname = usePathname();
  const [choice, setChoice] = useState<Choice>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const bannerRef = useRef<HTMLElement>(null);
  const donationUrl = process.env.NEXT_PUBLIC_HELLOASSO_DONATION_URL ?? "";

  useEffect(() => {
    fetch("/api/cookie-consent", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { choice?: Choice }) => setChoice(data.choice ?? null))
      .catch(() => setChoice(null))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const openSettings = () => setChoice(null);
    window.addEventListener("bde:open-cookie-settings", openSettings);
    return () => window.removeEventListener("bde:open-cookie-settings", openSettings);
  }, []);

  useEffect(() => {
    if (choice !== "accepted") return;
    const record = () => {
      void fetch("/api/visitor/record", { method: "POST", credentials: "same-origin" }).catch(() => undefined);
    };
    record();
    const interval = window.setInterval(record, 60_000);
    return () => window.clearInterval(interval);
  }, [choice, pathname]);

  useEffect(() => {
    const root = document.documentElement;
    const banner = ready && choice === null ? bannerRef.current : null;
    if (!banner) {
      root.style.setProperty("--brookie-banner-height", "0px");
      return;
    }

    const updateHeight = () => root.style.setProperty("--brookie-banner-height", `${banner.getBoundingClientRect().height}px`);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(banner);
    return () => {
      observer.disconnect();
      root.style.setProperty("--brookie-banner-height", "0px");
    };
  }, [choice, ready]);

  async function saveChoice(nextChoice: "accepted" | "rejected") {
    setSaving(true);
    setSaveError(false);
    try {
      const response = await fetch("/api/cookie-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice: nextChoice }),
      });
      if (response.ok) {
        setChoice(nextChoice);
        window.dispatchEvent(new Event("bde:cookie-consent-saved"));
      } else setSaveError(true);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  if (!ready || choice !== null) return null;

  return (
    <aside
      ref={bannerRef}
      aria-label={isEnglish ? "Brookie preferences" : "Préférences de brookies"}
      className="fixed inset-x-3 bottom-[calc(6.25rem+env(safe-area-inset-bottom)+0.75rem)] z-100 mx-auto max-h-[calc(100dvh-11rem-env(safe-area-inset-bottom)-env(safe-area-inset-top))] max-w-3xl overflow-y-auto overscroll-contain rounded-2xl border border-outline-variant/30 bg-surface-container-high p-4 shadow-2xl md:inset-x-6 md:p-5 lg:bottom-5 lg:max-h-[calc(100dvh-2.5rem)]"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <BrookieIcon />
            <h2 className="font-headline text-base font-bold text-on-surface">
              {isEnglish ? "BDE Brookies" : "Les Brookies du BDE"}
            </h2>
            <span className="hidden rounded-full bg-tertiary/10 px-2 py-0.5 text-[10px] font-semibold text-tertiary sm:inline">
              {isEnglish ? "Digital treats" : "En informatique, on est gourmands"}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-on-surface-variant">
            {isEnglish
              ? "We have a sweet tooth in computing: essential brookies remember your preferences; optional analytics count visits and device types only if you agree."
              : "En informatique, on est gourmands : les brookies essentiels mémorisent vos préférences ; les statistiques facultatives comptent visites et appareils uniquement avec votre accord."}
            {" "}<a className="font-semibold underline underline-offset-2" href="/confidentialite">
              {isEnglish ? "Details" : "Détails"}
            </a>
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-on-surface-variant">
            <span><strong className="text-on-surface">{isEnglish ? "Essential · on" : "Essentiels · actifs"}</strong> — {isEnglish ? "language, choice and member sign-in" : "langue, choix et connexion membre"}</span>
            <span><strong className="text-on-surface">{isEnglish ? "Analytics · optional" : "Statistiques · facultatives"}</strong> — {isEnglish ? "daily IP hash, no raw IP stored" : "empreinte IP quotidienne, IP brute non conservée"}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 md:max-w-60 md:justify-end">
          <button
            disabled={saving}
            onClick={() => void saveChoice("rejected")}
            className="min-h-11 flex-1 whitespace-nowrap rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-on-primary transition hover:brightness-110 disabled:opacity-50"
          >
            {isEnglish ? "Reject analytics" : "Refuser les stats"}
          </button>
          <button
            disabled={saving}
            onClick={() => void saveChoice("accepted")}
            className="min-h-11 flex-1 whitespace-nowrap rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-on-primary transition hover:brightness-110 disabled:opacity-50"
          >
            {isEnglish ? "Accept analytics" : "Accepter les stats"}
          </button>
        </div>
      </div>

      {saveError && <p role="alert" className="mt-3 text-xs text-error">{isEnglish ? "Your choice could not be saved. Check your connection and try again." : "Votre choix n’a pas pu être enregistré. Vérifiez votre connexion puis réessayez."}</p>}

      {donationUrl && (
        <p className="mt-2 text-[11px] text-on-surface-variant">
          {isEnglish ? "Want to support the BDE? " : "Envie de soutenir le BDE ? "}
          <a href={donationUrl} target="_blank" rel="noopener noreferrer" onClick={() => void saveChoice("rejected")} className="font-semibold underline underline-offset-2">
            {isEnglish ? "Optional €1 donation via HelloAsso" : "Don facultatif de 1 € via HelloAsso"}
          </a>
          {isEnglish ? " — rejecting analytics is always free." : " — refuser les statistiques reste gratuit."}
        </p>
      )}
    </aside>
  );
}
