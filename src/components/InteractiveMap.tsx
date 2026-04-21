"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function InteractiveMap() {
  const [mounted, setMounted] = useState(false);
  const position: [number, number] = [43.9100, 4.8877]; // CERI Avignon

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return (
    <div className="w-full h-full bg-surface-container-high animate-pulse flex items-center justify-center">
        <span className="text-on-surface-variant font-label text-xs uppercase tracking-widest">Initialisation de la carte...</span>
    </div>
  );

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden glass-panel border border-outline-variant/20 shadow-2xl">
      <MapContainer 
        center={position} 
        zoom={16} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%", filter: "invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)" }} // Dark mode map filter
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            <div className="text-black font-body p-2">
              <strong className="block text-primary mb-1 text-sm">CERI — Laboratoire LIA</strong>
              <p className="text-[10px] leading-relaxed">
                339 Chemin des Meinajaries<br />
                84000 Avignon, France
              </p>
              <div className="mt-2 text-[10px] font-bold uppercase text-tertiary">Local BDE au rez-de-chaussée</div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
