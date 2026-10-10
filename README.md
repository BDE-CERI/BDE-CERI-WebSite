This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Windows ARM64 : chargement de SWC

Les commandes `npm run dev` et `npm run build` utilisent Webpack. Next.js peut ainsi utiliser son compilateur WebAssembly lorsque le module SWC natif ne se charge pas.

Si PowerShell refuse `npm.ps1`, lancez `npm.cmd run dev`.

Si `@next/swc-win32-arm64-msvc` est installé mais produit `ERR_DLOPEN_FAILED`, installez ou réparez le [Microsoft Visual C++ Redistributable ARM64](https://aka.ms/vc14/vc_redist.arm64.exe), puis fermez et rouvrez le terminal. Le runtime requis doit correspondre à l’architecture ARM64 de Node.js. [Documentation Microsoft](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist) et [guide Next.js SWC](https://nextjs.org/docs/messages/failed-loading-swc).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Cookies et statistiques de fréquentation

Le suivi de fréquentation est activé uniquement après consentement. Ajoutez ces variables à votre environnement local et à l’hébergement (ne publiez jamais les valeurs secrètes) :

- SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY) : clé serveur du projet Supabase, uniquement côté serveur.
- VISITOR_HASH_SECRET : secret aléatoire dédié (au moins 32 octets) utilisé pour produire les empreintes HMAC quotidiennes.
- NEXT_PUBLIC_HELLOASSO_DONATION_URL : lien direct vers le formulaire HelloAsso de don de 1 € (optionnel).

Appliquez ensuite supabase/migrations/202610080001_visitor_analytics.sql et supabase/migrations/202610090002_visitor_paris_timezone.sql au projet Supabase via les migrations du CLI ou l’éditeur SQL. Les statistiques se trouvent dans l’espace membre du bureau restreint. Voir aussi [le guide de dépannage des statistiques](docs/admin-notifications-and-stats.md).

Les coordonnées de l’éditeur et de l’hébergeur, les informations de conservation et les règles propres aux ventes HelloAsso dans les pages juridiques doivent être vérifiées et complétées avant publication définitive.


## Actualités : auteurs et anonymat

L’éditeur d’actualités permet de choisir la signature parmi les membres du bureau restreint et du bureau élargi (catégories `bureau_restreint` et `bureau`). Le compte connecté garde ses propres droits d’édition. L’option de publication au nom du BDE masque la signature publique et conserve l’auteur choisi dans l’administration.

Pour corriger l’erreur « Could not find the is_anonymous column of news in the schema cache », appliquez [202610090001_news_anonymity.sql](supabase/migrations/202610090001_news_anonymity.sql) au projet Supabase : ouvrez **SQL Editor**, créez une requête, collez le contenu du fichier et cliquez sur **Run**. Cette migration est idempotente, ajoute la colonne manquante et recharge le cache PostgREST. Elle ne modifie pas les auteurs existants. Rechargez ensuite la page d’administration. La modification du fichier local seule ne met pas à jour la base hébergée.

## Heure de Paris

Les dates affichées, les champs de saisie des événements et les jours de comptage des visites utilisent `Europe/Paris` : UTC+2 en été, UTC+1 en hiver. Les instants restent stockés en UTC ; aucun décalage manuel des événements existants n’est nécessaire.

Si les statistiques de fréquentation sont activées et que la migration `202610080001_visitor_analytics.sql` est déjà appliquée, appliquez également [202610090002_visitor_paris_timezone.sql](supabase/migrations/202610090002_visitor_paris_timezone.sql). Elle aligne la validation du jour dans la fonction Supabase sur l’heure de Paris. Conservez les totaux historiques.


## Administration des pôles

Dans `/profil?section=poles`, le bureau restreint peut créer un pôle avec **Nouveau pôle**, modifier sa présentation et son ordre d’affichage, ou demander sa suppression avec confirmation. Un pôle encore utilisé dans le profil principal d’un membre ou dans ses affectations ne peut pas être supprimé : réaffectez d’abord les personnes dans **Membres & rôles**.

Appliquez [202610090003_pole_management.sql](supabase/migrations/202610090003_pole_management.sql) dans le **SQL Editor** du projet Supabase (**New Query → contenu du fichier → Run**), puis rechargez l’administration. Ce fichier suppose que les tables `poles`, `members` (avec `auth_user_id`) et `member_assignments` du projet sont déjà installées. Il harmonise les champs de présentation et crée les fonctions RPC utilisées par l’application :

- `bde_admin_create_pole` : création avec un identifiant et un slug uniques.
- `bde_admin_update_pole` : modification, avec conservation du slug existant.
- `bde_admin_delete_pole` : suppression atomique si aucun membre n’est affecté.
- `bde_admin_can_manage_poles` : vérification des droits et disponibilité de la migration avant l’envoi d’une couverture.

