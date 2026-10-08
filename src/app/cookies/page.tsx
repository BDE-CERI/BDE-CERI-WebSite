import type { Metadata } from "next";
import LegalCookieSettings from "@/components/LegalCookieSettings";
export const metadata: Metadata = { title: "Politique relative aux cookies", description: "Gérez votre consentement aux cookies de statistiques du BDE CERI.", alternates: { canonical: "/cookies" } };

export default function CookiesPolicy() {
  return <article className="mx-auto max-w-4xl px-6 py-20 text-on-surface">
    <p className="mb-3 text-sm font-bold uppercase tracking-widest text-tertiary">BDE CERI · préférences</p>
    <h1 className="mb-8 font-headline text-4xl font-bold">Cookies et statistiques</h1>
    <div className="space-y-6 leading-relaxed text-on-surface-variant">
      <p>Le site utilise un cookie technique nécessaire pour mémoriser votre choix relatif aux statistiques. Il est conservé six mois. Si vous acceptez, les visites sont comptées à l’aide d’une empreinte HMAC IP/date quotidienne et d’une catégorie d’appareil. L’IP brute n’est pas enregistrée. Le comptage sert au suivi de la fréquentation du site par l’association.</p>
      <p>Aucun comptage de fréquentation n’est lancé si vous refusez ou n’avez pas fait de choix. Vous pouvez modifier votre choix à tout moment ici ou depuis le lien de gestion en pied de page. Les détails figurent dans la <a className="underline" href="/confidentialite">politique de confidentialité</a>.</p>
      <LegalCookieSettings />
    </div>
  </article>;
}
