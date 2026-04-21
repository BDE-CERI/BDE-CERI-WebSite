# 🗄️ Supabase — Réseaux Sociaux, Hiérarchie et Multi-statut (Phase 6)

Exécute ces commandes dans le **SQL Editor** de ton instance Supabase pour mettre en place les nouvelles fonctionnalités.

---

## 1. Mise à jour de la table `members`

Ajout des colonnes pour le tri (Hiérarchie) et les réseaux sociaux.

```sql
ALTER TABLE members 
  ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 100, -- Plus le chiffre est petit, plus le membre est haut dans la hiérarchie
  ADD COLUMN IF NOT EXISTS discord TEXT,            -- Pseudo ou lien Discord
  ADD COLUMN IF NOT EXISTS instagram TEXT;          -- Pseudo ou lien Instagram

-- Index pour le tri rapide
CREATE INDEX IF NOT EXISTS idx_members_rank ON members(rank ASC);
```

### Initialisation des Rangs (Exemple)
Tu peux ajuster ces chiffres selon tes besoins :
```sql
UPDATE members SET rank = 1 WHERE role::text ILIKE 'president';
UPDATE members SET rank = 2 WHERE role::text ILIKE '%vp%' OR role::text ILIKE '%vice%';
UPDATE members SET rank = 3 WHERE role::text ILIKE 'tresorier';
UPDATE members SET rank = 4 WHERE role::text ILIKE 'secretaire';
```

---

## 2. Table pour le Multi-statut (`member_assignments`)

Cette table permet à un membre d'être dans plusieurs pôles avec des rôles différents.

```sql
CREATE TABLE IF NOT EXISTS member_assignments (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id   UUID REFERENCES members(id) ON DELETE CASCADE,
  pole_id     UUID REFERENCES poles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL, -- ex: 'Responsable', 'Bras droit', etc.
  is_vp       BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE member_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Assignments viewable by everyone" ON member_assignments FOR SELECT USING (true);
CREATE POLICY "Staff can manage assignments" ON member_assignments FOR ALL 
  USING (auth.role() = 'authenticated') 
  WITH CHECK (auth.role() = 'authenticated');
```

---

## 3. Triggers / Helpers (Optionnel)
*Note : Pour simplifier la transition, on garde quand même les colonnes `role` et `pole_id` sur `members` pour le rôle principal.*
