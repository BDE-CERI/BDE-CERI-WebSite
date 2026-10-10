# 🗄️ Supabase — Photos & Champs Profil Étendus (Phase 5)

Exécute ces commandes dans le **SQL Editor** de ton instance Supabase pour mettre en place le bucket de stockage pour les photos de profil, ainsi que les nouvelles colonnes pour les responsabilités et le parcours académique de l'équipe.

---

## 1. Création du Bucket `member-profiles`

Ce code va créer le bucket de stockage pour accueillir les photos de profil et mettre en place les bonnes politiques de sécurité (Lecture publique, mais seul un utilisateur authentifié peut uploader ou supprimer son image).

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'member-profiles',
  'member-profiles',
  true,
  10485760, -- 10 MB Max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Politiques pour la Lecture (tout le monde peut voir les photos de profil)
CREATE POLICY "Public read member-profiles" ON storage.objects 
  FOR SELECT USING (bucket_id = 'member-profiles');

-- Politiques pour l'Ajout/Mise à jour (uniquement membres connectés)
CREATE POLICY "Auth upload member-profiles" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'member-profiles' AND auth.role() = 'authenticated');

-- Politiques pour la Suppression
CREATE POLICY "Auth delete member-profiles" ON storage.objects 
  FOR DELETE USING (bucket_id = 'member-profiles' AND auth.role() = 'authenticated');
```

---

## 2. Ajout des Colonnes Responsabilités et Parcours

Nous ajoutons deux champs `TEXT` à la table `members` pour permettre à chaque membre de remplir librement ses attributions actuelles et son parcours.

```sql
ALTER TABLE members 
  ADD COLUMN IF NOT EXISTS responsibilities TEXT,    -- ex: 'Coordination générale, Gestion des équipes...'
  ADD COLUMN IF NOT EXISTS academic_journey TEXT;    -- ex: 'Actuellement en L3 Informatique passionné par...'
```

---

*L'application Next.js est déjà configurée pour lire ces données et les afficher sur la page `/equipe` !*
