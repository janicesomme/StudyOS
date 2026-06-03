-- reagents: system-wide reference table for verified ochem reagent facts.
-- Shared across all students -- not per-student data.
-- Public SELECT via anon key; inserts require service role (extraction script only).

CREATE TABLE reagents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  abbreviation          TEXT,
  full_name             TEXT NOT NULL,
  smiles                TEXT,
  what_it_does          TEXT NOT NULL,
  mechanism_type        TEXT,
  reaction_types        TEXT[] DEFAULT '{}',
  stereochemistry_notes TEXT,
  conditions            TEXT,
  similar_reagents      TEXT[] DEFAULT '{}',
  pka_relevance         TEXT,
  verified_source       TEXT NOT NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reagents_full_name    ON reagents (lower(full_name));
CREATE INDEX idx_reagents_abbreviation ON reagents (lower(abbreviation));

ALTER TABLE reagents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reagents_public_read" ON reagents FOR SELECT USING (true);
