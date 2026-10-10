-- AJOUT DE LA GESTION DES STOCKS ET DES TAILLES

-- 1. Ajout des colonnes aux articles de la taverne
ALTER TABLE taverne_items 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- 2. Ajout des colonnes aux articles boutique (branding)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT NULL;

-- 3. Mise à jour de la politique de sécurité pour permettre la lecture par tous
-- (Déjà normalement actif via les politiques existantes, mais au cas où)
-- Les colonnes sont maintenant prêtes à être utilisées par les serveurs et clients.
