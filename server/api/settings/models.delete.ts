import { defineEventHandler, readBody, createError } from 'h3'
import { query } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  try {
    await query('DELETE FROM tnews.ai_models WHERE id = $1', [body.id])
    return { success: true }
  } catch (err) {
    console.error('Failed to delete AI model:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete AI model'
    })
  }
})
