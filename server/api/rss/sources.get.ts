import { defineEventHandler, createError } from 'h3'
import { query } from '../../utils/db'
import { getSessionUser } from '../../utils/auth'
import type { RssSource } from '~/types/news'

export default defineEventHandler(async (event) => {
  const user = await getSessionUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  try {
    // 获取全局公共源和用户自己的私有源
    const res = await query(
      `SELECT * FROM tnews.rss_sources 
       WHERE (owner_user_id IS NULL OR owner_user_id = $1) 
       ORDER BY created_at ASC`,
      [user.id]
    )
    
    return res.rows.map(row => ({
      id: row.source_key,
      name: row.name,
      url: row.url,
      category: row.category,
      color: row.color,
      icon: row.icon,
      enabled: row.enabled,
      lastUpdated: row.last_updated_at ? new Date(row.last_updated_at).toISOString().slice(0, 16).replace('T', ' ') : ''
    } as RssSource))
  } catch (err) {
    console.error('Error fetching RSS sources:', err)
    return []
  }
})
