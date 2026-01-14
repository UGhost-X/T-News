import { defineEventHandler } from 'h3'
import { query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const res = await query('SELECT * FROM tnews.scheduled_tasks ORDER BY created_at DESC')
    return res.rows
  } catch (err: any) {
    return { error: err.message }
  }
})
