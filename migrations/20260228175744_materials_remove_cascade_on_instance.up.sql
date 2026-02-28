CREATE TABLE materials_new (
  id INTEGER PRIMARY KEY,
  material_id INTEGER,
  instance_id INTEGER,
  -- PURE / DILUTION
  type TEXT NOT NULL,
  name TEXT,
  manufacturer TEXT,
  batch_id TEXT,
  link TEXT,

  grams_available REAL NOT NULL,
  grams_initial REAL NOT NULL,

  grams_material REAL,
  grams_solvent REAL,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (material_id)
    REFERENCES materials_abstract(id)
    ON DELETE CASCADE,

  -- Remove cascade
  FOREIGN KEY (instance_id)
    REFERENCES materials(id)
    ON DELETE SET NULL
);

-- Copy data
INSERT INTO materials_new SELECT * FROM materials;

-- Drop old table
DROP TABLE materials;

-- Rename new table
ALTER TABLE materials_new RENAME TO materials;
