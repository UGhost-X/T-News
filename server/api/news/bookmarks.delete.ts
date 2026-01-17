import { defineEventHandler, readBody, createError } from 'h3'
import { query } from '../../utils/db'
import { getSessionUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getSessionUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { newsId } = body

  if (!newsId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing newsId' })
  }

  try {
    await query(
      `DELETE FROM tnews.user_news_bookmarks WHERE user_id = $1 AND news_item_id = $2`,
      [user.id, newsId]
    )
    return { success: true }
  } catch (error) {
    console.error('Failed to remove bookmark:', error)
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' })
  }
})
