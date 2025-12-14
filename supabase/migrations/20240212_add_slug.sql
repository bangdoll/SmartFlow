-- Migration: Add slug column to updated schema

-- 1. Add column (nullable first to allow existing rows)
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS slug text;

-- 2. Add unique constraint
ALTER TABLE news_items ADD CONSTRAINT news_items_slug_key UNIQUE (slug);

-- 3. Add index for performance lookup
CREATE INDEX IF NOT EXISTS idx_news_items_slug ON news_items(slug);
