import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Données personnelles, brookies, statistiques et droits des utilisateurs du site du BDE CERI Avignon.",
  alternates: { canonical: "/confidentialite" },
};

const sectionClass = "space-y-3";
const headingClass = "text-xl font-bold text-on-surface";
const linkClass = "text-tertiary underline underline-offset-4 hover:text-on-surface";

export default function PrivacyPolicy() {
  return <article className="mx-auto max-w-4xl px-6 py-16 text-on-surface sm:py-20">
    <p className="mb-3 text-sm font-bold uppercase tracking-widest text-tertiary">BDE CERI · données personnelles</p>
    <h1 className="mb-4 font-headline text-4xl font-bold">Politique de confidentialité</h1>
    <p className="mb-10 text-sm text-on-surface-variant">Dernière mise à jour : 10 octobre 2026.</p>

    <div className="space-y-9 leading-relaxed text-on-surface-variant">
      <section className={sectionClass}>
        <h2 className={headingClass}>1. Responsable du traitement et contact</h2>
        <p>Le responsable des traitements est l’association déclarée <strong className="text-on-surface">BDE CERI Avignon</strong> (dénomination publique au registre : « BDE CERI UAPV – Bureau des étudiants du Centre d’enseignement et de recherche informatique de l’Université d’Avignon et des Pays de Vaucluse »), RNA W842002612, SIREN 803 587 971, siège référencé publiquement au CERI, 339 chemin des Meinajaries, 84000 Avignon, France.</p>
        <p>Le président actuellement enregistré dans la base des membres est <strong className="text-on-surface">Quentin Garnier</strong>. Pour exercer vos droits ou poser une question sur vos données, écrivez à <a className={linkClass} href="mailto:bde-ceri@univ-avignon.fr">bde-ceri@univ-avignon.fr</a>. Les demandes sont à l’attention du bureau et suivies par la première vice-présidente, <strong className="text-on-surface">Flora</strong> (nom de famille masqué dans son profil), et la vice-présidente générale, <strong className="text-on-surface">Thaïs Esteban</strong>. Ces fonctions constituent les contacts du bureau pour les demandes relatives aux données ; elles ne signifient pas qu’un délégué à la protection des données (DPO) a été formellement désigné.</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>2. Données traitées et usages</h2>
        <ul className="list-disc space-y-4 pl-6 marker:text-tertiary">
          <li><strong className="text-on-surface">Comptes et espace membre :</strong> adresse électronique, identifiant d’authentification, nom, prénom, photo, niveau d’études, rôle, pôle, année de mandat, réseaux sociaux et informations de profil que le membre fournit. Ces données servent à gérer les comptes et l’adhésion à l’association, sécuriser l’accès, administrer le bureau et, si le profil est rendu visible, présenter les membres. Le traitement s’appuie selon le cas sur la gestion de la relation associative, les mesures précontractuelles demandées ou l’intérêt légitime à administrer et sécuriser les outils du BDE. Les champs affichés publiquement sont limités aux informations configurées comme visibles dans le profil.</li>
          <li><strong className="text-on-surface">Connexion Google et authentification renforcée :</strong> lors d’une connexion ou d’une liaison demandée par un membre, Google et Supabase Auth traitent les identifiants nécessaires à l’authentification, notamment l’identifiant du compte Google et les informations d’identité renvoyées par le fournisseur. Seuls les comptes membres déjà autorisés peuvent accéder au site ; la connexion Google ne crée pas de fiche membre et ne modifie pas les données métier du site. Les facteurs TOTP utilisés par les administrateurs servent à protéger les accès privilégiés.</li>
          <li><strong className="text-on-surface">Inscriptions aux événements :</strong> identifiant du membre, identifiant de l’événement, statut, date d’inscription et, pour les événements payants, tarif enregistré et lien de paiement. Ces données servent à gérer les places et l’organisation de l’événement. Les membres habilités du bureau peuvent consulter la liste des inscrits. Une inscription payante n’est pas une confirmation de paiement : le règlement a lieu sur HelloAsso et le BDE le vérifie séparément. Les journaux administratifs peuvent conserver l’historique d’inscription et de désinscription pour le suivi de l’événement ; ils ne sont pas publics.</li>
          <li><strong className="text-on-surface">Adhésion :</strong> le profil membre peut indiquer si la cotisation annuelle a été réglée. Cette information sert à gérer les droits et la vie associative et peut apparaître sous forme de badge sur un profil public visible. Les informations de paiement sont traitées par HelloAsso ; le site n’enregistre pas les coordonnées bancaires.</li>
          <li><strong className="text-on-surface">Statistiques facultatives :</strong> uniquement si vous les acceptez, le serveur utilise l’adresse IP publique reçue dans la requête pour calculer une empreinte HMAC associée à la date du jour en heure de Paris. Le type d’appareil (mobile, tablette ou ordinateur) est déduit de l’agent utilisateur ; la chaîne complète de l’agent utilisateur n’est pas enregistrée dans les compteurs. L’adresse IP brute n’est pas écrite dans les tables de statistiques du site. L’empreinte reste une donnée pseudonymisée, et non une donnée anonyme. Elle permet de limiter le comptage à une visite par adresse IP et par jour ; les personnes partageant une IP peuvent être regroupées et une même personne utilisant plusieurs IP peut être comptée plusieurs fois. Le tableau de bord réservé au bureau restitue le total cumulé, les appareils et les visiteurs actifs estimés sur une fenêtre de cinq minutes.</li>
          <li><strong className="text-on-surface">Recrutement :</strong> si vous ouvrez le formulaire de recrutement, les informations que vous y saisissez sont collectées directement par le formulaire Google indiqué. Elles ne sont pas stockées dans la base du site. Google traite ces données selon ses propres conditions et sa politique de confidentialité.</li>
          <li><strong className="text-on-surface">Sécurité et fonctionnement :</strong> l’hébergement peut traiter des données techniques comme l’adresse IP, la date et l’heure, la route demandée et des informations de diagnostic pour délivrer le site, prévenir les abus et assurer la sécurité. Ces journaux relèvent des systèmes des prestataires et suivent les paramètres et durées configurés pour le projet.</li>
        </ul>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>3. Brookies, stockage local et choix</h2>
        <p>Le brookie essentiel <code className="rounded bg-surface-container-high px-1.5 py-0.5 text-xs text-on-surface">bde_cookie_consent</code> mémorise votre choix « accepter » ou « refuser » pendant 180 jours. Il est configuré comme HTTP-only, sécurisé en production et limité au domaine du site. Il sert uniquement à appliquer votre choix concernant les statistiques.</p>
        <p>Les statistiques ne sont enregistrées qu’après une action positive d’acceptation. Le refus est gratuit, n’empêche pas l’accès au site et arrête les futurs enregistrements de statistiques. Vous pouvez modifier votre choix avec le lien « Gérer les brookies » du pied de page. Les statistiques déjà agrégées ne permettent pas d’identifier individuellement une personne et ne peuvent donc pas être retirées au cas par cas.</p>
        <p>Le réglage de préchargement des images est indépendant : le navigateur peut mémoriser la version des ressources déjà proposée et votre préférence de préchargement automatique dans son stockage local. Le préchargement lui-même place les ressources publiques dans le cache du navigateur ; il n’active pas de statistique facultative.</p>
        <p>La bannière peut également charger une carte OpenStreetMap, une diffusion Twitch ou l’iframe HelloAsso selon la page consultée. Ces contenus sont servis par des tiers qui peuvent recevoir des informations techniques de votre navigateur. Pour éviter ces requêtes, ne chargez pas ou n’ouvrez pas le contenu tiers concerné ; chaque fournisseur applique ses propres règles.</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>4. Fondements juridiques</h2>
        <p>Selon la fonction utilisée, les traitements reposent sur la gestion de la relation d’adhésion ou d’une demande d’inscription, l’intérêt légitime de l’association à organiser ses activités et protéger ses comptes, ou votre consentement pour les statistiques facultatives. Le consentement aux statistiques peut être retiré à tout moment pour l’avenir. Les données nécessaires au fonctionnement du compte ou à une inscription ne sont pas conditionnées à l’acceptation des statistiques.</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>5. Destinataires et prestataires</h2>
        <p>L’accès aux données de profil et d’inscription est limité aux membres du bureau habilités, dans la mesure nécessaire à leurs fonctions. Les prestataires techniques concernés sont notamment :</p>
        <ul className="list-disc space-y-2 pl-6 marker:text-tertiary">
          <li><strong className="text-on-surface">Vercel Inc.</strong> pour l’hébergement et la diffusion du site ; son siège publié est situé aux États-Unis.</li>
          <li><strong className="text-on-surface">Supabase</strong> pour la base de données, l’authentification et le stockage de fichiers. Le projet est hébergé dans la région choisie dans le tableau de bord Supabase. Cette région doit être vérifiée par l’association ; elle ne signifie pas à elle seule que tout traitement reste dans l’Union européenne.</li>
          <li><strong className="text-on-surface">HelloAsso</strong> pour la boutique, les dons, les adhésions et certains paiements. Le checkout est un service externe ; HelloAsso traite les informations de paiement et de commande selon ses propres documents.</li>
          <li><strong className="text-on-surface">Google</strong> pour OAuth et le formulaire externe de recrutement, uniquement lorsque vous utilisez ces fonctions.</li>
          <li><strong className="text-on-surface">OpenStreetMap et Twitch</strong> pour les cartes et les contenus eSport intégrés ou demandés par votre navigateur.</li>
        </ul>
        <p>Certains prestataires ou sous-traitants peuvent traiter des données hors de l’Espace économique européen, notamment aux États-Unis ou à Singapour. Les transferts éventuels sont encadrés par les engagements contractuels et garanties publiés par les fournisseurs (par exemple clauses contractuelles types lorsque requises). L’association doit vérifier la région de son projet Supabase, son accord de traitement et les sous-traitants actifs de ses comptes.</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>6. Durées de conservation</h2>
        <ul className="list-disc space-y-3 pl-6 marker:text-tertiary">
          <li>Le choix des brookies est conservé 180 jours, puis redemandé si nécessaire.</li>
          <li>Les données de compte et de profil sont conservées pendant la durée d’activité du compte ou de la relation associative, puis supprimées ou archivées avec un accès restreint lorsqu’une obligation ou la défense de droits le justifie.</li>
          <li>Les inscriptions actives sont conservées le temps de gérer l’événement et ses suites. Les journaux d’inscription sont conservés pour le suivi administratif et la gestion d’éventuelles contestations, puis doivent être supprimés ou anonymisés quand ils ne sont plus nécessaires. Le bureau doit documenter une durée opérationnelle de purge et la configurer dans la base.</li>
          <li>Les empreintes de statistiques sont quotidiennes et pseudonymisées. Elles sont supprimées lors du traitement d’une nouvelle journée selon la procédure de purge de la base ; les totaux agrégés par appareil et le compteur global sont conservés pour suivre l’évolution des visites. La bonne exécution de cette purge doit être vérifiée sur le projet Supabase.</li>
          <li>Les durées des journaux techniques dépendent des paramètres de rétention des prestataires d’hébergement et doivent être vérifiées dans les comptes Vercel et Supabase.</li>
        </ul>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>7. Vos droits</h2>
        <p>Dans les conditions prévues par le RGPD, vous pouvez demander l’accès à vos données, leur rectification, leur effacement, la limitation du traitement, et, lorsque le fondement juridique le permet, leur portabilité ou vous opposer au traitement. Vous pouvez retirer votre consentement aux statistiques à tout moment. Pour exercer un droit, écrivez à <a className={linkClass} href="mailto:bde-ceri@univ-avignon.fr">bde-ceri@univ-avignon.fr</a> en précisant votre demande ; des informations supplémentaires pourront être demandées pour vérifier votre identité.</p>
        <p>Une réponse est apportée dans le délai d’un mois, prolongeable dans les conditions prévues par le RGPD. Vous pouvez aussi déposer une réclamation auprès de la <a className={linkClass} href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer">CNIL</a>.</p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>8. Sécurité et évolution de la politique</h2>
        <p>L’association limite les accès administratifs aux personnes habilitées et met en œuvre des mesures techniques adaptées, notamment l’authentification renforcée pour les accès d’administration. Aucune transmission par Internet ni aucun stockage ne peut toutefois être garanti sans risque. Toute modification des traitements ou des prestataires peut entraîner une mise à jour de cette politique ; la date de dernière mise à jour figure en haut de page.</p>
      </section>

      <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
        <h2 className={headingClass}>Textes et ressources de référence</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 marker:text-tertiary">
          <li><a className={linkClass} href="https://www.cnil.fr/fr/conformite-rgpd-information-des-personnes-et-transparence" target="_blank" rel="noopener noreferrer">CNIL — Informer les personnes et assurer la transparence</a></li>
          <li><a className={linkClass} href="https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles" target="_blank" rel="noopener noreferrer">CNIL — Règles applicables aux cookies et autres traceurs</a></li>
          <li><a className={linkClass} href="https://supabase.com/legal/customer-resources/data-processing-addendum" target="_blank" rel="noopener noreferrer">Supabase — Addendum de traitement des données</a></li>
          <li><a className={linkClass} href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noopener noreferrer">Vercel — Notice de confidentialité</a></li>
        </ul>
      </section>
    </div>
  </article>;
}
