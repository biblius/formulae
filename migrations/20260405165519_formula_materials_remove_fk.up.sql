CREATE TABLE formula_materials_new (
  -- Indicates name of the material/formula used originally, in case the inventory
  -- entry ever gets deleted
  name TEXT NOT NULL,

  -- Points to either the material or formula ID used as the material.
  material_id INTEGER NOT NULL,

  -- Points to the parent formula the material is for.
  formula_id INTEGER NOT NULL,

  -- How much of the material/mixture is used including any of its solvent. 
  grams REAL NOT NULL CHECK (grams > 0),

  -- How much actual raw material is being added.
  grams_material REAL,

  -- How much solvent is being added as part of the material/mixture.
  grams_solvent REAL,

  -- MATERIAL / MIXTURE
  type TEXT NOT NULL,

  -- If the material is coming from another formula (mixture), this will be the original formula's ID.
  origin INTEGER
);

INSERT INTO formula_materials_new (
  name,
  material_id,
  formula_id,
  grams,
  grams_material,
  grams_solvent,
  type,
  origin
)
SELECT 
  COALESCE(m.name, ''),
  fm.material_id,
  fm.formula_id,
  fm.grams,
  (
    -- Yields the ratio. App logic ensures when grams_material is present, so is grams_solvent.
    -- If either is null, grams_initial over itself yields 1, which means undiluted
    -- If present, yields material / material + solvent.
    COALESCE(m.grams_material, m.grams_initial) / 
    (COALESCE(m.grams_material, m.grams_initial) + COALESCE(m.grams_solvent, 0))
  ) * fm.grams,
  (
    COALESCE(m.grams_solvent, 0) / 
    -- Coalesce to total so we don't divide by 0
    (COALESCE(m.grams_material, m.grams_initial) + COALESCE(m.grams_solvent, 0))
  ) * fm.grams,
  fm.type,
  NULL
FROM formula_materials fm
LEFT JOIN materials m ON m.id = fm.material_id;

DROP TABLE formula_materials;

ALTER TABLE formula_materials_new RENAME TO formula_materials;

-- Include solvent cause it makes the math easier 

ALTER TABLE formulae ADD COLUMN grams_solvent REAL;

UPDATE formulae SET grams_solvent = grams_total - (SELECT SUM(grams) FROM formula_materials fm WHERE fm.formula_id = id);
