CREATE TABLE formula_materials_new (
  name TEXT NOT NULL,
  material_id INTEGER NOT NULL,
  formula_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  grams REAL NOT NULL CHECK (grams > 0)
);

INSERT INTO formula_materials_new 
  (name, material_id, formula_id, grams, type)
SELECT 
   COALESCE(m.name, ''), fm.material_id, fm.formula_id, fm.grams, fm.type FROM formula_materials fm
LEFT JOIN materials m ON m.id = fm.material_id;

DROP TABLE formula_materials;

ALTER TABLE formula_materials_new RENAME TO formula_materials;

-- Include solvent cause it makes the math easier 

ALTER TABLE formulae ADD COLUMN grams_solvent REAL;

UPDATE formulae SET grams_solvent = grams_total - (SELECT SUM(grams) FROM formula_materials fm WHERE fm.formula_id = id);
