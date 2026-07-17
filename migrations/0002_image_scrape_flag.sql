-- Tracks whether we've already attempted an og:image scrape fallback for an
-- article, so we never retry indefinitely (scrape once, cache forever).
ALTER TABLE articles ADD COLUMN image_scrape_attempted INTEGER NOT NULL DEFAULT 0;
