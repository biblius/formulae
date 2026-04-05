CREATE TABLE formula_materials_old (
  material_id INTEGER NOT NULL,
  formula_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  grams REAL NOT NULL CHECK (grams > 0)
);

INSERT INTO formula_materials_old 
  (material_id, formula_id, grams, type)
SELECT 
  material_id, formula_id, grams, type
FROM formula_materials;

DROP TABLE formula_materials;

ALTER TABLE formula_materials_old RENAME TO formula_materials;
