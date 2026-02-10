INSERT INTO materials_abstract VALUES
(
  0,
  'Patchouli',
  'Earthy wonder, perfumery staple. Can be overwhelming, use sparingly!',
  'EO',
  'ORIENTAL',
  'WOODY ORIENTAL',
  '8014-09-3',
  'BASE',
  'brown'
),
(
  1,
  'ISO E Super',
  'Smooth and diffusive. Adds volume and softness without heaviness.',
  'SY',
  'WOODY',
  NULL,
  '54464-57-2',
  'MIDDLE',
  NULL
),
(
  2,
  'Lavender',
  'Fresh, herbal floral with calming facets. Brings cleanliness and lift.',
  'EO',
  'FRESH',
  'AROMATIC',
  '8000-28-0',
  'TOP',
  NULL
),
(
  3,
  'Clearwood',
  'Clean, modern patchouli fraction. Woody, soft, and very diffusive.',
  'SY',
  'WOODY',
  NULL,
  '1450625-49-6',
  'BASE',
  'green'
),
(
  4,
  'Vanillin',
  'Sweet, creamy vanilla note. Adds warmth, comfort, and softness.',
  'SY',
  'ORIENTAL',
  'SOFT ORIENTAL',
  '121-33-5',
  'BASE',
  'yellow'
),
(
  5,
  'Frankincense',
  'Herbal goodness.',
  'EO',
  'ORIENTAL',
  'ORIENTAL',
  '8050-07-5',
  'BASE',
  'darkgreen'
),
(
  6,
  'Ambroxan',
  'Dry, mineral woody note with exceptional diffusion and longevity.',
  'SY',
  'WOODY',
  'DRY WOODS',
  '6790-58-5',
  'BASE',
  NULL
),
(
  7,
  'Hedione',
  'Radiant, jasmine-like floral. Adds airiness, diffusion, and lift.',
  'SY',
  'FLORAL',
  'FLORAL',
  '24851-98-7',
  'MIDDLE',
  'lightgreen'
);

INSERT INTO material_tags VALUES
-- Patchouli EO
(0, 'WOODY'),
(0, 'PATCHOULI'),
(0, 'EARTH'),
(0, 'HUMID'),

-- ISO E Super
(1, 'WOODY'),
(1, 'DIFFUSIVE'),

-- Lavender EO
(2, 'FLORAL'),
(2, 'HERBAL'),
(2, 'FRESH'),

-- Clearwood
(3, 'WOODY'),
(3, 'PATCHOULI'),

-- Vanillin
(4, 'SWEET'),

-- Frankincense Resin
(5, 'RESINOUS'),
(5, 'INCENSE'),
(5, 'BALSAMIC'),

-- Ambroxan
(6, 'AMBERGRIS'),
(6, 'ANIMALIC'),
(6, 'DIFFUSIVE'),

-- Hedione
(7, 'JASMIN'),
(2, 'FLORAL');

INSERT INTO materials(
  id,
  material_id,
  type,
  name,
  manufacturer,
  batch_id,
  link,
  grams_available,
  grams_initial,
  created_at
) VALUES
(
  0,
  0,
  'PURE',
  'Patchouli EO PURE',
  'Local',
  'BATCH-PATCH-001',
  NULL,
  50.0,
  50.0,
  datetime('now')
),
(
  1,
  1,
  'PURE',
  'ISO E Super PURE',
  'IFF',
  'BATCH-ISOE-001',
  'https://fraterworks.com/products/iso-e-super',
  100.0,
  100.0,
  datetime('now')
),
(
  2,
  2,
  'PURE',
  'Lavender EO PURE',
  'Local',
  NULL,
  NULL,
  30.0,
  30.0,
  datetime('now')
),
(
  3,
  3,
  'PURE',
  'Clearwood PURE',
  'Firmenich',
  'BATCH-CLEAR-001',
  'https://fraterworks.com/products/clearwood',
  20.0,
  20.0,
  datetime('now')
),
(
  4,
  4,
  'PURE',
  'Vanillin PURE',
  'Fraterworks',
  'BATCH-VAN-001',
  'https://fraterworks.com/products/vanillin',
  40.0,
  40.0,
  datetime('now')
),
(
  5,
  5,
  'PURE',
  'Frankincense EO PURE',
  'Fraterworks',
  'BATCH-FRANK-001',
  'https://fraterworks.com/products/frankincense-oil-somalia',
  15.0,
  15.0,
  datetime('now')
),
(
  6,
  6,
  'PURE',
  'Ambrofix PURE',
  'Givaudan',
  'BATCH-AMB-001',
  'https://fraterworks.com/products/ambrofix',
  25.0,
  25.0,
  datetime('now')
),
(
  7,
  7,
  'PURE',
  'Hedione PURE',
  'Firmenich',
  'BATCH-HED-001',
  'https://fraterworks.com/products/hedione',
  18.0,
  18.0,
  datetime('now')
);

