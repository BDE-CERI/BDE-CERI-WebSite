# 🗄️ Supabase — News, Pôles et Profils Étendus (Phase 4)

Exécute ces commandes dans le **SQL Editor** pour mettre en place les nouvelles fonctionnalités.

---

## 1. Table `poles` (Pôles du BDE)

```sql
CREATE TABLE IF NOT EXISTS poles (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,
  slug          TEXT NOT NULL UNIQUE,  -- Pour les URLs propres (ex: 'evenementiel')
  description   TEXT,
  full_content  TEXT,
  image_url     TEXT,
  icon          TEXT DEFAULT 'circle', -- Icône Material Symbols
  color         TEXT DEFAULT '#7BD0FF',
  order_index   INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_poles_order ON poles(order_index);

-- RLS
ALTER TABLE poles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Poles viewable by everyone" ON poles FOR SELECT USING (true);
CREATE POLICY "Staff can manage poles" ON poles FOR ALL 
  USING (auth.role() = 'authenticated') 
  WITH CHECK (auth.role() = 'authenticated');
```

---

## 2. Table `news` (Les News de la semaine)

```sql
CREATE TABLE IF NOT EXISTS news (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title         TEXT NOT NULL,
  content       TEXT,
  image_url     TEXT,
  is_published  BOOLEAN DEFAULT true,
  author_id     UUID REFERENCES members(id),
  published_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_news_published ON news(published_at DESC) WHERE is_published = true;

-- RLS
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "News viewable by everyone" ON news FOR SELECT USING (is_published = true);
CREATE POLICY "Staff can manage news" ON news FOR ALL 
  USING (auth.role() = 'authenticated') 
  WITH CHECK (auth.role() = 'authenticated');
```

---

## 3. Mise à jour de la table `members` (Profils complets)

```sql
ALTER TABLE members 
  ADD COLUMN IF NOT EXISTS study_level TEXT,       -- ex: 'L3 Informatique'
  ADD COLUMN IF NOT EXISTS description TEXT,       -- Bio courte pour la page équipe
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}', -- { "instagram": "...", "linkedin": "..." }
  ADD COLUMN IF NOT EXISTS pole_id UUID REFERENCES poles(id), -- Liaison au pôle
  ADD COLUMN IF NOT EXISTS is_vp BOOLEAN DEFAULT false;     -- Indique si c'est le Vice-Président du pôle

-- Index pour la recherche par pôle
CREATE INDEX IF NOT EXISTS idx_members_pole ON members(pole_id);
```

---

## 4. Données initiales pour les Pôles

```sql
INSERT INTO poles (name, slug, description, icon, color, order_index) VALUES
  ('Bureau Restreint', 'bureau',        'Le noyau décisionnel et administratif du BDE.', 'account_balance', '#FFD700', 1),
  ('Événementiel',     'evenementiel',  'Créateurs d''expériences mémorables et de soirées légendaires.', 'star', '#FF5252', 2),
  ('Communication',    'communication', 'Les magiciens du visuel et des réseaux sociaux.', 'campaign', '#448AFF', 3),
  ('Partenariats',     'partenariats',  'En quête des meilleurs deals pour les étudiants.', 'handshake', '#4CAF50', 4),
  ('Taverne',          'taverne',       'Gardiens du ravitaillement et de la convivialité.', 'local_cafe', '#FF9800', 5);
```

---

## 5. Triggers Updated_at

```sql
CREATE TRIGGER trigger_poles_updated_at BEFORE UPDATE ON poles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_news_updated_at BEFORE UPDATE ON news FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 6. Bucket Storage pour les News

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'news-images',
  'news-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Politiques News Images
CREATE POLICY "Public read news-images" ON storage.objects FOR SELECT USING (bucket_id = 'news-images');
CREATE POLICY "Auth upload news-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'news-images' AND auth.role() = 'authenticated');
CREATE POLICY "Auth delete news-images" ON storage.objects FOR DELETE USING (bucket_id = 'news-images' AND auth.role() = 'authenticated');
```
