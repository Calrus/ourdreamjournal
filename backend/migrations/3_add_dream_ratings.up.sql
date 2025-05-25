ALTER TABLE dreams
  ADD COLUMN nightmare_rating INTEGER CHECK (nightmare_rating BETWEEN 1 AND 10),
  ADD COLUMN vividness_rating INTEGER CHECK (vividness_rating BETWEEN 1 AND 10),
  ADD COLUMN clarity_rating INTEGER CHECK (clarity_rating BETWEEN 1 AND 10),
  ADD COLUMN emotional_intensity_rating INTEGER CHECK (emotional_intensity_rating BETWEEN 1 AND 10); 