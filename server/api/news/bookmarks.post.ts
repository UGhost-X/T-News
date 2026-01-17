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
      `INSERT INTO tnews.user_news_bookmarks (user_id, news_item_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [user.id, newsId]
    )
    return { success: true }
  } catch (error) {
    console.error('Failed to add bookmark:', error)
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' })
  }
})
