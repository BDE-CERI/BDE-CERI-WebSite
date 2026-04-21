# 🗄️ Supabase — Extensions & Nouvelles Tables (Phase 2)

Exécute ces commandes dans l'ordre dans **SQL Editor** de ton projet Supabase.

---

## 1. Lier les membres aux comptes Auth

```sql
-- Ajoute un lien entre un membre (membres table) et un utilisateur Supabase Auth
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_members_auth_user ON members(auth_user_id);
```

**Comment l'utiliser** : après avoir créé un utilisateur dans Authentication > Users, récupère son UUID et mets-le à jour :
```sql
UPDATE members
SET auth_user_id = 'uuid-de-l-utilisateur-auth'
WHERE email = 'president@bdeceri.fr';
```

---

## 2. Table `taverne_items` (Boissons & Snacks)

Les anciens produits boisson/snack de la table `products` sont migrés ici.

```sql
-- Nouveau type ENUM pour la taverne
CREATE TYPE IF NOT EXISTS taverne_category AS ENUM ('boisson', 'snack');

-- Table dédiée à la taverne
CREATE TABLE taverne_items (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT,
  price        INTEGER NOT NULL DEFAULT 0,  -- en centimes
  category     taverne_category NOT NULL DEFAULT 'boisson',
  image_url    TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  order_index  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_taverne_items_category    ON taverne_items(category);
CREATE INDEX idx_taverne_items_available   ON taverne_items(is_available);

-- Migration des données existantes depuis products
INSERT INTO taverne_items (name, price, category, is_available, order_index)
SELECT name, price, category::taverne_category, is_available, order_index
FROM products
WHERE category IN ('boisson', 'snack');

-- (Optionnel) Supprimer les anciens produits taverne de products
DELETE FROM products WHERE category IN ('boisson', 'snack');
```

---

## 3. Table `products` → Branding (Pulls, Goodies)

```sql
-- Nouveau type ENUM pour le branding
CREATE TYPE IF NOT EXISTS branding_category AS ENUM (
  'vetement',     -- pulls, t-shirts, hoodies
  'accessoire',   -- casquettes, badges, pins
  'goodies'       -- tote bags, stickers, mugs
);

-- CORRECTION : On rend l'ancienne colonne category facultative 
-- car elle était NOT NULL dans la version précédente.
ALTER TABLE products ALTER COLUMN category DROP NOT NULL;

-- Ajout d'une colonne branding_category à products
ALTER TABLE products ADD COLUMN IF NOT EXISTS branding_category branding_category NOT NULL DEFAULT 'goodies';

-- Supprimer l'ancienne colonne category si elle reste
-- ALTER TABLE products DROP COLUMN IF EXISTS category;

-- Données initiales — Branding
INSERT INTO products (name, description, price, branding_category, is_available, order_index) VALUES
  ('Hoodie BDE CERI',     'Hoodie unisexe brodé, coton bio. Coloris midnight navy.',   3500, 'vetement',   true, 1),
  ('T-Shirt BDE CERI',    'T-shirt col rond sérigraphié. Disponible S→XL.',             1800, 'vetement',   true, 2),
  ('Tote Bag BDE CERI',   'Tote bag en coton naturel — logo full print.',               1200, 'accessoire', true, 3),
  ('Sticker Pack',        'Pack de 6 stickers holographiques aux créas du pôle COM.',    500, 'goodies',    true, 4),
  ('Badge Métal',         'Badge clipable en métal argenté avec logo BDE.',              300, 'goodies',    true, 5);
```

---

## 4. Table `ancien_bureau`

Chaque ligne représente une **configuration annuelle** du BDE.

```sql
CREATE TABLE ancien_bureau (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  academic_year TEXT NOT NULL UNIQUE,  -- ex: '2024-2025'
  theme         TEXT,                  -- ex: 'Nuit Océane'
  description   TEXT,
  cover_url     TEXT,                  -- image de couverture de l'année
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ancien_bureau_year ON ancien_bureau(academic_year DESC);
```

---

## 5. Table `ancien_bureau_members`

Un ancien membre peut avoir plusieurs rôles sur plusieurs années.

```sql
CREATE TABLE ancien_bureau_members (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ancien_bureau_id UUID NOT NULL REFERENCES ancien_bureau(id) ON DELETE CASCADE,
  first_name       TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  role_label       TEXT NOT NULL DEFAULT 'Membre',
  study_year       TEXT,          -- ex: 'L3 Informatique', 'M1 MIAGE'
  photo_url        TEXT,
  email            TEXT,
  order_index      INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ancien_bureau_members_bureau ON ancien_bureau_members(ancien_bureau_id);
CREATE INDEX idx_ancien_bureau_members_order  ON ancien_bureau_members(ancien_bureau_id, order_index);
```

