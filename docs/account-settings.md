# Paramètres des comptes et connexion Google

## Ce qui est disponible dans le site

- **Paramètres** (engrenage), dans l’espace membre : adresse réelle du compte Auth, grisée ; demande de changement d’adresse ; état de la liaison Google ; historique des demandes.
- **Demandes de compte**, pour le bureau restreint : demandes en attente, recherche, réponse et refus ou clôture après modification effective dans Supabase.
- **Continuer avec Google**, sur /login : connexion réservée aux utilisateurs Auth déjà existants et aux fiches membres déjà liées par auth_user_id.
- Les demandes sont internes à l’administration. Aucun email n’est envoyé automatiquement par ce workflow.

Les pages affichent les dates en heure de Paris et sont disponibles en français et en anglais.

## 1. Installer les fonctions SQL

Dans **Supabase → SQL Editor**, appliquer dans l’ordre les migrations du projet, dont :

1. [202610090003_pole_management.sql](../supabase/migrations/202610090003_pole_management.sql) : garde des profils et contrôle des droits du bureau restreint.
2. [202610090004_member_last_name_privacy.sql](../supabase/migrations/202610090004_member_last_name_privacy.sql) : préférence de confidentialité des noms.
3. [202610090005_account_settings.sql](../supabase/migrations/202610090005_account_settings.sql) : demandes d’adresse et garde Google.

La migration 005 crée une table privée, des fonctions RPC contrôlant les droits, et le hook Auth bde_before_user_created_google_guard. Sa présence dans les fichiers locaux ne modifie pas le projet hébergé.

Une personne ne lit que ses demandes. Le bureau restreint peut les consulter et les traiter. Les clients ne disposent d’aucun accès direct INSERT/UPDATE/DELETE sur cette table. La demande déduit le membre et l’adresse Auth côté SQL : le navigateur ne choisit pas le compte à modifier. Une seule demande en attente est autorisée par membre.

## 2. Fermer les inscriptions avant d’activer Google

Dans **Supabase → Authentication → Sign In / Providers**, désactiver **Allow new users to sign up** et laisser les inscriptions anonymes désactivées. Activer **Allow manual linking** pour le bouton de liaison.

