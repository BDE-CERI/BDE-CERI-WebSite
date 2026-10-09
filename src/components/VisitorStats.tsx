"use client";

import { useEffect, useId, useState } from "react";

type Stats = {
  totalVisitors: number;
  activeVisitors: number;
  activeWindowMinutes: number;
  deviceTotals: { device_type: string; visit_count: number }[];
  consentedOnly?: boolean;
};

function isStats(value: unknown): value is Stats {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<Stats>;
  return typeof data.totalVisitors === "number" && Number.isFinite(data.totalVisitors)
    && typeof data.activeVisitors === "number" && Number.isFinite(data.activeVisitors)
    && typeof data.activeWindowMinutes === "number" && data.activeWindowMinutes > 0
    && Array.isArray(data.deviceTotals)
    && data.deviceTotals.every(device => typeof device.device_type === "string" && typeof device.visit_count === "number" && Number.isFinite(device.visit_count));
}

export default function VisitorStats({ english = false }: { english?: boolean }) {
  const l = (fr: string, en: string) => english ? en : fr;
  const titleId = useId();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    let sequence = 0;
    let controller: AbortController | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;
    let initialTask: ReturnType<typeof setTimeout> | null = null;

    const load = async () => {
      if (!mounted || document.visibilityState !== "visible") return;
      const request = ++sequence;
      controller?.abort();
      const currentController = new AbortController();
      controller = currentController;
      setRefreshing(true);
      try {
        const response = await fetch("/api/visitor/stats", { cache: "no-store", signal: currentController.signal });
        if (!response.ok) throw new Error("Stats unavailable");
        const data: unknown = await response.json();
        if (!isStats(data)) throw new Error("Unexpected stats response");
        if (!mounted || request !== sequence || currentController.signal.aborted) return;
        setStats(data);
        setError(false);
        setUpdatedAt(Date.now());
      } catch {
        if (mounted && request === sequence && !currentController.signal.aborted) setError(true);
      } finally {
        if (mounted && request === sequence && !currentController.signal.aborted) setRefreshing(false);
      }
    };
    const pause = () => {
      if (interval) clearInterval(interval);
      if (initialTask) clearTimeout(initialTask);
      interval = null;
      initialTask = null;
      sequence += 1;
      controller?.abort();
    };
    const resume = () => {
      if (!mounted || document.visibilityState !== "visible") return;
      initialTask = setTimeout(() => { initialTask = null; void load(); }, 0);
      interval = setInterval(() => void load(), 30_000);
    };
    const visibilityChanged = () => {
      pause();
      if (document.visibilityState === "visible") resume();
      else setRefreshing(false);
    };

    resume();
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => {
      mounted = false;
      pause();
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, [refreshKey]);

  const loading = !stats && !error;
  const number = (value: number) => value.toLocaleString(english ? "en-GB" : "fr-FR");
  const deviceInfo = (device: string) => {
    switch (device.toLowerCase()) {
      case "desktop": return { label: l("Ordinateurs", "Computers"), icon: "desktop_windows" };
      case "mobile": return { label: l("Téléphones", "Phones"), icon: "smartphone" };
      case "tablet": return { label: l("Tablettes", "Tablets"), icon: "tablet_mac" };
      default: return { label: l("Autres appareils", "Other devices"), icon: "devices_other" };
    }
  };

  return (
    <section aria-labelledby={titleId} aria-busy={loading} className="min-w-0 space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id={titleId} className="font-headline text-2xl font-bold">{l("Fréquentation", "Visitor statistics")}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{l("Suivez l'activité du site et les appareils utilisés.", "Track website activity and the devices visitors use.")}</p>
        </div>
        <button type="button" disabled={refreshing || loading} onClick={() => setRefreshKey(key => key + 1)} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm font-semibold transition hover:bg-surface-container-high disabled:cursor-wait disabled:opacity-60">
          <span aria-hidden="true" className={"material-symbols-outlined text-lg " + (refreshing ? "motion-safe:animate-spin" : "")}>{refreshing ? "progress_activity" : "refresh"}</span>
          {refreshing ? l("Actualisation…", "Refreshing…") : error ? l("Réessayer", "Retry") : l("Actualiser", "Refresh")}
        </button>
      </header>

      {error && <div role="alert" className="rounded-xl border border-error/25 bg-error/10 p-4 text-sm leading-6 text-error">{stats ? l("L'actualisation a échoué. Les derniers chiffres disponibles restent affichés ; vous pouvez réessayer.", "The refresh failed. The latest available figures are still shown; you can try again.") : l("Les statistiques sont indisponibles pour le moment. Réessayez dans quelques instants.", "Statistics are currently unavailable. Try again in a moment.")}</div>}

      {loading ? <div>
        <p role="status" className="sr-only">{l("Chargement des statistiques…", "Loading visitor statistics…")}</p>
        <div aria-hidden="true" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[0, 1].map(index => <div key={index} className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 motion-safe:animate-pulse"><div className="mb-5 h-4 w-3/4 rounded bg-surface-container-high" /><div className="h-10 w-24 rounded bg-surface-container-high" /><div className="mt-4 h-3 w-1/2 rounded bg-surface-container-high" /></div>)}
        </div>
      </div> : stats && <>
        <dl className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
            <dt className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant"><span aria-hidden="true" className="material-symbols-outlined text-primary">sensors</span>{l("Visiteurs actifs estimés", "Estimated active visitors")}</dt>
            <dd className="mt-3 break-all font-headline text-4xl font-bold tabular-nums text-primary">{number(stats.activeVisitors)}</dd>
            <dd className="mt-3 text-xs text-on-surface-variant">{l("Sur les ", "Over the last ")}{number(stats.activeWindowMinutes)}{l(" dernières minutes", " minutes")}</dd>
          </div>
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 sm:p-6">
            <dt className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant"><span aria-hidden="true" className="material-symbols-outlined text-tertiary">group</span>{l("Visites uniques cumulées", "Cumulative unique visits")}</dt>
            <dd className="mt-3 break-all font-headline text-4xl font-bold tabular-nums">{number(stats.totalVisitors)}</dd>
            <dd className="mt-3 text-xs text-on-surface-variant">{l("Depuis le lancement du suivi", "Since tracking began")}</dd>
          </div>
        </dl>

        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 sm:p-5">
          <h3 className="mb-4 font-headline text-base font-bold">{l("Appareils utilisés", "Devices used")}</h3>
          {stats.deviceTotals.length ? <dl className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
            {stats.deviceTotals.map(device => {
              const info = deviceInfo(device.device_type);
              return <div key={device.device_type} className="rounded-xl bg-surface-container-high/50 p-4"><dt className="flex items-center gap-2 text-xs text-on-surface-variant"><span aria-hidden="true" className="material-symbols-outlined text-lg">{info.icon}</span>{info.label}</dt><dd className="mt-2 break-all text-xl font-bold tabular-nums">{number(device.visit_count)}</dd></div>;
            })}
          </dl> : <p className="text-sm text-on-surface-variant">{l("Aucune visite comptabilisée pour le moment.", "No visits have been counted yet.")}</p>}
        </div>

        <div className="rounded-xl border border-outline-variant/15 px-4 py-3 text-xs leading-6 text-on-surface-variant">
          {stats.consentedOnly !== false && <p>{l("Seules les visites avec accord sont comptabilisées.", "Only visits with consent are counted.")}</p>}
          <p>{l("Le total additionne les visites uniques par adresse IP et par jour UTC : une même personne peut être comptée un autre jour, et plusieurs personnes sur le même réseau peuvent être regroupées.", "The total counts unique visits per IP address and UTC day: a person can be counted again on another day, and several people on the same network may be grouped together.")}</p>
          <p>{l("Les visiteurs actifs sont une estimation sur les ", "Active visitors are estimated over the last ")}{number(stats.activeWindowMinutes)}{l(" dernières minutes.", " minutes.")}</p>
        </div>
      </>}

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant">
        {updatedAt && <span>{l("Dernière mise à jour : ", "Last updated: ")}{new Intl.DateTimeFormat(english ? "en-GB" : "fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(updatedAt)}</span>}
        <span>{l("Actualisation automatique toutes les 30 s lorsque la page est visible.", "Refreshes automatically every 30 seconds while this page is visible.")}</span>
      </p>
    </section>
  );
}
