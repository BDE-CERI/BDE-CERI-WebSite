# Inscriptions aux événements

## Installation dans Supabase

Le code local ne crée pas les tables ni les fonctions dans le projet hébergé. Dans Supabase, ouvrez SQL Editor, créez une requête, collez le contenu de supabase/migrations/202610100001_event_system_setup.sql, puis cliquez sur Run. Le script vérifie que les protections des rôles et des profils membres sont déjà installées.

Le script peut être réappliqué sans ajouter de doublons. Il suppose que les tables events, members avec auth_user_id et auth.users utilisent des identifiants UUID. Il ajoute les colonnes manquantes et recharge le cache PostgREST. Aucune clé service_role n’est nécessaire.

Le même script configure les inscriptions payantes, les événements informatifs et le journal d’activité. Les événements existants gardent les inscriptions activées par défaut, les inscriptions déjà enregistrées restent gratuites et leurs données sont conservées. Aucun accès API HelloAsso n’est nécessaire.

## Parcours du membre

Le bouton de la page d'un événement utilise le compte actuellement connecté. Un compte Supabase Auth doit correspondre à exactement un profil membre via `members.auth_user_id` ; aucun compte ni profil n'est créé par cette action. Un visiteur non connecté passe par `/login`, puis revient sur l’événement après une connexion par mot de passe ou Google. Le retour est limité aux adresses locales de détails d’événements ; la connexion ne déclenche pas automatiquement l’inscription.

Une inscription est possible uniquement si l'événement possède le statut `upcoming` et n'a pas encore commencé. Une capacité strictement positive limite le nombre d'inscrits ; une valeur vide, nulle ou une ancienne valeur inférieure à 1 signifie « sans limite ». Les horaires sont comparés comme des instants UTC en base et affichés en heure de Paris par le site.

Un second clic ne crée pas de doublon. La désinscription est possible avant le début, tant que l'événement reste `upcoming`. Une désinscription déjà effectuée est sans effet. Dès le début ou la fermeture de l'événement, la liste est conservée ; les boutons ne permettent plus de la modifier.

## Inscription payante et HelloAsso

Dans le formulaire de création ou de modification, décochez **Événement informatif, sans inscription** pour proposer les inscriptions. Laissez-la cochée pour publier une annonce sans compte, réservation ou capacité d’inscription. Les inscriptions et le journal déjà créés sont conservés si vous passez un événement en mode informatif. Pour une inscription payante, activez **Inscription payante**, indiquez un montant en euros strictement positif avec au plus deux décimales, puis collez l’URL HTTPS du checkout HelloAsso correspondant à l’événement. Le montant est stocké en centimes dans `events.registration_price_cents` pour éviter les erreurs d’arrondi. L’URL doit appartenir à `helloasso.com` ou à `www.helloasso.com` et viser une page, pas seulement la racine du site. Si la case est désactivée et le formulaire enregistré, le prix et le lien de l’événement sont effacés.

Le tarif renseigné sur le site ne configure pas le formulaire HelloAsso. Le BDE doit y définir lui-même le même tarif, les mêmes conditions et, si nécessaire, les mêmes limites de places. Le site ne transmet aucun profil ni montant à une API HelloAsso et ne vérifie pas le paiement.

Le compte connecté s’inscrit d’abord sur le site : cette inscription réserve une place et conserve `payment_required` et `payment_amount_cents`, les conditions au moment de l’inscription. Le membre peut ensuite ouvrir le checkout HelloAsso pour régler. Une inscription payante compte dans la capacité, même si le règlement n’a pas encore été effectué. Un clic sur le lien ne constitue pas une confirmation de paiement. Le BDE rapproche les inscriptions avec les paiements dans HelloAsso.

Les changements de tarif sont appliqués aux prochaines inscriptions uniquement. Une inscription déjà enregistrée conserve son montant, et une ancienne inscription gratuite ne devient pas payante. Une annulation puis une nouvelle inscription utilisent le tarif actuel. Vérifiez également le checkout HelloAsso lors d’un changement de tarif : ce service peut présenter un tarif différent du montant conservé sur une ancienne inscription.

L’annulation avant le début libère la place et supprime la ligne d’inscription. Elle ne déclenche aucun remboursement : pour un paiement déjà effectué, le BDE doit traiter la demande séparément dans HelloAsso. Aucune API, notification de paiement ni webhook HelloAsso n’est intégré à ce dispositif.

## Consultation par les administrateurs

Dans **Profil → Événements** (`/profil?section=events`), le bouton **Inscrits**, à côté de **Voir**, ouvre la liste privée de l’événement. Le bouton **Journal** affiche les inscriptions et désinscriptions de l’événement, horodatées en heure de Paris. **Historique global** affiche les mouvements de tous les événements, y compris ceux supprimés. Les mouvements sont paginés par groupes de 100, du plus récent au plus ancien. Les actions antérieures à la mise en place du journal ne peuvent pas être reconstituées. Le journal est visible uniquement au bureau restreint. Il conserve le titre de l’événement, même après une désinscription ou une suppression d’événement. Le nom est lu depuis le profil actif et n’est pas recopié dans le journal; si le profil est supprimé, l’identifiant membre est anonymisé. Il ne contient ni email ni adresse IP. La liste affiche les membres, leur date d'inscription, une recherche par nom et une pagination. Chaque ligne indique **Gratuit** ou **Paiement à vérifier · montant**, selon les conditions enregistrées lors de l’inscription. Ce badge n’atteste jamais d’un paiement : le contrôle se fait dans HelloAsso.

