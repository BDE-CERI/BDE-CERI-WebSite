import Link from "next/link";
import { getLang } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import { createSeoMetadata } from "@/utils/seo";
import { getMembershipCheckoutUrl, getShopMembershipAccess } from "@/utils/shop-membership";

export const metadata = createSeoMetadata({
  path: "/adhesion",
  title: "Adhésion annuelle au BDE CERI",
  description: "Règle l’adhésion annuelle de 5 € au BDE CERI et accède à la boutique étudiante.",
});

export default async function MembershipPage() {
  const [lang, supabase] = await Promise.all([getLang(), createClient()]);
  const english = lang === "en";
  const membership = await getShopMembershipAccess(supabase);
  const checkoutUrl = getMembershipCheckoutUrl();

  return <main className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-surface px-4 py-16 sm:px-6">
    <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/3 size-96 -translate-x-1/2 rounded-full bg-tertiary/10 blur-[130px]" />
    <section className="relative z-10 w-full max-w-3xl rounded-3xl border border-tertiary/20 bg-surface-container-low p-6 shadow-2xl sm:p-10">
      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-tertiary/10 text-tertiary"><span aria-hidden="true" className="material-symbols-outlined text-3xl">card_membership</span></div>
      <p className="mt-5 text-center text-xs font-bold uppercase tracking-[.18em] text-tertiary">BDE CERI · Avignon</p>
      <h1 className="mt-2 text-center font-headline text-3xl font-bold text-on-surface sm:text-4xl">{english ? "Annual membership" : "Adhésion annuelle"}</h1>
      <p className="mt-3 text-center font-headline text-4xl font-bold text-tertiary">5 € <span className="text-base font-semibold text-on-surface-variant">/ {english ? "year" : "an"}</span></p>
      <p className="mx-auto mt-5 max-w-xl text-center text-sm leading-6 text-on-surface-variant">{english ? "Membership supports BDE CERI activities and is required to access the HelloAsso shop. Once your payment is confirmed by the team, the membership status on your profile will be updated." : "L’adhésion soutient les activités du BDE CERI et est nécessaire pour accéder à la boutique HelloAsso. Après confirmation du paiement par l’équipe, le statut d’adhésion de ton profil sera mis à jour."}</p>

      {membership.membershipPaid ? <div className="mt-7 rounded-2xl border border-success/25 bg-success/10 p-5 text-center"><span aria-hidden="true" className="material-symbols-outlined text-3xl text-success">verified</span><p className="mt-2 font-bold text-on-surface">{english ? "Your membership is marked as paid." : "Ton adhésion est indiquée comme réglée."}</p><Link href="/boutique" className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-tertiary px-5 py-2.5 text-sm font-bold text-on-tertiary">{english ? "Go to the shop" : "Accéder à la boutique"}<span aria-hidden="true" className="material-symbols-outlined text-lg">arrow_forward</span></Link></div> : <div className="mt-7 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 text-center">
        {checkoutUrl ? <>
          <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-tertiary px-6 py-3 text-sm font-bold text-on-tertiary transition hover:-translate-y-0.5 hover:shadow-lg"><span aria-hidden="true" className="material-symbols-outlined text-lg">open_in_new</span>{english ? "Pay membership on HelloAsso" : "Payer l’adhésion sur HelloAsso"}</a>
          <p className="mx-auto mt-4 max-w-xl text-xs leading-5 text-on-surface-variant">{english ? "Please use the same email address as your BDE CERI member account. The team will verify the payment before enabling shop access." : "Utilise si possible la même adresse e-mail que celle de ton compte membre BDE CERI. L’équipe vérifiera le paiement avant d’activer l’accès à la boutique."}</p>
        </> : <>
          <span aria-hidden="true" className="material-symbols-outlined text-3xl text-tertiary">hourglass_top</span>
          <p className="mt-2 font-bold text-on-surface">{english ? "The payment link is coming soon." : "Le lien de paiement sera ajouté prochainement."}</p>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">{english ? "The €5 annual membership information is ready. HelloAsso checkout will appear here once configured." : "Les informations de l’adhésion annuelle de 5 € sont disponibles. Le paiement HelloAsso s’affichera ici dès que son lien sera configuré."}</p>
        </>}
      </div>}

      {!membership.signedIn && <p className="mt-5 text-center text-sm text-on-surface-variant">{english ? "Already a member?" : "Tu as déjà un compte membre ?"} <Link href="/login" className="font-bold text-tertiary underline underline-offset-4">{english ? "Sign in" : "Connecte-toi"}</Link></p>}
      {membership.signedIn && !membership.memberProfileExists && <p className="mt-5 text-center text-sm leading-6 text-on-surface-variant">{english ? "Your account is not linked to a member profile. Contact the BDE to associate your membership." : "Ton compte n’est pas associé à un profil membre. Contacte le BDE pour rattacher ton adhésion."} <Link href="/contact" className="font-bold text-tertiary underline underline-offset-4">{english ? "Contact us" : "Nous contacter"}</Link></p>}
    </section>
  </main>;
}
