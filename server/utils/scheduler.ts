import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const cron = require('node-cron')
import type { ScheduledTask } from 'node-cron'
import { query } from './db'
import { runRssUpdate, runAiSummary } from './tasks'

const jobs: Record<string, ScheduledTask> = {}

export async function initScheduler() {
  console.log('Initializing scheduler...')
  
  // 停止现有任务
  Object.values(jobs).forEach(job => job.stop())
  for (const key in jobs) delete jobs[key]

  const tasksRes = await query('SELECT * FROM tnews.scheduled_tasks WHERE enabled = true')
  
  for (const task of tasksRes.rows) {
    const { id, name, task_type, cron_expression } = task
    
    if (!cron.validate(cron_expression)) {
      console.error(`Invalid cron expression for task ${name}: ${cron_expression}`)
      continue
    }

    const job = cron.schedule(cron_expression, async () => {
      console.log(`Running scheduled task: ${name} (${task_type})`)
      
      try {
        await query(
          'UPDATE tnews.scheduled_tasks SET last_run_at = now(), last_status = $1 WHERE id = $2',
          ['running', id]
        )

        let result
        if (task_type === 'rss_update') {
          result = await runRssUpdate()
        } else if (task_type === 'ai_summary') {
          result = await runAiSummary()
        }

        await query(
          'UPDATE tnews.scheduled_tasks SET last_status = $1, last_run_at = now() WHERE id = $2',
          ['success', id]
        )
        console.log(`Task ${name} completed successfully.`)
      } catch (err: any) {
        console.error(`Task ${name} failed:`, err)
        await query(
          'UPDATE tnews.scheduled_tasks SET last_status = $1, last_error = $2, last_run_at = now() WHERE id = $3',
          ['error', err.message, id]
        )
      }
    })

    jobs[id] = job
    console.log(`Scheduled task ${name} with expression ${cron_expression}`)
  }
}

// 导出以便手动触发或更新
export { jobs }
