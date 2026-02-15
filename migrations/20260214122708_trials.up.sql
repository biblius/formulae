-- Scent strip trials
CREATE TABLE trials(
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tracks materials of a trial
CREATE TABLE trial_materials(
  id INTEGER PRIMARY KEY,
  material_id INTEGER,
  trial_id INTEGER NOT NULL,
  FOREIGN KEY (material_id) REFERENCES materials_abstract(id) ON DELETE SET NULL,
  FOREIGN KEY (trial_id) REFERENCES trials(id) ON DELETE CASCADE
);

-- Trial notes
CREATE TABLE trial_notes(
  id INTEGER PRIMARY KEY,
  trial_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (trial_id) REFERENCES trials(id) ON DELETE CASCADE
);
