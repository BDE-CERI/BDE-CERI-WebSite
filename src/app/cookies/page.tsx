import type { Metadata } from "next";
import LegalCookieSettings from "@/components/LegalCookieSettings";
export const metadata: Metadata = { title: "Politique relative aux brookies", description: "Gérez vos préférences de brookies et de statistiques du BDE CERI.", alternates: { canonical: "/cookies" } };

export default function CookiesPolicy() {
  return <article className="mx-auto max-w-4xl px-6 py-20 text-on-surface">
    <p className="mb-3 text-sm font-bold uppercase tracking-widest text-tertiary">BDE CERI · préférences</p>
    <h1 className="mb-8 font-headline text-4xl font-bold">Brookies et statistiques</h1>
    <div className="space-y-6 leading-relaxed text-on-surface-variant">
      <section>
        <h2 className="mb-2 text-xl font-bold text-on-surface">Brookies essentiels</h2>
        <p>Ils restent actifs et ne servent pas à mesurer votre fréquentation. Ils mémorisent notamment la langue et votre choix de brookies, et permettent, si vous vous connectez, de sécuriser l’espace membre. Le brookie de préférence est conservé six mois.</p>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-bold text-on-surface">Statistiques facultatives</h2>
        <p>Elles ne sont activées qu’après votre accord. Elles servent à compter les visites uniques par adresse IP et par jour UTC, estimer les visiteurs actifs sur cinq minutes et produire des totaux par type d’appareil. Une empreinte HMAC quotidienne est utilisée pour dédupliquer les visites ; l’IP brute n’est pas enregistrée. Aucune statistique n’est envoyée si vous refusez.</p>
      </section>
      <p>Les statistiques restent limitées à la fréquentation du site : elles ne sont pas liées à une identité de membre, à un don ou à une future liste d’information. Toute enquête ou inscription à des communications futures sera proposée séparément, avec ses propres informations et choix. Vous pouvez changer votre préférence à tout moment ici ou depuis le pied de page. Les détails figurent dans la <a className="underline" href="/confidentialite">politique de confidentialité</a>.</p>
      <LegalCookieSettings />
    </div>
  </article>;
}
