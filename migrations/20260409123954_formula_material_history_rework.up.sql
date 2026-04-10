CREATE TABLE material_history_new (
  id INTEGER PRIMARY KEY NOT NULL,
  source_id INTEGER NOT NULL,
  source_name TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  target_name TEXT NOT NULL,
  target_type TEXT NOT NULL,
  grams REAL NOT NULL,
  type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime ('now'))
);

INSERT INTO
  material_history_new (
    id,
    source_id,
    source_name,
    target_id,
    target_name,
    target_type,
    grams,
    type,
    created_at
  )
SELECT
  mh.id,
  mh.material_id,
  morigin.name,
  mh.target_id,
  mdest.name,
  mh.target_type,
  mh.grams,
  'MATERIAL',
  mh.created_at
FROM
  material_history mh
  LEFT JOIN materials morigin ON morigin.id = mh.material_id
  LEFT JOIN materials mdest ON mdest.id = mh.target_id
WHERE
  mh.target_type = 'DILUTION';

INSERT INTO
  material_history_new (
    id,
    source_id,
    source_name,
    target_id,
    target_name,
    target_type,
    grams,
    type,
    created_at
  )
SELECT
  mh.id,
  mh.material_id,
  morigin.name,
  mh.target_id,
  fdest.name,
  mh.target_type,
  mh.grams,
  'MATERIAL',
  mh.created_at
FROM
  material_history mh
  LEFT JOIN materials morigin ON morigin.id = mh.material_id
  LEFT JOIN formulae fdest ON fdest.id = mh.target_id
WHERE
  mh.target_type = 'FORMULA';

DROP TABLE material_history;

ALTER TABLE material_history_new
RENAME TO material_history;
