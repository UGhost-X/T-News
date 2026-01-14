import { defineEventHandler, readBody, getRouterParam } from 'h3'
import { query } from '../../../utils/db'
import { initScheduler } from '../../../utils/scheduler'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { name, task_type, cron_expression, enabled, config } = body

    const res = await query(
      `UPDATE tnews.scheduled_tasks 
       SET name = $1, task_type = $2, cron_expression = $3, enabled = $4, config = $5, updated_at = now()
       WHERE id = $6
       RETURNING *`,
      [name, task_type, cron_expression, enabled, config, id]
    )

    // 更新调度器
    await initScheduler()

    return res.rows[0]
  } catch (err: any) {
    return { error: err.message }
  }
})
