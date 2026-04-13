UPDATE formulae
SET
  grams_available = grams_total
WHERE
  type = 'MIXTURE';
