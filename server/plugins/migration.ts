import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { query } from '../utils/db'

export default defineNitroPlugin(async (nitroApp) => {
  try {
    await query('ALTER TABLE tnews.ai_settings ADD COLUMN IF NOT EXISTS match_threshold double precision')
    await query('ALTER TABLE tnews.ai_settings ADD COLUMN IF NOT EXISTS embedding_model_id text')
    await query('ALTER TABLE tnews.ai_settings ADD COLUMN IF NOT EXISTS rerank_model_id text')

    // Ensure scheduled tasks exist
    // Update task_type check constraint
    try {
      await query(`ALTER TABLE tnews.scheduled_tasks DROP CONSTRAINT IF EXISTS scheduled_tasks_task_type_check`)
      await query(`ALTER TABLE tnews.scheduled_tasks ADD CONSTRAINT scheduled_tasks_task_type_check CHECK (task_type IN ('rss_update', 'ai_summary', 'news_crawl', 'embedding_generation'))`)
    } catch (e) {
      console.warn('Failed to update scheduled_tasks constraint (it might not exist yet):', e)
    }

    await query(`
      INSERT INTO tnews.scheduled_tasks (name, task_type, cron_expression, enabled)
      SELECT 'Embedding Generation', 'embedding_generation', '0 */4 * * *', false
      WHERE NOT EXISTS (SELECT 1 FROM tnews.scheduled_tasks WHERE task_type = 'embedding_generation')
    `)

    console.log('Database schema ensured.')
  } catch (e) {
    console.error('Migration failed:', e)
  }
})
