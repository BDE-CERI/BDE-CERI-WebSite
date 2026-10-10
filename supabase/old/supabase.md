# 🗄️ Supabase — Configuration de la Base de Données

## Instructions

1. Crée un nouveau projet sur [Supabase](https://supabase.com/dashboard)
2. Va dans **Project Settings > API** et copie ton `Project URL` et `anon key`
3. Renseigne-les dans le fichier `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Va dans **SQL Editor** et exécute les requêtes ci-dessous dans l'ordre.

---

## 1. Activation des extensions

```sql
-- Active l'extension UUID si pas déjà fait
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## 2. Types ENUM

```sql
-- Catégories de membres
CREATE TYPE member_category AS ENUM (
  'bureau_restreint',
  'bureau',
  'membre_actif',
  'adherent',
  'membre_honneur'
);

-- Rôles de membres
CREATE TYPE member_role AS ENUM (
  'president',
  'premier_vice_president',
  'vice_president_general',
  'tresorier',
  'secretaire',
  'vice_president_pole',
  'charge_mission_pole',
  'membre_actif',
  'adherent',
  'membre_honneur'
);

-- Statuts d'événements
CREATE TYPE event_status AS ENUM (
  'upcoming',
  'ongoing',
  'past'
);

-- Catégories de produits
CREATE TYPE product_category AS ENUM (
  'boisson',
  'snack'
);
```

## 3. Table `poles`

```sql
CREATE TABLE poles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'circle',
  color TEXT NOT NULL DEFAULT '#00D4FF',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Données initiales
INSERT INTO poles (name, slug, full_name, description, icon, color, order_index) VALUES
  ('COM', 'com', 'Pôle Communication', 'Gestion des réseaux sociaux, création d''affiches & visuels, couverture des événements.', 'megaphone', '#FF6B6B', 1),
  ('Projets', 'projets', 'Pôle Projets', 'Organisation de soirées, sorties, voyages et activités pour les étudiants.', 'rocket', '#4ECDC4', 2),
  ('Tech', 'tech', 'Pôle Technologies', 'Développement web, hackathons, ateliers techniques et projets innovants.', 'code-2', '#00D4FF', 3),
  ('Part', 'part', 'Pôle Partenariats', 'Relations entreprises, sponsoring et partenariats.', 'handshake', '#FFD93D', 4),
  ('Jeux', 'jeux', 'Pôle Jeux', 'LAN parties, tournois esport, soirées jeux de société et gaming.', 'gamepad-2', '#A855F7', 5);
```

## 4. Table `members`

```sql
CREATE TABLE members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  category member_category NOT NULL DEFAULT 'adherent',
  role member_role NOT NULL DEFAULT 'adherent',
  role_label TEXT NOT NULL DEFAULT 'Adhérent',
  pole_id UUID REFERENCES poles(id) ON DELETE SET NULL,
  email TEXT,
  photo_url TEXT,
  bio TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_members_category ON members(category);
CREATE INDEX idx_members_is_visible ON members(is_visible);
CREATE INDEX idx_members_order ON members(order_index);
```

## 5. Table `events`

```sql
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  short_description TEXT,
  date_start TIMESTAMPTZ NOT NULL,
  date_end TIMESTAMPTZ,
  location TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  status event_status NOT NULL DEFAULT 'upcoming',
  category TEXT NOT NULL DEFAULT 'random',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date_start ON events(date_start);
CREATE INDEX idx_events_is_featured ON events(is_featured);
```

## 6. Table `products`

```sql
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0, -- prix en centimes
  category product_category NOT NULL,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_available ON products(is_available);

-- Données initiales — Boissons
INSERT INTO products (name, price, category, order_index) VALUES
  ('Coca-Cola', 80, 'boisson', 1),
  ('Coca-Cola Zero', 80, 'boisson', 2),
  ('Fanta Orange', 80, 'boisson', 3),
  ('Sprite', 80, 'boisson', 4),
  ('Ice Tea Pêche', 80, 'boisson', 5),
  ('Oasis Tropical', 80, 'boisson', 6),
  ('Eau minérale', 50, 'boisson', 7),
  ('Capri-Sun', 60, 'boisson', 8);

-- Données initiales — Snacks
INSERT INTO products (name, price, category, order_index) VALUES
  ('Kinder Bueno', 100, 'snack', 1),
  ('Kinder Bueno White', 100, 'snack', 2),
  ('Twix', 80, 'snack', 3),
  ('KitKat', 80, 'snack', 4),
  ('M&M''s', 100, 'snack', 5),
  ('Granola', 80, 'snack', 6);
```

## 7. Table `site_settings`

```sql
CREATE TABLE site_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paramètres initiaux
INSERT INTO site_settings (key, value) VALUES
  ('instagram_url', 'https://instagram.com/bdeceri'),
  ('snapchat_url', 'https://snapchat.com/add/bdeceri'),
  ('whatsapp_url', 'https://chat.whatsapp.com/your-invite-link'),
  ('helloasso_url', 'https://www.helloasso.com/associations/bde-ceri'),
  ('contact_email', 'contact@bdeceri.fr'),
  ('address', 'CERI — Agroparc, 339 Chemin des Meinajariès, 84140 Avignon'),
  ('opening_hours', 'Lundi — Vendredi : 10h00 — 17h00');
```

## 8. Row Level Security (RLS)

```sql
-- Active RLS sur toutes les tables
ALTER TABLE poles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- ====== LECTURE PUBLIQUE (anon + authenticated) ======

-- Poles : lecture publique
CREATE POLICY "Poles are viewable by everyone"
  ON poles FOR SELECT
  USING (true);

-- Members : lecture publique (seulement les visibles)
CREATE POLICY "Visible members are viewable by everyone"
  ON members FOR SELECT
  USING (is_visible = true);

-- Events : lecture publique
CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT
  USING (true);

-- Products : lecture publique
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (true);

-- Site settings : lecture publique
CREATE POLICY "Site settings are viewable by everyone"
  ON site_settings FOR SELECT
  USING (true);

-- ====== ÉCRITURE STAFF UNIQUEMENT (authenticated) ======

-- Poles : CRUD pour le staff
CREATE POLICY "Staff can manage poles"
  ON poles FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Members : CRUD pour le staff
CREATE POLICY "Staff can manage members"
  ON members FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Events : CRUD pour le staff
CREATE POLICY "Staff can manage events"
  ON events FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Products : CRUD pour le staff
CREATE POLICY "Staff can manage products"
  ON products FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Site settings : CRUD pour le staff
CREATE POLICY "Staff can manage site settings"
  ON site_settings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```

## 9. Fonction de mise à jour automatique

```sql
-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer sur members
CREATE TRIGGER trigger_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Appliquer sur events
CREATE TRIGGER trigger_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Appliquer sur site_settings
CREATE TRIGGER trigger_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

## 10. Storage (pour les photos)

```sql
-- Crée un bucket public pour les images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

-- Politique de lecture publique
CREATE POLICY "Public read access for images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

-- Politique d'upload pour le staff
CREATE POLICY "Staff can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Politique de suppression pour le staff
CREATE POLICY "Staff can delete images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'images' AND auth.role() = 'authenticated');
```

## 11. Créer un premier utilisateur staff

Pour créer le premier compte staff, utilise la console Supabase :

1. Va dans **Authentication > Users**
2. Clique **Add User > Create New User**
3. Renseigne :
   - Email : `president@bdeceri.fr`
   - Password : (choisis un mot de passe fort)
   - Confirme l'email automatiquement

⚠️ **Ne jamais créer de comptes via le site public** — tous les comptes sont créés manuellement dans Supabase.
