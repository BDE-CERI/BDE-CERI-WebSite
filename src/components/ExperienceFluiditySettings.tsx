"use client";

import { useEffect, useState } from "react";
import { EXPERIENCE_MEDIA_AUTO_KEY, EXPERIENCE_MEDIA_SEEN_KEY, type ExperienceMediaManifest, type ExperienceMediaSection } from "@/utils/experience-media";
import { preloadExperienceMedia, type ExperiencePreloadProgress } from "@/utils/preload-experience-media";

const sectionNames: Record<ExperienceMediaSection, { fr: string; en: string }> = {
  brand: { fr: "Identité du BDE", en: "BDE branding" },
  events: { fr: "Événements", en: "Events" },
  news: { fr: "Actualités", en: "News" },
  teams: { fr: "Pôles", en: "Teams" },
  members: { fr: "Profils des membres", en: "Member profiles" },
};

export default function ExperienceFluiditySettings({ english = false }: { english?: boolean }) {
  const [manifest, setManifest] = useState<ExperienceMediaManifest | null>(null);
  const [automatic, setAutomatic] = useState(false);
  const [progress, setProgress] = useState<ExperiencePreloadProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const preferenceFrame = window.requestAnimationFrame(() => {
      if (active) setAutomatic(localStorage.getItem(EXPERIENCE_MEDIA_AUTO_KEY) === "true");
    });
    void fetch("/api/experience-resources", { cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error("Manifest unavailable");
        return response.json() as Promise<ExperienceMediaManifest>;
      })
      .then(data => { if (active) setManifest(data); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      window.cancelAnimationFrame(preferenceFrame);
    };
  }, []);

  const toggleAutomatic = () => {
    const next = !automatic;
    setAutomatic(next);
    localStorage.setItem(EXPERIENCE_MEDIA_AUTO_KEY, String(next));
  };

  const startPreload = () => {
    if (!manifest || progress) return;
    void preloadExperienceMedia(manifest.resources, setProgress).then(() => {
      localStorage.setItem(EXPERIENCE_MEDIA_SEEN_KEY, manifest.version);
    });
  };

  const groups = manifest?.resources.reduce<Record<string, number>>((counts, resource) => {
    counts[resource.section] = (counts[resource.section] ?? 0) + 1;
    return counts;
  }, {}) ?? {};
  const finished = Boolean(progress && progress.completed === progress.total);

  return (
    <section aria-labelledby="fluidity-title" className="rounded-3xl border border-tertiary/20 bg-surface-container-low p-6 shadow-xl sm:p-8">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-tertiary/10 text-tertiary">
        <span aria-hidden="true" className="material-symbols-outlined text-2xl">speed</span>
      </div>
      <h2 id="fluidity-title" className="mt-5 font-headline text-2xl font-bold text-on-surface">{english ? "Fluidity" : "Fluidité"}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
        {english
          ? "Preload public images used across the site into your browser’s image cache. This can make later visits feel faster; it uses your connection and may use device memory while the site is open."
          : "Préchargez les images publiques du site dans le cache d’images du navigateur. Elles pourront s’afficher plus vite lors de votre navigation ; cela utilise votre connexion et un peu de mémoire pendant que le site est ouvert."}
      </p>

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-high/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="max-w-2xl">
          <h3 className="text-sm font-bold text-on-surface">{english ? "Automatic preloading" : "Préchargement automatique"}</h3>
          <p className="mt-1 text-xs leading-5 text-on-surface-variant">
            {english ? "When new heavy images are added to the site, preload them on your next visit." : "Lorsqu’une nouvelle série d’images lourdes est ajoutée au site, la précharger automatiquement à votre prochaine visite."}
          </p>
        </div>
        <button type="button" role="switch" aria-checked={automatic} onClick={toggleAutomatic} className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition-colors ${automatic ? "bg-tertiary" : "bg-surface-container-highest"}`}>
          <span className={`size-6 rounded-full bg-white shadow transition-transform ${automatic ? "translate-x-6" : "translate-x-0"}`} />
          <span className="sr-only">{english ? "Automatically preload new images" : "Précharger automatiquement les nouvelles images"}</span>
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-outline-variant/20 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-on-surface">{english ? "Images available to preload" : "Images disponibles au préchargement"}</h3>
            <p className="mt-1 text-xs text-on-surface-variant" role="status">
              {loading
                ? (english ? "Checking for available images…" : "Recherche des images disponibles…")
                : error
                  ? (english ? "The image list could not be loaded." : "La liste des images n’a pas pu être chargée.")
                  : `${manifest?.resources.length ?? 0} ${english ? "images detected" : "images détectées"}`}
            </p>
          </div>
          <button type="button" disabled={loading || error || !manifest?.resources.length || Boolean(progress)} onClick={startPreload} className="min-h-11 shrink-0 rounded-xl bg-tertiary px-4 py-2 text-sm font-bold text-on-tertiary transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
            {finished ? (english ? "Preloading complete" : "Préchargement terminé") : progress ? (english ? "Preloading…" : "Préchargement…") : (english ? "Preload now" : "Précharger maintenant")}
          </button>
        </div>

        {manifest && manifest.resources.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {Object.entries(groups).map(([section, count]) => {
              const title = sectionNames[section as ExperienceMediaSection];
              return <li key={section} className="rounded-full bg-surface-container-high px-3 py-1.5 text-[11px] text-on-surface-variant">{english ? title.en : title.fr} · {count}</li>;
            })}
          </ul>
        )}

        {progress && (
          <div className="mt-5" aria-live="polite">
            <div className="mb-2 flex justify-between text-xs text-on-surface-variant">
              <span>{finished ? (english ? `Loaded ${progress.loaded}; unavailable ${progress.failed}` : `${progress.loaded} chargées ; ${progress.failed} indisponibles`) : (english ? "Loading into browser cache…" : "Chargement dans le cache du navigateur…")}</span>
              <span>{progress.completed}/{progress.total}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
              <div className="h-full rounded-full bg-tertiary transition-[width] duration-300" style={{ width: `${progress.total ? Math.round(progress.completed / progress.total * 100) : 100}%` }} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
