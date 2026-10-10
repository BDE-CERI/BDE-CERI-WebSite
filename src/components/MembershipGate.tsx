import Link from "next/link";

export default function MembershipGate({ english, signedIn, memberProfileExists }: { english: boolean; signedIn: boolean; memberProfileExists: boolean }) {
  const title = english ? "BDE membership required" : "Adhésion au BDE requise";
  const description = !signedIn
    ? english ? "Sign in with your BDE CERI account and pay the annual membership to access the shop." : "Connecte-toi avec ton compte BDE CERI et règle l’adhésion annuelle pour accéder à la boutique."
    : !memberProfileExists
      ? english ? "This account is not linked to a BDE CERI member profile. Contact the team to check your access." : "Ce compte n’est pas associé à un profil membre du BDE CERI. Contacte l’équipe pour vérifier ton accès."
      : english ? "The €5 annual membership must be recorded as paid before you can access the HelloAsso shop." : "L’adhésion annuelle de 5 € doit être validée sur ton profil avant de pouvoir accéder à la boutique HelloAsso.";

  return <main className="relative flex min-h-[65vh] items-center justify-center overflow-hidden px-4 py-16 sm:px-6">
    <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-tertiary/10 blur-[120px]" />
    <section className="relative z-10 w-full max-w-2xl rounded-3xl border border-tertiary/20 bg-surface-container-low p-7 text-center shadow-2xl sm:p-10">
      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-tertiary/10 text-tertiary"><span aria-hidden="true" className="material-symbols-outlined text-3xl">lock</span></div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[.18em] text-tertiary">BDE CERI · 5 € / an</p>
      <h1 className="mt-2 font-headline text-3xl font-bold text-on-surface">{title}</h1>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-on-surface-variant">{description}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/adhesion" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-tertiary px-5 py-3 text-sm font-bold text-on-tertiary transition hover:-translate-y-0.5 hover:shadow-lg">{english ? "Membership information and payment" : "Adhésion et paiement"}<span aria-hidden="true" className="material-symbols-outlined text-lg">arrow_forward</span></Link>
        {!signedIn && <Link href="/login" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-outline-variant/25 px-5 py-3 text-sm font-bold text-on-surface hover:bg-surface-container-high">{english ? "Sign in" : "Se connecter"}</Link>}
        {signedIn && !memberProfileExists && <Link href="/contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-outline-variant/25 px-5 py-3 text-sm font-bold text-on-surface hover:bg-surface-container-high">{english ? "Contact the BDE" : "Contacter le BDE"}</Link>}
      </div>
    </section>
  </main>;
}
