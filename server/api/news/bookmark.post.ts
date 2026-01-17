import { defineEventHandler, readBody } from 'h3'
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
  const { newsId, bookmarked } = body

  if (!newsId) {
    throw createError({
      statusCode: 400,
      message: 'Missing newsId'
    })
  }

  try {
    if (bookmarked) {
      // Insert bookmark
      await query(
        `INSERT INTO tnews.user_news_bookmarks (user_id, news_item_id) 
         VALUES ($1, $2) 
         ON CONFLICT (user_id, news_item_id) DO NOTHING`,
        [user.id, newsId]
      )
    } else {
      // Remove bookmark
      await query(
        `DELETE FROM tnews.user_news_bookmarks 
         WHERE user_id = $1 AND news_item_id = $2`,
        [user.id, newsId]
      )
    }

    return { success: true, bookmarked }
  } catch (err) {
    console.error('Error toggling bookmark:', err)
    throw createError({
      statusCode: 500,
      message: 'Internal server error'
    })
  }
})
