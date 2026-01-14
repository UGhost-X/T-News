-- Add content_snippet and crawled_at columns to news_items
ALTER TABLE tnews.news_items ADD COLUMN IF NOT EXISTS content_snippet text;
ALTER TABLE tnews.news_items ADD COLUMN IF NOT EXISTS crawled_at timestamptz;
