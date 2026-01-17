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
  const { id, name, url, category, color, icon, enabled } = body

  if (!name || !url) {
    throw createError({
      statusCode: 400,
      message: 'Name and URL are required'
    })
  }

  try {
    // Check if source already exists for this user
    const existing = await query(
      'SELECT id FROM tnews.rss_sources WHERE source_key = $1 AND (owner_user_id = $2 OR owner_user_id IS NULL)',
      [id, user.id]
    )

    if (existing.rows.length > 0) {
      // Update
      await query(
        `UPDATE tnews.rss_sources 
         SET name = $1, url = $2, category = $3, color = $4, icon = $5, enabled = $6, updated_at = NOW()
         WHERE source_key = $7 AND (owner_user_id = $8 OR owner_user_id IS NULL)`,
        [name, url, category, color, icon, enabled, id, user.id]
      )

      // Sync category update to historical news items
      await query(
        `UPDATE tnews.news_items
         SET category = $1
         WHERE source_key = $2`,
        [category, id]
      )

      return { success: true, action: 'updated' }
    } else {
      // Insert
      const sourceKey = id || `custom-${Date.now()}`
      await query(
        `INSERT INTO tnews.rss_sources 
         (source_key, owner_user_id, name, url, category, color, icon, enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [sourceKey, user.id, name, url, category, color, icon, enabled ?? true]
      )
      return { success: true, action: 'created', id: sourceKey }
    }
  } catch (err: any) {
    console.error('Error saving RSS source:', err)
    throw createError({
      statusCode: 500,
      message: err.message || 'Internal Server Error'
    })
  }
})
