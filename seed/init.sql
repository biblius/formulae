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
  'AC',
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
  'AC',
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
  'AC',
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
  'AC',
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
  'AC',
  'FLORAL',
  'FLORAL',
  '24851-98-7',
  'MIDDLE',
  'lightgreen'
);

INSERT INTO material_tags VALUES
-- Patchouli EO
(0, 'WOODY', 'lightbrown'),
(0, 'PATCHOULI', 'brown'),
(0, 'EARTH', 'brown'),
(0, 'HUMID', 'darkgreen'),

-- ISO E Super
(1, 'WOODY', 'lightbrown'),
(1, 'DIFFUSIVE', 'lightgray'),

-- Lavender EO
(2, 'FLORAL', 'lightgreen'),
(2, 'HERBAL', 'green'),
(2, 'FRESH', 'lightblue'),

-- Clearwood
(3, 'WOODY', 'lightbrown'),
(3, 'PATCHOULI', 'brown'),

-- Vanillin
(4, 'SWEET', 'ivory'),

-- Frankincense Resin
(5, 'RESINOUS', 'amber'),
(5, 'INCENSE', 'smoke'),
(5, 'BALSAMIC', 'brown'),

-- Ambroxan
(6, 'AMBERGRIS', 'brown'),
(6, 'ANIMALIC', 'brown'),
(6, 'DIFFUSIVE', 'lightgray'),

-- Hedione
(7, 'JASMIN', 'white'),
(2, 'FLORAL', 'lightgreen');

INSERT INTO materials VALUES
(
  0,
  0,
  'RAW',
  'Patchouli EO RAW',
  'Local',
  'BATCH-PATCH-001',
  NULL,
  50.0,
  50.0,
  NULL,
  datetime('now')
),
(
  1,
  1,
  'RAW',
  'ISO E Super RAW',
  'IFF',
  'BATCH-ISOE-001',
  'https://fraterworks.com/products/iso-e-super',
  100.0,
  100.0,
  NULL,
  datetime('now')
),
(
  2,
  2,
  'RAW',
  'Lavender EO RAW',
  'Local',
  NULL,
  NULL,
  30.0,
  30.0,
  NULL,
  datetime('now')
),
(
  3,
  3,
  'RAW',
  'Clearwood RAW',
  'Firmenich',
  'BATCH-CLEAR-001',
  'https://fraterworks.com/products/clearwood',
  20.0,
  20.0,
  NULL,
  datetime('now')
),
(
  4,
  4,
  'RAW',
  'Vanillin RAW',
  'Fraterworks',
  'BATCH-VAN-001',
  'https://fraterworks.com/products/vanillin',
  40.0,
  40.0,
  NULL,
  datetime('now')
),
(
  5,
  5,
  'RAW',
  'Frankincense EO RAW',
  'Fraterworks',
  'BATCH-FRANK-001',
  'https://fraterworks.com/products/frankincense-oil-somalia',
  15.0,
  15.0,
  NULL,
  datetime('now')
),
(
  6,
  6,
  'RAW',
  'Ambrofix RAW',
  'Givaudan',
  'BATCH-AMB-001',
  'https://fraterworks.com/products/ambrofix',
  25.0,
  25.0,
  NULL,
  datetime('now')
),
(
  7,
  7,
  'RAW',
  'Hedione RAW',
  'Firmenich',
  'BATCH-HED-001',
  'https://fraterworks.com/products/hedione',
  18.0,
  18.0,
  NULL,
  datetime('now')
);

