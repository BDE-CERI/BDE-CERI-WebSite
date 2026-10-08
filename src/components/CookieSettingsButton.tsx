"use client";

export default function CookieSettingsButton({ children }: { children: React.ReactNode }) {
  return <button type="button" onClick={() => window.dispatchEvent(new Event("bde:open-cookie-settings"))} className="text-left font-body text-xs tracking-wide text-[#dce1fb]/60 opacity-80 hover:opacity-100 hover:text-white transition-colors">{children}</button>;
}
