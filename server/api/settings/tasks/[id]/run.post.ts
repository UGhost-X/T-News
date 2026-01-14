import { defineEventHandler, getRouterParam } from 'h3'
import { query } from '../../../../utils/db'
import { runRssUpdate, runAiSummary, runNewsCrawl } from '../../../../utils/tasks'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    const taskRes = await query('SELECT * FROM tnews.scheduled_tasks WHERE id = $1', [id])
    if (taskRes.rows.length === 0) {
      return { error: 'Task not found' }
    }
    
    const task = taskRes.rows[0]
    let result

    // 记录开始运行
    await query(
      'UPDATE tnews.scheduled_tasks SET last_run_at = now(), last_status = $1 WHERE id = $2',
      ['running', id]
    )

    try {
      if (task.task_type === 'rss_update') {
        result = await runRssUpdate()
      } else if (task.task_type === 'ai_summary') {
        result = await runAiSummary()
      } else if (task.task_type === 'news_crawl') {
        result = await runNewsCrawl()
      }

      await query(
        'UPDATE tnews.scheduled_tasks SET last_status = $1, last_run_at = now() WHERE id = $2',
        ['success', id]
      )
    } catch (err: any) {
      await query(
        'UPDATE tnews.scheduled_tasks SET last_status = $1, last_error = $2, last_run_at = now() WHERE id = $3',
        ['error', err.message, id]
      )
      throw err
    }

    return { success: true, result }
  } catch (err: any) {
    return { error: err.message }
  }
})
