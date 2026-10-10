import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales d’utilisation",
  description: "Conditions d’accès et d’utilisation du site du BDE CERI Avignon.",
  alternates: { canonical: "/cgu" },
};

const sectionClass = "space-y-3";
const headingClass = "text-xl font-bold text-on-surface";
const linkClass = "text-tertiary underline underline-offset-4 hover:text-on-surface";

export default function TermsOfUse() {
  return <article className="mx-auto max-w-4xl px-6 py-16 text-on-surface sm:py-20">
    <p className="mb-3 text-sm font-bold uppercase tracking-widest text-tertiary">BDE CERI · informations juridiques</p>
    <h1 className="mb-4 font-headline text-4xl font-bold">Conditions générales d’utilisation</h1>
    <p className="mb-10 text-sm text-on-surface-variant">Dernière mise à jour : 10 octobre 2026.</p>
    <div className="space-y-9 leading-relaxed text-on-surface-variant">
      <section className={sectionClass}>
        <h2 className={headingClass}>1. Éditeur et hébergement</h2>
        <p>Le site est édité par l’association déclarée connue sous le nom <strong className="text-on-surface">BDE CERI Avignon</strong>, dont la dénomination publique au registre est « BDE CERI UAPV – Bureau des étudiants du Centre d’enseignement et de recherche informatique de l’Université d’Avignon et des Pays de Vaucluse ». Identifiants publics : RNA <strong className="text-on-surface">W842002612</strong> et SIREN <strong className="text-on-surface">803 587 971</strong>. Adresse du siège référencée publiquement : <strong className="text-on-surface">CERI, 339 chemin des Meinajaries, 84000 Avignon, France</strong>.</p>
        <p>Responsable de publication : <strong className="text-on-surface">Quentin Garnier</strong>, président de l’association selon le rôle actuellement enregistré dans la base des membres. Contact général et demandes juridiques : <a className={linkClass} href="mailto:bde-ceri@univ-avignon.fr">bde-ceri@univ-avignon.fr</a>.</p>
        <p>Hébergement et diffusion du site : <strong className="text-on-surface">Vercel Inc.</strong>, 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis. Les données d’authentification, de profils et de médias sont gérées par Supabase dans la région configurée par l’association ; voir la <a className={linkClass} href="/confidentialite">politique de confidentialité</a> pour les prestataires et traitements associés.</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>2. Objet et accès au site</h2>
        <p>Le site présente l’association, ses pôles, ses membres, ses actualités, ses événements et les services proposés aux étudiants. La consultation est gratuite, hors coûts d’accès à Internet et de télécommunication supportés par l’utilisateur. Certaines fonctions, notamment l’espace profil et l’inscription à un événement, nécessitent un compte membre autorisé.</p>
        <p>Le site ne permet pas l’inscription publique autonome. Une connexion avec Google sert uniquement à authentifier ou à lier le compte existant d’un membre autorisé. Elle ne crée pas de fiche membre et ne donne pas, à elle seule, accès aux fonctions d’administration.</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>3. Comptes et comportement des utilisateurs</h2>
        <p>L’utilisateur protège ses identifiants et informe l’association de toute utilisation suspecte de son compte. Il s’engage à utiliser le site conformément au droit français, à ne pas tenter de contourner les contrôles d’accès, de sécurité ou de capacité, et à ne pas publier ou transmettre de contenu illicite, trompeur, injurieux ou portant atteinte aux droits d’autrui.</p>
        <p>Les accès d’administration sont réservés aux membres habilités. L’association peut suspendre un accès en cas de risque pour la sécurité, de départ du bureau ou d’utilisation contraire aux présentes conditions.</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>4. Événements, inscriptions et contenus</h2>
        <p>Les informations d’un événement sont celles affichées sur sa page au moment de la consultation. Une inscription en ligne est enregistrée sur le site pour gérer les participants et les places. Pour un événement payant, le paiement est réalisé auprès de HelloAsso ; l’enregistrement de l’inscription sur le site ne vaut pas preuve de paiement. Les modalités d’annulation, de remboursement et d’accès sont celles indiquées pour l’événement et par le service de paiement.</p>
        <p>Les membres autorisés peuvent contribuer aux contenus conformément à leur rôle. L’association peut corriger, dépublier ou retirer un contenu qui est inexact, périmé, illicite ou contraire à l’objet du site.</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>5. Propriété intellectuelle</h2>
        <p>Les textes, photographies, illustrations, logos, interfaces et autres contenus du site sont protégés par les droits de propriété intellectuelle. Toute reproduction ou réutilisation substantielle nécessite l’autorisation préalable du titulaire des droits, sauf exception légale. Les marques et contenus de partenaires ou de services tiers restent la propriété de leurs titulaires.</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>6. Services et liens tiers</h2>
        <p>Le site peut afficher ou ouvrir des services tiers, notamment HelloAsso pour la boutique, les dons et certains paiements, Google pour l’authentification ou les formulaires de recrutement, Twitch pour des diffusions, et OpenStreetMap pour les cartes. Ces services sont soumis à leurs propres conditions et politiques de confidentialité. Le chargement d’un contenu tiers peut transmettre des données techniques directement au fournisseur concerné.</p>
        <p>L’association ne contrôle pas la disponibilité ni les contenus des sites externes. Un lien externe ne constitue pas une approbation générale de leur contenu.</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>7. Données personnelles et brookies</h2>
        <p>Les traitements de données, les destinataires, les durées et les droits des personnes sont décrits dans la <a className={linkClass} href="/confidentialite">politique de confidentialité</a>. Le choix relatif aux statistiques facultatives peut être modifié à tout moment via « Gérer les brookies » en bas de page. Refuser ces statistiques est gratuit et ne bloque pas la navigation. Le préchargement des images est une option distincte qui agit dans le cache du navigateur.</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>8. Disponibilité et responsabilité</h2>
        <p>L’association met en œuvre des moyens raisonnables pour maintenir le site accessible et à jour, sans garantir une disponibilité continue ou l’absence d’erreurs. L’accès peut être interrompu pour maintenance, sécurité ou contrainte technique. Chaque utilisateur reste responsable de son équipement, de sa connexion et des informations qu’il transmet.</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>9. Droit applicable</h2>
        <p>Les présentes conditions sont régies par le droit français. En cas de difficulté, les parties sont invitées à contacter d’abord l’association afin de rechercher une solution amiable, sans préjudice des droits impératifs de l’utilisateur et de sa possibilité de saisir la juridiction compétente.</p>
      </section>
    </div>
  </article>;
}