Quand les inscriptions sont fermées, seuls les utilisateurs Auth existants peuvent se connecter. Cette règle doit rester fermée en production. Le site consulte les réglages Auth réels avant le départ vers Google et au retour ; si Google est désactivé, si les inscriptions sont ouvertes ou si la lecture échoue, le flux est refusé. [Configuration Supabase](https://supabase.com/docs/guides/auth/general-configuration)

Dans **Authentication → Hooks**, ajouter un hook **Before User Created**, de type fonction Postgres, et choisir **public.bde_before_user_created_google_guard**. L’enregistrement de la fonction SQL seul n’active pas le hook. Le hook rejette toute création via Google avant insertion du compte ; il laisse passer les autres fournisseurs, dont les invitations email administratives. Il apporte une protection supplémentaire si les réglages d’inscription sont modifiés. [Hook officiel](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook)

Les comptes BDE continuent à être créés ou invités par un administrateur dans Supabase. Un nouveau visiteur ne peut pas obtenir un compte en cliquant sur Google.

## 3. Configurer Google

Dans **Google Cloud → Google Auth Platform** :

1. Configurer le projet, le nom de l’application, l’adresse de contact, les domaines et l’audience.
2. Créer un client OAuth de type **Web application**.
3. Ajouter l’URI de redirection fournie dans le fournisseur Google de Supabase. Pour ce projet, elle est normalement :
   https://qmfcnrhclvpxgqljbyxm.supabase.co/auth/v1/callback
4. Limiter les permissions à openid, email et profile. Le site ne demande pas d’accès à Gmail, Drive ou Agenda.
5. Copier le **Client ID** et le **Client secret** dans **Supabase → Authentication → Sign In / Providers → Google**, puis activer le fournisseur. Le secret reste dans Supabase, jamais dans une variable NEXT_PUBLIC_*.
6. Si l’application Google est en mode Testing, ajouter les comptes de test autorisés dans Google. Ajuster l’audience avant de l’ouvrir aux membres prévus.

Le callback enregistré chez Google est celui de **Supabase**, pas le callback Next.js. [Guide Google de Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google)

## 4. Définir les URL du site

Dans l’environnement de production, définir l’origine HTTPS officielle, par exemple :

    NEXT_PUBLIC_SITE_URL=https://bdeceri.fr

La connexion Google reste indisponible en production si cette variable manque ou est invalide. Ne pas y mettre une route, des identifiants ou des paramètres. Redémarrer le serveur après un changement d’environnement. L’origine configurée doit correspondre au domaine ouvert dans le navigateur : un alias www ou une URL de prévisualisation différente est refusé avant la création des cookies du flux.

Dans **Supabase → Authentication → URL Configuration** :

- **Site URL** : https://bdeceri.fr (adapter au domaine réellement utilisé).
- **Redirect URLs** :
  - http://localhost:3000/auth/callback*
  - https://bdeceri.fr/auth/callback*

Le suffixe * permet le paramètre de validation temporaire flow ajouté au callback. Ajouter l’URL correspondant au port utilisé si le serveur local démarre sur 3001. Le développement Google s’utilise sur localhost, 127.0.0.1 ou ::1 ; ouvrir le site depuis une adresse LAN ne configure pas une origine Google valide. Éviter une règle de redirection vers n’importe quel domaine. [Redirections Supabase](https://supabase.com/docs/guides/auth/redirect-urls)

## 5. Lier un compte existant

1. Se connecter avec l’adresse et le mot de passe du compte BDE.
2. Ouvrir **Paramètres → Google → Lier mon compte à Google**.
3. Choisir le compte Google souhaité.
4. Le callback vérifie que la liaison est revenue sur le même utilisateur Auth et sur un membre déjà rattaché.
5. Utiliser ensuite **Continuer avec Google** sur /login.

La liaison utilise linkIdentity ; elle peut concerner une adresse Google différente de l’adresse du compte BDE. L’adresse principale affichée dans Paramètres reste celle de Supabase Auth. Supabase peut également lier automatiquement une identité Google ayant la même adresse vérifiée qu’un utilisateur existant. Ces écritures d’identité dans Auth sont autorisées ; elles ne changent pas la fiche membre. [Liaison des identités](https://supabase.com/docs/guides/auth/auth-identity-linking)

Le proxy Next.js 16 dans src/proxy.ts renouvelle les sessions avec getClaims et transmet les cookies au navigateur et aux composants serveur. Les réponses de renouvellement et de callback évitent le cache partagé. Le callback OAuth gère ses propres cookies et est exclu du proxy.

Le retour OAuth échange un code PKCE, vérifie le flux temporaire et les droits, puis ouvre une session Auth. Aucun insert, update ou upsert sur les tables du site n’est exécuté par la connexion Google. Aucun rapprochement métier par email ne se produit dans ce flux. Les jetons d’accès au compte Google ne sont pas conservés dans la session du site.

Le rattachement historique d’une fiche membre non liée par adresse email a été déplacé vers la connexion explicite par mot de passe. Pour un utilisateur invité dont la fiche n’est pas encore liée, effectuer cette première connexion ou renseigner auth_user_id administrativement avant d’utiliser Google.

## 6. Traiter une demande de changement d’adresse

1. Le membre saisit la nouvelle adresse et, si utile, un motif dans **Paramètres**.
2. Le bureau restreint consulte **Demandes de compte** et vérifie la demande.
3. En cas de refus, il ajoute une réponse puis choisit **Refuser**.
4. Pour accepter la demande, une personne disposant des droits d’administration Supabase modifie l’adresse du même utilisateur Auth dans **Authentication → Users**, puis celle de sa fiche dans **Table Editor → members → email**. Conserver le même UUID Auth et le même auth_user_id ; ne pas créer un second compte.
5. De retour sur le site, elle ajoute une réponse et marque la demande comme traitée.

La clôture SQL exige que l’adresse Auth et l’adresse de la fiche membre correspondent toutes deux à l’adresse demandée et que le rattachement du compte soit inchangé. Elle ne modifie elle-même aucune adresse. Si elles ne correspondent pas, la demande reste en attente avec une erreur explicite.

Les paramètres du site proposent une demande et un suivi ; la modification de l’adresse appartient à l’administration Supabase. Le bureau restreint reçoit la demande dans le site, sans dépendre d’un SMTP.
