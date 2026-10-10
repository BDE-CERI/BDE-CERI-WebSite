# Adhésions et badges des membres

La migration supabase/migrations/202610090009_membership_and_member_badges.sql ajoute :

- members.membership_paid, booléen à faux par défaut, modifiable depuis Profil → Membres et rôles par le bureau restreint. Il commande l’indicateur affiché sur le profil public.
- member_badges, les prix remportés avec l’événement, l’équipe, le prix et l’année universitaire. Les ajouts passent par des fonctions RPC réservées au bureau, avec une limite de quatre membres par équipe et un seul nom d’équipe par prix et édition.

## Activation

Dans Supabase, ouvrez SQL Editor, collez le contenu de la migration et exécutez-le. Les profils publics montrent ensuite une coche verte ou une croix rouge pour l’adhésion et les badges attribués. L’administration des badges se trouve dans Profil → Badges.
