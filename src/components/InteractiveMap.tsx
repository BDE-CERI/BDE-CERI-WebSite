"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { saveContactMapLocation } from "@/app/contact/actions";

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

type Coordinates = [number, number];

function MapClickHandler({ enabled, onPositionChange }: { enabled: boolean; onPositionChange: (position: Coordinates) => void }) {
  useMapEvents({ click: event => { if (enabled) onPositionChange([event.latlng.lat, event.latlng.lng]); } });
  return null;
}

export default function InteractiveMap({ position: initialPosition, canEdit = false, english = false }: {
  position: Coordinates;
  canEdit?: boolean;
  english?: boolean;
}) {
  const [position, setPosition] = useState<Coordinates>(initialPosition);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [tilesUnavailable, setTilesUnavailable] = useState(false);
  const l = (fr: string, en: string) => english ? en : fr;

  useEffect(() => {
    if (tilesLoaded || tilesUnavailable) return;
    const timer = window.setTimeout(() => {
      setTilesUnavailable(true);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [tilesLoaded, tilesUnavailable]);

  const updateCoordinate = (index: 0 | 1, value: string) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return;
    setPosition(current => index === 0 ? [number, current[1]] : [current[0], number]);
  };

  const save = async () => {
    setPending(true);
    setMessage("");
    setError(false);
    const result = await saveContactMapLocation(position[0], position[1]);
    setPending(false);
    if ("error" in result) {
      setMessage(result.error);
      setError(true);
      return;
    }
    setEditing(false);
    setMessage(l("Emplacement enregistré.", "Location saved."));
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-outline-variant/20 shadow-2xl">
      <MapContainer
        center={initialPosition}
        zoom={16}
        scrollWheelZoom={false}
        className={editing ? "cursor-crosshair" : ""}
        // Keep the OpenStreetMap tiles in their native colors. Inverting the full
        // Leaflet canvas made parks and background areas look like a flat green map.
        style={{ height: "100%", width: "100%", backgroundColor: "#e5e7eb" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{ load: () => setTilesLoaded(true), tileload: () => setTilesLoaded(true) }}
        />
        <MapClickHandler enabled={editing} onPositionChange={setPosition} />
        <Marker
          position={position}
          draggable={editing}
          title={editing ? l("Glissez le repère jusqu’au local", "Drag the pin to the lounge") : "CERI"}
          eventHandlers={{ dragend: event => {
            const markerPosition = (event.target as L.Marker).getLatLng();
            setPosition([markerPosition.lat, markerPosition.lng]);
          } }}
        >
          {editing && <Tooltip permanent direction="top" offset={[0, -38]}>{l("Glissez le repère", "Drag the pin")}</Tooltip>}
          <Popup>
            <div className="p-2 font-body text-black">
              <strong className="mb-1 block text-sm text-primary">CERI — Laboratoire LIA</strong>
              <p className="text-[10px] leading-relaxed">339 Chemin des Meinajaries<br />84000 Avignon, France</p>
              <div className="mt-2 text-[10px] font-bold uppercase text-tertiary">{l("Local BDE au rez-de-chaussée", "BDE lounge on the ground floor")}</div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {tilesUnavailable && <div role="status" className="absolute bottom-3 right-3 z-1000 max-w-[min(22rem,95%)] rounded-xl border border-outline-variant/20 bg-surface-container-lowest/95 px-3 py-2 text-xs leading-5 text-on-surface shadow-lg backdrop-blur-sm">
        {l("Le fond de carte ne répond pas. Vérifiez votre connexion ; vous pouvez toujours saisir les coordonnées manuellement.", "Map tiles are unavailable. Check your connection; you can still enter the coordinates manually.")}
      </div>}

      {canEdit && <div className="absolute right-3 top-3 z-1000 w-[min(19rem,95%)] rounded-2xl border border-outline-variant/20 bg-surface-container-lowest/95 p-3 text-on-surface shadow-xl backdrop-blur-md sm:right-4 sm:top-4 sm:p-4">
        {!editing ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold">{l("Position du local", "Lounge location")}</p>
              <p className="mt-1 text-[10px] text-on-surface-variant">{position[0].toFixed(6)}, {position[1].toFixed(6)}</p>
            </div>
            <button type="button" onClick={() => { setMessage(""); setEditing(true); }} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg bg-tertiary px-3 py-2 text-xs font-bold text-on-tertiary hover:brightness-110">
              <span aria-hidden="true" className="material-symbols-outlined text-base">edit_location_alt</span>{l("Déplacer", "Move pin")}
            </button>
          </div>
        ) : <>
          <p className="text-xs font-bold">{l("Repositionner le local", "Reposition the lounge")}</p>
          <p className="mt-1 text-[11px] leading-4 text-on-surface-variant">{l("Faites glisser l’épingle jusqu’au local, ou cliquez directement sur la carte. Les coordonnées se mettent à jour automatiquement.", "Drag the pin to the lounge, or click directly on the map. The coordinates update automatically.")}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-[10px] font-semibold text-on-surface-variant">{l("Latitude", "Latitude")}
              <input type="number" min="-90" max="90" step="0.000001" value={position[0]} onChange={event => updateCoordinate(0, event.target.value)} className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface px-2 py-2 text-xs text-on-surface outline-none focus:border-tertiary" />
            </label>
            <label className="text-[10px] font-semibold text-on-surface-variant">{l("Longitude", "Longitude")}
              <input type="number" min="-180" max="180" step="0.000001" value={position[1]} onChange={event => updateCoordinate(1, event.target.value)} className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface px-2 py-2 text-xs text-on-surface outline-none focus:border-tertiary" />
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={pending} onClick={() => { setPosition(initialPosition); setEditing(false); setMessage(""); }} className="min-h-10 flex-1 rounded-lg border border-outline-variant/30 px-3 py-2 text-xs font-semibold disabled:opacity-50">{l("Annuler", "Cancel")}</button>
            <button type="button" disabled={pending} onClick={() => void save()} className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-tertiary px-3 py-2 text-xs font-bold text-on-tertiary disabled:opacity-50">
              <span aria-hidden="true" className="material-symbols-outlined text-base">{pending ? "progress_activity" : "save"}</span>{pending ? l("Enregistrement…", "Saving…") : l("Enregistrer", "Save")}
            </button>
          </div>
        </>}
      </div>}

      {message && <p role={error ? "alert" : "status"} className={"absolute bottom-3 left-3 z-1000 max-w-[calc(100%-1.5rem)] rounded-xl px-3 py-2 text-xs shadow-lg sm:bottom-4 sm:left-4 " + (error ? "bg-error text-on-error" : "bg-surface-container-lowest text-on-surface")}>{message}</p>}
    </div>
  );
}
