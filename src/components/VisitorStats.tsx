"use client";

import { useEffect, useState } from "react";

type Stats = {
  totalVisitors: number;
  activeVisitors: number;
  activeWindowMinutes: number;
  deviceTotals: { device_type: string; visit_count: number }[];
};

export default function VisitorStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    fetch("/api/visitor/stats", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("stats unavailable");
        return response.json() as Promise<Stats>;
      })
      .then(setStats)
      .catch(() => setError(true));
  }, []);

  return (
    <section className="glass-panel rounded-2xl border border-outline-variant/20 p-6">
      <h2 className="mb-4 flex items-center gap-2 font-headline text-xl font-bold">
        <span className="material-symbols-outlined text-primary">monitoring</span>
        Statistiques de fréquentation
      </h2>
      {stats ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-container-high p-4">
              <p className="text-xs text-on-surface-variant">Visiteurs actifs (5 dernières minutes)</p>
              <p className="mt-1 text-3xl font-bold">{stats.activeVisitors}</p>
            </div>
            <div className="rounded-xl bg-surface-container-high p-4">
              <p className="text-xs text-on-surface-variant">Visites uniques cumulées depuis le lancement</p>
              <p className="mt-1 text-3xl font-bold">{stats.totalVisitors.toLocaleString("fr-FR")}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-on-surface-variant">
            Seules les visites avec accord sont comptées. Le total additionne les visites uniques par adresse IP et par jour UTC : une même personne peut revenir dans le total un autre jour, tandis que plusieurs personnes sur le même réseau peuvent être regroupées. Les visiteurs actifs sont une estimation sur les 5 dernières minutes.
          </p>
          <ul className="mt-3 flex flex-wrap gap-4 text-xs text-on-surface-variant">
            {stats.deviceTotals.map(({ device_type, visit_count }) => (
              <li key={device_type}>{device_type}: {visit_count.toLocaleString("fr-FR")}</li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm text-on-surface-variant">{error ? "Statistiques non disponibles. Vérifiez la configuration Supabase." : "Chargement des statistiques…"}</p>
      )}
    </section>
  );
}
