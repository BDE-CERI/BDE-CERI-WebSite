"use client";

import { useEffect, useState } from "react";

export default function LoadingEstimate({ routeKey }: { routeKey: string }) {
  const [estimate, setEstimate] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const storageKey = `bde-loading-estimate:${routeKey}`;
    const startedAt = performance.now();
    let previousEstimate: number | null = null;

    try {
      const stored = Number(window.localStorage.getItem(storageKey));
      if (Number.isFinite(stored) && stored > 0) previousEstimate = stored;
    } catch {
      // Storage may be unavailable in private browsing; the loader still works.
    }

    setEstimate(previousEstimate);
    const visibilityTimer = window.setTimeout(() => setVisible(true), 350);

    return () => {
      window.clearTimeout(visibilityTimer);
      const duration = performance.now() - startedAt;
      if (duration < 100) return;

      const nextEstimate = previousEstimate === null
        ? duration
        : previousEstimate * 0.7 + duration * 0.3;

      try {
        window.localStorage.setItem(storageKey, String(nextEstimate));
      } catch {
        // Estimates are optional and remain local to this browser.
      }
    };
  }, [routeKey]);

  if (!visible) return null;

  const isEnglish = typeof document !== "undefined" && document.documentElement.lang === "en";
  const eta = estimate === null
    ? null
    : estimate < 1000
      ? `${Math.max(0.1, Math.round(estimate / 100) / 10)} s`
      : `${Math.max(1, Math.round(estimate / 1000))} s`;

  return (
    <p role="status" aria-live="polite" className="mb-6 text-xs text-on-surface-variant">
      {isEnglish ? "Loading page…" : "Chargement de la page…"}
      {eta && <span> {isEnglish ? `Estimated from recent loads: about ${eta}` : `Estimation d’après les chargements récents : environ ${eta}`}</span>}
    </p>
  );
}
