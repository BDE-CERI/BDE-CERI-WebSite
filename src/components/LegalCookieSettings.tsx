"use client";

export default function LegalCookieSettings() {
  return <button type="button" onClick={() => window.dispatchEvent(new Event("bde:open-cookie-settings"))} className="rounded-xl border border-outline-variant/30 px-4 py-2 text-sm font-semibold hover:bg-surface-container-high">Ouvrir les préférences Brookies</button>;
}