Chaque mutation SQL contrôle le membre lié à `auth.uid()` et exige la catégorie `bureau_restreint` ou un rôle administratif autorisé (`president`, `tresorier`, `secretaire`, `vp_general`). Les écritures directes sur `poles` pour les rôles publics et authentifiés passent désormais par ces fonctions. La migration protège également la source de ces droits dans `members` : un membre ordinaire ne peut pas se donner un rôle administratif, créer ou supprimer des profils. Il peut modifier son propre profil sans changer ses identifiants ou ses droits. Le rattachement initial d’un profil non lié reste autorisé lorsque l’adresse du compte authentifié correspond exactement à celle du profil. La migration recharge le cache du schéma PostgREST. Les fonctions sont documentées dans le [guide Supabase](https://supabase.com/docs/guides/database/functions).


## Affichage du nom des membres

Le profil de compte propose **Masquer mon nom de famille sur les pages publiques**, activé par défaut. La préférence `members.hide_last_name` est un booléen `NOT NULL DEFAULT TRUE`. Une case cochée affiche seulement le prénom ; une case décochée et enregistrée autorise le nom complet. Le nom de famille reste enregistré et visible dans le compte et l’administration.

Appliquez [202610090004_member_last_name_privacy.sql](supabase/migrations/202610090004_member_last_name_privacy.sql) dans **Supabase → SQL Editor → New Query → Run**, puis rechargez le profil. La migration conserve les choix `FALSE` existants, attribue `TRUE` aux nouveaux profils et aux préférences absentes, autorise la modification de cette seule préférence dans le garde des profils personnels et recharge le cache PostgREST. Elle peut être réappliquée.

L’affichage est harmonisé dans l’équipe, les profils publics `/equipe/[id]`, les métadonnées nominatives, les cartes des pôles, les signatures d’articles et les anciens bureaux. Les anciens bureaux sont rapprochés des comptes par prénom et nom côté serveur : une identité inconnue ou une préférence indisponible reste masquée. En cas d’homonymes, le masquage est prioritaire dès qu’un des comptes correspondants le demande. Les données publiques envoyées aux composants client ne contiennent pas le nom masqué. Un champ de confidentialité absent est interprété comme `TRUE` tant que la migration n’est pas appliquée.


## Paramètres de compte, demandes d’adresse et Google

La rubrique **Paramètres** affiche l’adresse Auth en lecture seule, permet de demander son changement au bureau restreint et de lier Google. Le bureau restreint traite les demandes dans **Demandes de compte** ; la clôture vérifie que l’adresse a effectivement été changée dans Supabase Auth et dans la fiche membre.

Appliquez [202610090005_account_settings.sql](supabase/migrations/202610090005_account_settings.sql) après les migrations 003 et 004. Pour Google, configurez le fournisseur, fermez **Allow new users to sign up**, activez **Allow manual linking** et le hook **Before User Created** fourni. En production, renseignez également **NEXT_PUBLIC_SITE_URL**. Les boutons Google restent actionnables sans lire les réglages lors de l’affichage. Au départ et au retour, le serveur exige Google activé et les inscriptions fermées pour une connexion ; une liaison exige Google activé et le même compte membre déjà connecté, sans dépendre de la fermeture des inscriptions. En cas de refus, un message distingue une origine incorrecte, un fournisseur désactivé, des inscriptions ouvertes ou un service indisponible. Les réglages du projet Supabase hébergé doivent être appliqués séparément.

Le [guide de configuration des comptes et de Google](docs/account-settings.md) détaille les étapes dans Supabase et Google Cloud, les URL de callback et le traitement des demandes. Les sessions et identités sont enregistrées dans Supabase Auth ; la connexion Google ne crée aucun compte et n’effectue aucune mutation des tables métier lorsque la configuration décrite est appliquée.

## Inscriptions aux événements

Le bouton d'inscription d'un événement enregistre le profil du compte connecté dans une table dédiée, sans créer de compte. Le bureau restreint consulte la liste privée dans **Profil → Événements**, avec le bouton **Inscrits** à côté de **Voir** : recherche, pagination, date d'inscription et lien vers les profils publics.

Appliquez [202610090006_event_registrations.sql](supabase/migrations/202610090006_event_registrations.sql) dans **Supabase → SQL Editor → New Query → Run**, après la migration 003, puis rechargez le site. La migration crée `event_registrations`, les fonctions d'inscription, de désinscription et de consultation, leurs droits d'accès et le contrôle atomique de la capacité. La modification des fichiers locaux ne met pas à jour Supabase.

Pour proposer des événements payants et informatifs, appliquez [202610090007_paid_event_registrations.sql](supabase/migrations/202610090007_paid_event_registrations.sql) après 003 et 006, puis [202610090008_event_logs_and_informative_events.sql](supabase/migrations/202610090008_event_logs_and_informative_events.sql). Dans le formulaire événement, cochez **Événement informatif, sans inscription** pour une annonce sans réservation. Pour une inscription payante, décochez ce mode puis activez **Inscription payante**, saisissez le montant en euros et l’URL HTTPS du checkout HelloAsso. Configurez le checkout séparément dans HelloAsso.

Les inscriptions payantes réservent une place avant règlement. Dans la liste admin, le badge **Paiement à vérifier** rappelle que le site ne confirme pas les paiements : le BDE les vérifie dans HelloAsso. Chaque inscription conserve son tarif initial ; modifier l’événement ne change pas les inscriptions existantes. Une annulation libère la place, sans déclencher de remboursement. Les boutons **Inscrits**, **Journal** et **Historique global** permettent au bureau restreint de consulter les listes actuelles et l’historique des inscriptions/désinscriptions, y compris après suppression d’un événement.

Les inscriptions et annulations sont ouvertes avant le début pour les événements `upcoming`. Les doublons et le dépassement simultané de capacité sont bloqués en base. Les listes nominatives sont réservées à l'administration ; seuls les compteurs sont publics. Voir le [guide des inscriptions](docs/event-registrations.md) pour les conditions, fonctions RPC et règles de confidentialité.