---

## 6. Row Level Security — Nouvelles tables

```sql
-- Active RLS
ALTER TABLE taverne_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ancien_bureau        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ancien_bureau_members ENABLE ROW LEVEL SECURITY;

-- ====== LECTURE PUBLIQUE ======

CREATE POLICY "Taverne items viewable by everyone"
  ON taverne_items FOR SELECT USING (true);

CREATE POLICY "Ancien bureau viewable by everyone"
  ON ancien_bureau FOR SELECT USING (true);

CREATE POLICY "Ancien bureau members viewable by everyone"
  ON ancien_bureau_members FOR SELECT USING (true);

-- ====== ÉCRITURE — Staff authentifié uniquement ======

CREATE POLICY "Staff can manage taverne items"
  ON taverne_items FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage ancien bureau"
  ON ancien_bureau FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage ancien bureau members"
  ON ancien_bureau_members FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```

---

## 7. Trigger `updated_at` pour les nouvelles tables

```sql
-- Réutilise la fonction déjà créée dans supabase.md
CREATE TRIGGER trigger_taverne_items_updated_at
  BEFORE UPDATE ON taverne_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 8. 🪣 Storage Buckets — Création & Configuration

### A. Création des buckets via SQL Editor

```sql
-- Bucket photos membres (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'member-photos',
  'member-photos',
  true,
  5242880,  -- 5 MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Bucket images événements (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  10485760,  -- 10 MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Bucket images boutique (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shop-images',
  'shop-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);
```

### B. Politiques Storage

```sql
-- Lecture publique pour tous les buckets
CREATE POLICY "Public read member-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'member-photos');

CREATE POLICY "Public read event-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');

CREATE POLICY "Public read shop-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'shop-images');

-- Upload réservé aux membres authentifiés
CREATE POLICY "Auth upload member-photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'member-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Auth upload event-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-images' AND auth.role() = 'authenticated');

CREATE POLICY "Auth upload shop-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'shop-images' AND auth.role() = 'authenticated');

-- Suppression réservée aux authentifiés
CREATE POLICY "Auth delete member-photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'member-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete event-images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'event-images' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete shop-images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'shop-images' AND auth.role() = 'authenticated');
```

### C. Comment créer le bucket manuellement (alternative)

1. Va dans **Storage** (menu gauche du dashboard Supabase)
2. Clique **New Bucket**
3. Nom : `member-photos` / `event-images` / `shop-images`
4. Coche **Public bucket** ✅
5. Dans **File size limit** : 5MB pour photos, 10MB pour images
6. **Allowed MIME types** : `image/jpeg, image/png, image/webp`

### D. Récupérer l'URL publique d'un fichier uploadé

```typescript
// Dans ton code Next.js
const { data } = supabase.storage
  .from('member-photos')
  .getPublicUrl('nom-du-fichier.jpg');

// data.publicUrl → https://qmfcnrhclvpxgqljbyxm.supabase.co/storage/v1/object/public/member-photos/nom-du-fichier.jpg
```

---

## 9. Vue utile — Membre connecté avec son profil

```sql
-- Vue qui joint auth.users avec members pour le profil
CREATE OR REPLACE VIEW member_profiles AS
SELECT
  m.*,
  u.email       AS auth_email,
  u.created_at  AS auth_created_at
FROM members m
JOIN auth.users u ON m.auth_user_id = u.id;

-- Politique : chaque membre ne voit que son propre profil
CREATE POLICY "User sees own profile"
  ON members FOR SELECT
  USING (auth_user_id = auth.uid() OR is_visible = true);
```

---

## 10. Site Settings — Mode Édition

```sql
-- Ajoute un paramètre de suivi du mode édition
INSERT INTO site_settings (key, value) VALUES
  ('edit_mode_enabled', 'false')
ON CONFLICT (key) DO NOTHING;
```

---

## Résumé des URLs publiques des buckets

| Bucket | URL de base |
|---|---|
| `member-photos` | `https://qmfcnrhclvpxgqljbyxm.supabase.co/storage/v1/object/public/member-photos/` |
| `event-images` | `https://qmfcnrhclvpxgqljbyxm.supabase.co/storage/v1/object/public/event-images/` |
| `shop-images` | `https://qmfcnrhclvpxgqljbyxm.supabase.co/storage/v1/object/public/shop-images/` |
