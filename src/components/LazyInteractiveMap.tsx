"use client";

import { useEffect, useState, type ComponentType } from "react";

type Coordinates = [number, number];
type InteractiveMapProps = { position: Coordinates; canEdit?: boolean; english?: boolean };

export default function LazyInteractiveMap({ position, canEdit = false, english = false }: InteractiveMapProps) {
  const [Map, setMap] = useState<ComponentType<InteractiveMapProps> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);

  // Load Leaflet as soon as the contact page is hydrated. Waiting for an
  // IntersectionObserver left the map placeholder visible indefinitely on
  // some mobile browsers and reduced-motion / embedded browser contexts.
  useEffect(() => {
    let active = true;
    import("@/components/InteractiveMap")
      .then(module => { if (active) setMap(() => module.default); })
      .catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [retry]);

  if (Map) return <Map key={`${position[0]}:${position[1]}`} position={position} canEdit={canEdit} english={english} />;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-surface-container-high px-6 text-center" role={loadError ? "alert" : "status"}>
      {loadError ? (
        <>
          <span className="material-symbols-outlined text-3xl text-tertiary" aria-hidden="true">map</span>
          <p className="max-w-sm text-sm text-on-surface-variant">
            {english ? "The map could not be loaded." : "La carte n’a pas pu être chargée."}
          </p>
          <button type="button" onClick={() => { setMap(null); setLoadError(false); setRetry(value => value + 1); }} className="rounded-lg bg-tertiary px-4 py-2 text-xs font-bold text-on-tertiary">
            {english ? "Try again" : "Réessayer"}
          </button>
        </>
      ) : (
        <>
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-tertiary/25 border-t-tertiary" aria-hidden="true" />
          <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant">
            {english ? "Loading map…" : "Chargement de la carte…"}
          </span>
        </>
      )}
    </div>
  );
}
