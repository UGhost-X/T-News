import { defineEventHandler, readBody } from 'h3'
import { query } from '../../../utils/db'
import { initScheduler } from '../../../utils/scheduler'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { name, task_type, cron_expression, enabled, config } = body

    const res = await query(
      `INSERT INTO tnews.scheduled_tasks (name, task_type, cron_expression, enabled, config)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, task_type, cron_expression, enabled ?? true, config || {}]
    )

    // 更新调度器
    await initScheduler()

    return res.rows[0]
  } catch (err: any) {
    return { error: err.message }
  }
})
