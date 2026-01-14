import { defineEventHandler, getRouterParam } from 'h3'
import { query } from '../../../utils/db'
import { initScheduler } from '../../../utils/scheduler'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    await query('DELETE FROM tnews.scheduled_tasks WHERE id = $1', [id])

    // 更新调度器
    await initScheduler()

    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
})
