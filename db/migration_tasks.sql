-- Scheduled Tasks Table
CREATE TABLE IF NOT EXISTS tnews.scheduled_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  task_type text NOT NULL CHECK (task_type IN ('rss_update', 'ai_summary', 'news_crawl')),
  cron_expression text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  last_run_at timestamptz,
  next_run_at timestamptz,
  last_status text CHECK (last_status IN ('success', 'error', 'running')),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS scheduled_tasks_set_updated_at ON tnews.scheduled_tasks;
CREATE TRIGGER scheduled_tasks_set_updated_at BEFORE UPDATE ON tnews.scheduled_tasks FOR EACH ROW EXECUTE FUNCTION tnews.set_updated_at();

-- Seed some default tasks
INSERT INTO tnews.scheduled_tasks (name, task_type, cron_expression, enabled)
VALUES 
  ('定时更新RSS新闻', 'rss_update', '0 */2 * * *', true),
  ('定时生成AI摘要', 'ai_summary', '30 */2 * * *', true),
  ('定时爬取新闻原文', 'news_crawl', '0 1 * * *', true)
ON CONFLICT DO NOTHING;
