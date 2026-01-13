import { defineEventHandler, readBody, createError } from 'h3'
import { query } from '../../utils/db'
import { getSessionUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getSessionUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const body = await readBody(event)
  const { id } = body

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID is required'
    })
  }

  try {
    // Only allow users to delete their own sources
    const res = await query(
      'DELETE FROM tnews.rss_sources WHERE source_key = $1 AND owner_user_id = $2 RETURNING *',
      [id, user.id]
    )

    if (res.rows.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Source not found or you do not have permission to delete it'
      })
    }

    return { success: true, removed: res.rows[0] }
  } catch (err: any) {
    console.error('Error deleting RSS source:', err)
    throw createError({
      statusCode: 500,
      message: err.message || 'Internal Server Error'
    })
  }
})
