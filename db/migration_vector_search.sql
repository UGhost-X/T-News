CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE tnews.ai_models ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'llm' CHECK (type IN ('llm', 'embedding', 'rerank'));

ALTER TABLE tnews.news_items ADD COLUMN IF NOT EXISTS embedding vector(1024);

ALTER TABLE tnews.ai_settings ADD COLUMN IF NOT EXISTS embedding_model_id text;
ALTER TABLE tnews.ai_settings ADD COLUMN IF NOT EXISTS rerank_model_id text;
ALTER TABLE tnews.ai_settings ADD COLUMN IF NOT EXISTS match_threshold double precision;
