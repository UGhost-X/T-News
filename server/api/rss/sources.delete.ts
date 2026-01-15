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
    // First verify source exists and belongs to user
    const findRes = await query(
      'SELECT id, source_key FROM tnews.rss_sources WHERE (id::text = $1 OR source_key = $1) AND owner_user_id = $2',
      [id, user.id]
    )

    if (findRes.rows.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Source not found or you do not have permission to delete it'
      })
    }

    const source = findRes.rows[0]

    // Delete associated news items first
    // Note: rss_items -> rss_sources is ON DELETE CASCADE
    // But news_items -> rss_items is ON DELETE SET NULL, so we must manually delete news_items
    await query(
      `DELETE FROM tnews.news_items 
       WHERE rss_item_id IN (
         SELECT id FROM tnews.rss_items WHERE rss_source_id = $1
       ) OR source_key = $2`,
      [source.id, source.source_key]
    )

    // Delete the source (will cascade delete rss_items)
    const res = await query(
      'DELETE FROM tnews.rss_sources WHERE id = $1 RETURNING *',
      [source.id]
    )

    return { success: true, removed: res.rows[0] }
  } catch (err: any) {
    console.error('Error deleting RSS source:', err)
    throw createError({
      statusCode: 500,
      message: err.message || 'Internal Server Error'
    })
  }
})
