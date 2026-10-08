"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Choice = "accepted" | "rejected" | null;

export default function CookieConsent() {
  const pathname = usePathname();
  const [choice, setChoice] = useState<Choice>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [donationUrl, setDonationUrl] = useState("");
  const [isEnglish, setIsEnglish] = useState(false);

  useEffect(() => {
    setIsEnglish(document.documentElement.lang.startsWith("en"));
    fetch("/api/cookie-consent", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { choice?: Choice }) => setChoice(data.choice ?? null))
      .catch(() => setChoice(null))
      .finally(() => setReady(true));
    setDonationUrl(process.env.NEXT_PUBLIC_HELLOASSO_DONATION_URL ?? "");
  }, []);

  useEffect(() => {
    const openSettings = () => setChoice(null);
    window.addEventListener("bde:open-cookie-settings", openSettings);
    return () => window.removeEventListener("bde:open-cookie-settings", openSettings);
  }, []);

  useEffect(() => {
    if (choice !== "accepted") return;
    const record = () => {
      void fetch("/api/visitor/record", { method: "POST", credentials: "same-origin" });
    };
    record();
    const interval = window.setInterval(record, 60_000);
    return () => window.clearInterval(interval);
  }, [choice, pathname]);

  async function saveChoice(nextChoice: "accepted" | "rejected") {
    setSaving(true);
    try {
      const response = await fetch("/api/cookie-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice: nextChoice }),
      });
      if (response.ok) setChoice(nextChoice);
    } finally {
      setSaving(false);
    }
  }

  if (!ready || choice !== null) return null;

  return (
    <aside
      aria-label={isEnglish ? "Cookie preferences" : "Préférences de cookies"}
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-4xl rounded-2xl border border-outline-variant/30 bg-surface-container-high p-5 shadow-2xl md:inset-x-6 md:bottom-6 md:p-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h2 className="mb-1 text-base font-bold text-on-surface">{isEnglish ? "Cookies and analytics" : "Cookies et statistiques"}</h2>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            {isEnglish
              ? "With your permission, we use a daily pseudonymous fingerprint derived from your IP address and your device type to count visits. Your raw IP address is not stored. A necessary cookie remembers your choice."
              : "Avec votre accord, nous utilisons une empreinte quotidienne pseudonymisée dérivée de votre adresse IP et le type d’appareil pour compter les visites. Votre adresse IP brute n’est pas enregistrée. Un cookie nécessaire mémorise votre choix."}
            {" "}<a className="underline underline-offset-2" href="/confidentialite">{isEnglish ? "Learn more" : "En savoir plus"}</a>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button disabled={saving} onClick={() => void saveChoice("rejected")} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary hover:brightness-110 disabled:opacity-50">
            {isEnglish ? "Reject all" : "Tout refuser"}
          </button>
          <button disabled={saving} onClick={() => void saveChoice("accepted")} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary hover:brightness-110 disabled:opacity-50">
            {isEnglish ? "Accept analytics" : "Accepter les statistiques"}
          </button>
        </div>
      </div>
      {donationUrl ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a href={donationUrl} target="_blank" rel="noopener noreferrer" onClick={() => void saveChoice("rejected")} className="rounded-xl border border-outline-variant/40 px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-highest">
            {isEnglish ? "Reject and support us (€1)" : "Refuser et soutenir le BDE (1 €)"}
          </a>
          <span className="text-xs text-on-surface-variant">{isEnglish ? "The donation is optional and does not affect your choice." : "Le don est facultatif et ne conditionne pas votre choix."}</span>
        </div>
      ) : (
        <p className="mt-3 text-xs text-on-surface-variant">
          {isEnglish
            ? "A voluntary €1 donation link will appear once the HelloAsso checkout URL is configured. Rejecting analytics is free."
            : "Un lien de don facultatif de 1 € sera ajouté dès que l’URL de paiement HelloAsso sera configurée. Le refus des statistiques reste gratuit."}
        </p>
      )}
    </aside>
  );
}
