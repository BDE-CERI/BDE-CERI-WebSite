# Authentification du bureau et événements

## Authentification à deux facteurs

Le site utilise le facteur TOTP de Supabase Auth. Le QR code créé depuis **Profil → Paramètres** peut être scanné dans Authy ou dans une autre application compatible avec les codes TOTP. Il faut confirmer un premier code pour activer le facteur.

L’authentification à deux facteurs est imposée aux comptes du bureau restreint, aux administrateurs développeurs (`is_dev = true`) et aux rôles président, trésorier, secrétaire et VP général. Les autres vice-présidences voient une recommandation dans leurs paramètres. Les actions d’administration vérifient le niveau de session renforcé.

Pour autoriser un développeur qui n’est pas au bureau restreint, exécuter `supabase/migrations/202610100002_site_developer_admin.sql` dans l’éditeur SQL de Supabase. La colonne `members.is_dev` vaut `false` par défaut et ne peut pas être modifiée depuis le site. Dans Supabase, passer uniquement la fiche du développeur désigné à `true`. Il obtient alors l’accès admin du site, sans changer sa catégorie ni son rôle de membre. Il faut activer son facteur TOTP avant d’utiliser les outils admin.

Après une perte de téléphone, un administrateur Supabase devra aider à rétablir l'accès au compte. Prévoir un second appareil d'authentification avant de perdre l'accès au premier.

## Événements sans date précise

Pour les inscriptions gratuites ou payantes, les événements informatifs, leur journal et les dates « prochainement », exécuter une seule fois `supabase/migrations/202610100001_event_system_setup.sql` dans l’éditeur SQL de Supabase. Le script regroupe les modifications de schéma évènementielles qui étaient auparavant réparties entre plusieurs fichiers. Il nécessite que la gestion des rôles du bureau et les protections des profils membres soient déjà configurées dans le projet.

Dans l'éditeur d'un événement, cocher **Prochainement — date à préciser** publie l'événement sans date. Les inscriptions et le paiement sont alors désactivés. Ajouter ensuite une date précise et décocher cette option pour rouvrir les inscriptions selon les autres réglages.

Les pages d’accueil et d’événements affichent les lignes de la table events annoncées prochainement ou dont la date de début n’est pas passée, quel que soit leur statut. Les événements passés restent disponibles dans les archives.

## Mise en avant de la boutique

Déposer les visuels de campagne dans `public/publicite/` puis redéployer le site. Les fichiers JPG, PNG, WebP, AVIF, GIF et SVG sont pris en charge ; s'il y en a plusieurs, la bannière alterne entre eux et affiche des boutons de sélection. Tant que le dossier ne contient pas de visuel, la bannière utilise `public/boutique-publicite-placeholder.svg`.
