# 🗄️ Supabase — Champs de Contenu Riche (Phase 3)

Exécute ces commandes dans le **SQL Editor** pour activer les pages de détails dynamiques.

---

## 1. Mise à jour de la table `events`

```sql
-- Ajout des colonnes pour le contenu détaillé
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS full_content TEXT,
  ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS max_capacity INTEGER,
  ADD COLUMN IF NOT EXISTS precise_location TEXT;

-- Index pour les recherches par ID (déjà géré par la PK mais pour rappel)
CREATE INDEX IF NOT EXISTS idx_events_id ON events(id);
```

---

## 2. Mise à jour de la table `taverne_items`

```sql
-- Ajout des colonnes pour la boutique (taverne)
ALTER TABLE taverne_items
  ADD COLUMN IF NOT EXISTS full_content TEXT,
  ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';
```

---

## 3. Mise à jour de la table `products` (Branding)

```sql
-- Ajout des colonnes pour la boutique (branding)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS full_content TEXT,
  ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';
```

---

## 4. Row Level Security — Vérification

Les politiques existantes (lecture publique, écriture staff) s'appliquent automatiquement aux nouvelles colonnes. Aucun changement requis si `supabase.md` et `supabase2.md` ont été exécutés.

---

## 5. Exemple d'insertion avec Galerie

```sql
-- Exemple de mise à jour d'un événement existant
UPDATE events
SET 
  full_content = 'Préparez-vous pour le Gala annuel... Au programme : musique, danse et mystère.',
  gallery_urls = ARRAY[
    'https://example.com/photo1.jpg',
    'https://example.com/photo2.jpg'
  ],
  max_capacity = 250,
  precise_location = 'Salle des Fêtes - Avignon Centre'
WHERE title = 'The Midnight Gala';
```
