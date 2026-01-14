CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA IF NOT EXISTS tnews;
SET search_path TO tnews, public;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'sentiment' AND n.nspname = 'tnews'
  ) THEN
    CREATE TYPE tnews.sentiment AS ENUM ('positive', 'neutral', 'negative');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION tnews.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS tnews.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  username citext NOT NULL UNIQUE,
  password_hash text NOT NULL,
  password_algo text NOT NULL DEFAULT 'bcrypt',
  display_name text,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  is_admin boolean NOT NULL DEFAULT false,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS users_set_updated_at ON tnews.users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON tnews.users
FOR EACH ROW
EXECUTE FUNCTION tnews.set_updated_at();

CREATE TABLE IF NOT EXISTS tnews.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES tnews.users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON tnews.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_expires_at_idx ON tnews.user_sessions(expires_at);

CREATE TABLE IF NOT EXISTS tnews.rss_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL UNIQUE,
  owner_user_id uuid REFERENCES tnews.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  category text NOT NULL,
  color text,
  icon text,
  enabled boolean NOT NULL DEFAULT true,
  last_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS rss_sources_global_url_unique_idx
ON tnews.rss_sources(url)
WHERE owner_user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS rss_sources_user_url_unique_idx
ON tnews.rss_sources(owner_user_id, url)
WHERE owner_user_id IS NOT NULL;

DROP TRIGGER IF EXISTS rss_sources_set_updated_at ON tnews.rss_sources;
CREATE TRIGGER rss_sources_set_updated_at
BEFORE UPDATE ON tnews.rss_sources
FOR EACH ROW
EXECUTE FUNCTION tnews.set_updated_at();

CREATE TABLE IF NOT EXISTS tnews.user_rss_subscriptions (
  user_id uuid NOT NULL REFERENCES tnews.users(id) ON DELETE CASCADE,
  rss_source_id uuid NOT NULL REFERENCES tnews.rss_sources(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, rss_source_id)
);

DROP TRIGGER IF EXISTS user_rss_subscriptions_set_updated_at ON tnews.user_rss_subscriptions;
CREATE TRIGGER user_rss_subscriptions_set_updated_at
BEFORE UPDATE ON tnews.user_rss_subscriptions
FOR EACH ROW
EXECUTE FUNCTION tnews.set_updated_at();

CREATE TABLE IF NOT EXISTS tnews.rss_fetch_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rss_source_id uuid NOT NULL REFERENCES tnews.rss_sources(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'error')),
  error text,
  http_status integer,
  etag text,
  last_modified text,
  items_fetched integer NOT NULL DEFAULT 0,
  items_new integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS rss_fetch_runs_source_started_idx
ON tnews.rss_fetch_runs(rss_source_id, started_at DESC);

