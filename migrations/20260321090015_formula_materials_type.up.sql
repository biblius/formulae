ALTER TABLE formula_materials ADD COLUMN type TEXT NOT NULL DEFAULT 'MATERIAL';
ALTER TABLE formulae ADD COLUMN grams_available;
UPDATE formulae SET grams_available = grams_total WHERE type = 'MIXTURE';
