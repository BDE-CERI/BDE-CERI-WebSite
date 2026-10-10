import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  description: "Conditions des achats, adhésions, inscriptions payantes et dons proposés par le BDE CERI Avignon.",
  alternates: { canonical: "/cgv" },
};

const sectionClass = "space-y-3";
const headingClass = "text-xl font-bold text-on-surface";
const linkClass = "text-tertiary underline underline-offset-4 hover:text-on-surface";

export default function TermsOfSale() {
  return <article className="mx-auto max-w-4xl px-6 py-16 text-on-surface sm:py-20">
    <p className="mb-3 text-sm font-bold uppercase tracking-widest text-tertiary">BDE CERI · ventes et paiements</p>
    <h1 className="mb-4 font-headline text-4xl font-bold">Conditions générales de vente</h1>
    <p className="mb-10 text-sm text-on-surface-variant">Dernière mise à jour : 10 octobre 2026.</p>
    <div className="space-y-9 leading-relaxed text-on-surface-variant">
      <section className={sectionClass}>
        <h2 className={headingClass}>1. Vendeur et coordonnées</h2>
        <p>Le vendeur est l’association déclarée <strong className="text-on-surface">BDE CERI Avignon</strong> (dénomination publique au registre : « BDE CERI UAPV – Bureau des étudiants du Centre d’enseignement et de recherche informatique de l’Université d’Avignon et des Pays de Vaucluse »), RNA <strong className="text-on-surface">W842002612</strong>, SIREN <strong className="text-on-surface">803 587 971</strong>, siège référencé publiquement au CERI, 339 chemin des Meinajaries, 84000 Avignon, France. Le président enregistré dans la base des membres est <strong className="text-on-surface">Quentin Garnier</strong>. Contact : <a className={linkClass} href="mailto:bde-ceri@univ-avignon.fr">bde-ceri@univ-avignon.fr</a>.</p>
        <p>Les ventes présentées sur le site sont conclues sur le parcours de paiement HelloAsso associé à l’offre. L’association reste l’organisatrice ou le vendeur du produit indiqué ; HelloAsso fournit le parcours de collecte et de paiement selon ses propres conditions.</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>2. Offres, prix et commande</h2>
        <p>La description, les caractéristiques, le prix total, la disponibilité, les modalités de retrait ou de livraison et les éventuelles conditions particulières sont présentés sur la page de l’offre et dans le récapitulatif HelloAsso avant validation. Ces informations particulières complètent les présentes conditions et prévalent pour l’offre concernée en cas de précision spécifique.</p>
        <p>La commande est formée lorsque l’acheteur confirme le parcours sur HelloAsso et reçoit la confirmation correspondante. Le site du BDE n’enregistre pas les coordonnées bancaires. Un don facultatif ou une contribution proposée par HelloAsso est distinct du prix de l’article ; son caractère facultatif et son bénéficiaire doivent être indiqués dans le parcours avant paiement.</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>3. Paiement, retrait et livraison</h2>
        <p>Le paiement est traité par HelloAsso selon les moyens de paiement et conditions affichés lors de la commande. Les produits de la Taverne sont proposés au retrait au local du BDE lorsque l’offre l’indique. Les horaires sont des horaires possibles : le local peut être fermé si aucun membre responsable n’est présent. Les éventuels frais, délais, consignes et lieux de retrait ou de livraison sont précisés dans l’offre concernée.</p>
        <p>Si une commande ne peut être honorée, l’association contacte l’acheteur à partir des coordonnées fournies dans le parcours HelloAsso afin de convenir de la suite, notamment d’un remboursement lorsque celui-ci est dû.</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>4. Rétractation, conformité et réclamations</h2>
        <p>Lorsqu’un contrat est conclu à distance avec un consommateur, le droit de rétractation légal de quatorze jours s’applique dans les conditions prévues par le Code de la consommation. Le délai court, pour un bien, à compter de sa réception. Des exceptions légales existent notamment pour certains biens confectionnés selon les spécifications du consommateur, nettement personnalisés ou susceptibles de se détériorer rapidement. L’offre et les informations fournies avant la commande précisent les modalités adaptées au produit vendu.</p>
        <p>Pour exercer un droit de rétractation ou déposer une réclamation, écrivez à <a className={linkClass} href="mailto:bde-ceri@univ-avignon.fr">bde-ceri@univ-avignon.fr</a> en indiquant le numéro de commande et le produit concerné. L’association accusera réception et indiquera les modalités de retour applicables. Les garanties légales prévues par le droit de la consommation s’appliquent lorsque leurs conditions sont réunies.</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>5. Inscriptions payantes aux événements</h2>
        <p>Pour un événement payant, la page de l’événement indique le tarif et renvoie vers le checkout HelloAsso. Le site peut enregistrer une inscription avant ou pendant la redirection afin de gérer la liste des participants ; cet enregistrement n’atteste pas que le paiement a abouti. Le BDE vérifie le règlement dans HelloAsso. L’annulation de l’inscription sur le site ne déclenche pas automatiquement de remboursement : toute demande de remboursement doit être adressée au BDE et sera examinée selon l’offre de l’événement et les règles applicables.</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>6. Adhésions et dons</h2>
        <p>Le montant, la période, les avantages éventuels et les conditions de l’adhésion sont indiqués dans l’offre HelloAsso correspondante. Un don est volontaire et distinct d’une vente ou d’une adhésion. Le présent site ne garantit pas qu’un don ouvre droit à une réduction fiscale ; l’association ne délivre un reçu fiscal que si elle y est légalement habilitée et si les conditions sont remplies.</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>7. Médiation de la consommation</h2>
        <p>Lorsqu’une vente relève du champ de la médiation de la consommation, le consommateur peut saisir gratuitement le médiateur compétent après avoir adressé une réclamation écrite préalable à l’association. Les coordonnées du médiateur doivent être communiquées par le vendeur et figurer dans les conditions de vente. <strong className="text-on-surface">L’association doit confirmer si elle relève de cette obligation et, le cas échéant, renseigner ici le médiateur auquel elle a adhéré avant toute vente concernée.</strong></p>
      </section>

      <section className="rounded-2xl border border-tertiary/20 bg-tertiary/5 p-5">
        <h2 className={headingClass}>Information pratique</h2>
        <p className="mt-2">Le prix et les modalités affichés sur le checkout HelloAsso au moment de la commande sont à vérifier avant paiement. Pour toute question sur une commande, contactez l’association à l’adresse ci-dessus en joignant la confirmation HelloAsso.</p>
      </section>
    </div>
  </article>;
}