CREATE TABLE IF NOT EXISTS tnews.rss_items (
  id bigserial PRIMARY KEY,
  rss_source_id uuid NOT NULL REFERENCES tnews.rss_sources(id) ON DELETE CASCADE,
  guid text,
  url text,
  title text NOT NULL,
  author text,
  published_at timestamptz,
  content_text text,
  content_html text,
  raw jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS rss_items_guid_unique_idx
ON tnews.rss_items(rss_source_id, guid)
WHERE guid IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS rss_items_url_unique_idx
ON tnews.rss_items(rss_source_id, url)
WHERE guid IS NULL AND url IS NOT NULL;

CREATE INDEX IF NOT EXISTS rss_items_published_at_idx ON tnews.rss_items(published_at DESC);
CREATE INDEX IF NOT EXISTS rss_items_source_published_idx ON tnews.rss_items(rss_source_id, published_at DESC);

DROP TRIGGER IF EXISTS rss_items_set_updated_at ON tnews.rss_items;
CREATE TRIGGER rss_items_set_updated_at
BEFORE UPDATE ON tnews.rss_items
FOR EACH ROW
EXECUTE FUNCTION tnews.set_updated_at();

CREATE TABLE IF NOT EXISTS tnews.news_items (
  id bigserial PRIMARY KEY,
  rss_item_id bigint UNIQUE REFERENCES tnews.rss_items(id) ON DELETE SET NULL,
  title text NOT NULL,
  source_name text NOT NULL,
  source_key text NOT NULL,
  url text,
  original_content text NOT NULL,
  ai_summary text,
  ai_processed boolean NOT NULL DEFAULT false,
  ai_highlight boolean NOT NULL DEFAULT false,
  category text NOT NULL,
  sentiment tnews.sentiment NOT NULL DEFAULT 'neutral',
  importance integer NOT NULL DEFAULT 1 CHECK (importance >= 0 AND importance <= 10),
  similar_sources text[] NOT NULL DEFAULT '{}'::text[],
  tags text[] NOT NULL DEFAULT '{}'::text[],
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS news_items_published_at_idx ON tnews.news_items(published_at DESC);
CREATE INDEX IF NOT EXISTS news_items_source_key_published_idx ON tnews.news_items(source_key, published_at DESC);
CREATE INDEX IF NOT EXISTS news_items_category_published_idx ON tnews.news_items(category, published_at DESC);
CREATE INDEX IF NOT EXISTS news_items_tags_gin_idx ON tnews.news_items USING GIN (tags);

DROP TRIGGER IF EXISTS news_items_set_updated_at ON tnews.news_items;
CREATE TRIGGER news_items_set_updated_at
BEFORE UPDATE ON tnews.news_items
FOR EACH ROW
EXECUTE FUNCTION tnews.set_updated_at();

CREATE TABLE IF NOT EXISTS tnews.ai_summaries (
  id bigserial PRIMARY KEY,
  news_item_id bigint NOT NULL REFERENCES tnews.news_items(id) ON DELETE CASCADE,
  provider text NOT NULL,
  model_id text,
  model_name text,
  temperature numeric,
  prompt text,
  summary text NOT NULL,
  raw_response jsonb,
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error')),
  error text,
  tokens_input integer,
  tokens_output integer,
  latency_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_summaries_news_item_id_idx ON tnews.ai_summaries(news_item_id);
CREATE INDEX IF NOT EXISTS ai_summaries_created_at_idx ON tnews.ai_summaries(created_at DESC);

CREATE TABLE IF NOT EXISTS tnews.user_news_bookmarks (
  user_id uuid NOT NULL REFERENCES tnews.users(id) ON DELETE CASCADE,
  news_item_id bigint NOT NULL REFERENCES tnews.news_items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, news_item_id)
);

INSERT INTO tnews.rss_sources (source_key, name, url, category, color, icon, enabled, last_updated_at)
VALUES
  ('bbc', 'BBC新闻', 'http://feeds.bbci.co.uk/news/rss.xml', 'international', '#FF5733', 'globe-europe', true, '2023-10-15 09:30'::timestamptz),
  ('reuters', '路透社', 'http://feeds.reuters.com/reuters/topNews', 'finance', '#3498db', 'newspaper', true, '2023-10-15 10:15'::timestamptz),
  ('techcrunch', 'TechCrunch', 'http://feeds.feedburner.com/TechCrunch/', 'tech', '#e74c3c', 'microchip', true, '2023-10-15 08:45'::timestamptz),
  ('nytimes', '纽约时报', 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', 'general', '#2c3e50', 'landmark', true, '2023-10-15 11:20'::timestamptz),
  ('guardian', '卫报', 'https://www.theguardian.com/world/rss', 'international', '#14284B', 'shield-alt', false, '2023-10-14 16:30'::timestamptz)
ON CONFLICT (source_key) DO UPDATE
SET
  name = EXCLUDED.name,
  url = EXCLUDED.url,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  enabled = EXCLUDED.enabled,
  last_updated_at = EXCLUDED.last_updated_at,
  updated_at = now();

-- AI Settings Table
CREATE TABLE IF NOT EXISTS tnews.ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES tnews.users(id) ON DELETE CASCADE,
  summary_length integer NOT NULL DEFAULT 5,
  sentiment_sensitivity integer NOT NULL DEFAULT 7,
  importance_threshold integer NOT NULL DEFAULT 6,
  active_model_id text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- AI Models Table
CREATE TABLE IF NOT EXISTS tnews.ai_models (
  id text PRIMARY KEY,
  user_id uuid REFERENCES tnews.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  provider text NOT NULL,
  model_name text NOT NULL,
  base_url text,
  api_key text,
  temperature numeric DEFAULT 0.7,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Proxy Settings Table
CREATE TABLE IF NOT EXISTS tnews.proxy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES tnews.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  host text NOT NULL DEFAULT '127.0.0.1',
  port integer NOT NULL DEFAULT 7890,
  protocol text NOT NULL DEFAULT 'http',
  username text,
  password text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS ai_settings_set_updated_at ON tnews.ai_settings;
CREATE TRIGGER ai_settings_set_updated_at BEFORE UPDATE ON tnews.ai_settings FOR EACH ROW EXECUTE FUNCTION tnews.set_updated_at();

DROP TRIGGER IF EXISTS ai_models_set_updated_at ON tnews.ai_models;
CREATE TRIGGER ai_models_set_updated_at BEFORE UPDATE ON tnews.ai_models FOR EACH ROW EXECUTE FUNCTION tnews.set_updated_at();

DROP TRIGGER IF EXISTS proxy_settings_set_updated_at ON tnews.proxy_settings;
CREATE TRIGGER proxy_settings_set_updated_at BEFORE UPDATE ON tnews.proxy_settings FOR EACH ROW EXECUTE FUNCTION tnews.set_updated_at();
