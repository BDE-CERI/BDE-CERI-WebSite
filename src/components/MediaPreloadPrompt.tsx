"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { EXPERIENCE_MEDIA_AUTO_KEY, EXPERIENCE_MEDIA_SEEN_KEY, type ExperienceMediaManifest } from "@/utils/experience-media";
import { preloadExperienceMedia, type ExperiencePreloadProgress } from "@/utils/preload-experience-media";

export default function MediaPreloadPrompt({ english: isEnglish = false }: { english?: boolean }) {
  const pathname = usePathname();
  const processedVersion = useRef<string | null>(null);
  const [manifest, setManifest] = useState<ExperienceMediaManifest | null>(null);
  const [open, setOpen] = useState(false);
  const [automatic, setAutomatic] = useState(false);
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState<ExperiencePreloadProgress | null>(null);
  const [finished, setFinished] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const currentPath = pathname?.replace(/\/+$/, "") || "/";

    const loadManifest = () => {
      void fetch("/api/experience-resources", { cache: "no-store" })
        .then(response => {
          if (!response.ok) throw new Error("Media manifest unavailable");
          return response.json() as Promise<ExperienceMediaManifest>;
        })
        .then(nextManifest => {
          if (!active) return;
          setManifest(nextManifest);
          const autoEnabled = localStorage.getItem(EXPERIENCE_MEDIA_AUTO_KEY) === "true";
          setAutomatic(autoEnabled);

          // The settings page has its own explicit preload control.
          if (currentPath === "/experience") {
            setOpen(false);
            return;
          }

          if (processedVersion.current === nextManifest.version) return;
          processedVersion.current = nextManifest.version;
          const wasSeen = localStorage.getItem(EXPERIENCE_MEDIA_SEEN_KEY);
          if (wasSeen !== nextManifest.version) {
            setOpen(true);
            if (wasSeen && autoEnabled) {
              setStarted(true);
              void preloadExperienceMedia(nextManifest.resources, setProgress).then(() => {
                if (!active) return;
                localStorage.setItem(EXPERIENCE_MEDIA_SEEN_KEY, nextManifest.version);
                setFinished(true);
              });
            }
          }
        })
        .catch(() => { if (active) setLoadFailed(true); });
    };

    // Preloading public images is an explicit browser-cache action and does
    // not depend on optional analytics consent.
    loadManifest();

    return () => { active = false; };
  }, [pathname]);

  const rememberVersion = () => {
    if (manifest) localStorage.setItem(EXPERIENCE_MEDIA_SEEN_KEY, manifest.version);
    setOpen(false);
  };

  const startPreload = () => {
    if (!manifest || started) return;
    setStarted(true);
    void preloadExperienceMedia(manifest.resources, setProgress).then(() => {
      localStorage.setItem(EXPERIENCE_MEDIA_SEEN_KEY, manifest.version);
      setFinished(true);
    });
  };

  const currentPath = pathname?.replace(/\/+$/, "") || "/";
  if (!open || !manifest || loadFailed || currentPath === "/experience") return null;

  const title = isEnglish ? "Make your visit smoother" : "Rendre la visite plus fluide";
  const description = isEnglish
    ? `Preload ${manifest.resources.length} public images used by events, news, teams and profiles. They will be kept in your browser’s image cache.`
    : `Précharge ${manifest.resources.length} images publiques utilisées pour les événements, actualités, pôles et profils. Elles seront conservées dans le cache d’images de votre navigateur.`;

  return (
    <aside
      aria-labelledby="media-preload-title"
      className="fixed inset-x-3 bottom-[calc(var(--brookie-banner-height,0px)+1.25rem)] z-99 mx-auto max-w-3xl rounded-2xl border border-tertiary/25 bg-surface-container-high p-3 text-on-surface shadow-2xl sm:inset-x-6 sm:p-4 md:bottom-[calc(var(--brookie-banner-height,0px)+2.25rem)]"
    >
      <div className="flex items-start gap-3 sm:items-center">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-tertiary/10 text-tertiary">
          <span aria-hidden="true" className="material-symbols-outlined text-xl">bolt</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <h2 id="media-preload-title" className="text-sm font-bold">{title}</h2>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-tertiary">
              {isEnglish ? "Smoother browsing" : "Expérience · Fluidité"}
            </span>
          </div>
          <p className="mt-0.5 text-xs leading-5 text-on-surface-variant">
            {started
              ? (finished ? (isEnglish ? "Preloading complete." : "Préchargement terminé.") : (isEnglish ? "Loading images…" : "Chargement des images…"))
              : description}
            {automatic && !started && <span> {isEnglish ? "Automatic preloading is enabled." : "Le préchargement automatique est activé."}</span>}
          </p>
          {started && (
            <div className="mt-2" aria-live="polite">
              <div className="mb-1 flex justify-between text-[10px] text-on-surface-variant">
                <span>{progress?.loaded ?? 0} {isEnglish ? "loaded" : "chargées"}</span>
                <span>{progress?.completed ?? 0}/{progress?.total ?? manifest.resources.length}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
                <div className="h-full rounded-full bg-tertiary transition-[width] duration-300" style={{ width: `${progress?.total ? Math.round((progress.completed / progress.total) * 100) : finished ? 100 : 0}%` }} />
              </div>
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
          {!started && <button type="button" onClick={rememberVersion} className="rounded-lg px-2.5 py-2 text-[11px] font-semibold text-on-surface-variant hover:bg-surface-container-highest">{isEnglish ? "Later" : "Plus tard"}</button>}
          {!started && <button type="button" onClick={startPreload} className="rounded-lg bg-tertiary px-3 py-2 text-[11px] font-bold text-on-tertiary hover:brightness-110">{isEnglish ? "Preload" : "Précharger"}</button>}
          {started && !finished && <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-2.5 py-2 text-[11px] font-semibold text-on-surface-variant hover:bg-surface-container-highest">{isEnglish ? "In background" : "En arrière-plan"}</button>}
          {started && finished && <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-tertiary px-3 py-2 text-[11px] font-bold text-on-tertiary">{isEnglish ? "Close" : "Fermer"}</button>}
        </div>
      </div>
    </aside>
  );
}
