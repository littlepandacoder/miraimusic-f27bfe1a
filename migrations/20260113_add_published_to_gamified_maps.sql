-- Add published boolean to gamified_maps so faculty can publish/unpublish maps
ALTER TABLE IF EXISTS gamified_maps
ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false;

-- Backfill existing rows to false if null (defensive)
UPDATE gamified_maps SET published = false WHERE published IS NULL;

-- Create an index for quick lookup of published maps
CREATE INDEX IF NOT EXISTS idx_gamified_maps_published ON gamified_maps (published);
