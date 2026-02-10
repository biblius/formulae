-- TODO: Use link with CAS number
-- https://ifrafragrance.org/standards-library?query=68155-66-8

-- Blueprints for materials
CREATE TABLE materials_abstract(
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  -- EO - Essential oil
  -- AC - Aromachemical
  -- NA - Natural absolute
  -- CO - CO2 extract
  type TEXT NOT NULL,
  -- WOODY / ORIENTAL / FLORAL/ FRESH
  family TEXT,
  -- See above
  subfamily TEXT,
  -- TODO: use this to link to IFRA standards library above
  cas_number TEXT,
  -- BASE / MIDDLE / TOP
  classification TEXT,
  -- Display purposes
  color TEXT
);

-- User defined tags for material management
CREATE TABLE material_tags(
  material_id INTEGER NOT NULL,
  value TEXT NOT NULL,
  FOREIGN KEY (material_id) REFERENCES materials_abstract(id) ON DELETE CASCADE
);

-- Links to materials
CREATE TABLE material_links(
  material_id INTEGER NOT NULL,
  value TEXT NOT NULL,
  FOREIGN KEY (material_id) REFERENCES materials_abstract(id) ON DELETE CASCADE
);

-- Material instances, i.e. those available
CREATE TABLE materials(
  id INTEGER PRIMARY KEY,
  material_id INTEGER,
  instance_id INTEGER,
  -- PURE / DILUTION
  type TEXT NOT NULL,
  name TEXT,
  manufacturer TEXT,
  batch_id TEXT,
  link TEXT,

  -- Always present and refers to totals
  grams_available REAL NOT NULL,
  grams_initial REAL NOT NULL,

  -- Only present when type == DILUTION
  grams_material REAL,
  grams_solvent REAL,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (material_id) REFERENCES materials_abstract(id) ON DELETE CASCADE,
  FOREIGN KEY (instance_id) REFERENCES materials(id) ON DELETE CASCADE
);

-- Recipes for combinations of materials
CREATE TABLE formulae(
  id INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  grams_total REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tracks materials of a formula
CREATE TABLE formula_materials(
  material_id INTEGER NOT NULL,
  formula_id INTEGER NOT NULL,
  grams REAL NOT NULL CHECK (grams > 0),
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
  FOREIGN KEY (formula_id) REFERENCES formulae(id) ON DELETE CASCADE
);

-- Formula notes
CREATE TABLE formula_notes(
  id INTEGER PRIMARY KEY NOT NULL,
  formula_id INTEGER NOT NULL,
  content TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (formula_id) REFERENCES formulae(id) ON DELETE CASCADE
);

CREATE TABLE material_history(
  id INTEGER PRIMARY KEY NOT NULL,
  material_id INTEGER NOT NULL,
  target_id INTEGER NOT NULL,
  target_type TEXT NOT NULL,
  grams REAL NOT NULL CHECK (grams > 0),
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);
