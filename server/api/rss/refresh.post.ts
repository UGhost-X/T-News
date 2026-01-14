import { defineEventHandler, getQuery, createError } from 'h3'
import { refreshRssSource } from '../../utils/rss'

export default defineEventHandler(async (event) => {
  const params = getQuery(event)
  const sourceId = params.sourceId as string

  if (!sourceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Source ID is required'
    })
  }

  try {
    return await refreshRssSource(sourceId)
  } catch (error: any) {
    console.error('RSS Refresh Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to refresh RSS: ${error.message}`
    })
  }
})