Le lien vers `/equipe/[id]` est proposé seulement lorsque le profil est public (`is_visible = true`). Un membre ayant choisi de masquer son nom de famille reste protégé sur cette page publique ; l'administration peut consulter son identité complète pour organiser l'événement.

Les mêmes droits que pour l'administration des événements s'appliquent : catégorie `bureau_restreint`, ou rôle `president`, `tresorier`, `secretaire`, `vp_general`. Un membre ordinaire ne peut consulter que sa propre ligne, jamais la liste nominative d'un événement.

## Stockage et garanties

La table `public.event_registrations` contient :

| Champ | Usage |
| --- | --- |
| `id` | Identifiant UUID de l'inscription |
| `event_id` | Événement concerné |
| `member_id` | Profil membre identifié en base |
| `auth_user_id` | Compte Auth ayant effectué l'inscription |
| `registered_at` | Date et heure de l'inscription |
| `payment_required` | Inscription payante au moment de son enregistrement |
| `payment_amount_cents` | Tarif enregistré en centimes, ou `NULL` pour une inscription gratuite |

Les deux contraintes uniques `(event_id, member_id)` et `(event_id, auth_user_id)` empêchent les doublons. L'identité est dérivée de `auth.uid()` côté PostgreSQL : le navigateur ne peut pas choisir la personne à inscrire. Une association Auth ambiguë ou réattribuée à un autre profil ne transfère pas une inscription existante.

L'accès direct en écriture est retiré aux rôles `anon` et `authenticated`. Les seules mutations ordinaires passent par des fonctions qui vérifient la session et le profil. La sécurité RLS limite la lecture aux inscriptions du compte connecté ou aux administrateurs autorisés.

Inscription et désinscription verrouillent la même ligne événement avant de modifier les places. Des inscriptions simultanées ne peuvent donc pas dépasser le quota. La suppression d’un événement, d’un membre ou de son compte Auth supprime automatiquement les inscriptions actives. Le journal d’événement est séparé : les identifiants supprimés deviennent nuls; les titres d’événement restent consignés et les noms sont lus depuis le profil actif, sans être recopiés dans le journal. Les événements informatifs n’acceptent pas de nouvelle inscription.

Le compteur public ne contient aucune identité. La liste nominative reste privée et n'est pas incluse dans les données de la page publique. L'inscription ne stocke ni adresse IP ni nouvel identifiant de suivi. Elle ne contient ni coordonnées bancaires, ni identifiant de paiement HelloAsso, ni preuve de règlement.

## Fonctions RPC

| Fonction | Accès | Résultat |
| --- | --- | --- |
| `bde_event_registration_status(p_event_id)` | Public et connecté | Statut, compteur et inscription du seul appelant |
| `bde_register_for_event(p_event_id)` | Compte membre connecté | Statut après inscription |
| `bde_cancel_event_registration(p_event_id)` | Compte membre connecté | Statut après désinscription |
| `bde_admin_list_event_registrations(p_event_id, p_offset, p_limit, p_query)` | Administration autorisée | Total filtré et page d'inscrits |

Le statut renvoie `event_id`, `registered`, `registered_at`, `registrations_count`, `max_capacity`, `registration_open`, `registration_enabled`, `member_eligible`, `payment_required`, `payment_amount_cents` et `checkout_url`. Les champs de tarif décrivent l’inscription conservée pour un membre déjà inscrit, ou le tarif actuel pour une nouvelle inscription. `checkout_url` est proposé à un inscrit payant seulement si le tarif de l’événement correspond encore à son tarif enregistré. Si le tarif a changé ou si le checkout a été retiré, aucun lien potentiellement erroné n’est affiché; le membre contacte alors le BDE. `registration_open` décrit l'ouverture selon le statut et la date ; la disponibilité des places se lit avec le compteur et la capacité.

La liste renvoie `{ total, registrations }`. Chaque ligne contient `id`, `member_id`, `first_name`, `last_name`, `photo_url`, `is_visible`, `registered_at`, `payment_required` et `payment_amount_cents`. La taille d'une page est de 50 par défaut, limitée à 100. La recherche traite le texte littéralement, y compris les caractères `%` et `_`.

Les refus métiers utilisent les marqueurs `ER_AUTH_REQUIRED`, `ER_MEMBER_REQUIRED`, `ER_EVENT_NOT_FOUND`, `ER_CLOSED`, `ER_FULL` et `ER_FORBIDDEN`, que l'application traduit en messages compréhensibles. Une requête de recherche de plus de 200 caractères produit `ER_INVALID_QUERY`.
