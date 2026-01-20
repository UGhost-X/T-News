import { defineEventHandler, getQuery, createError } from 'h3'
import { refreshRssSource } from '../../utils/rss'
import { runEmbeddingGeneration } from '../../utils/tasks'

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
    const result = await refreshRssSource(sourceId)
    
    // 触发增量 Embedding 生成
    try {
      // 不阻塞主响应，后台执行
      runEmbeddingGeneration().catch(e => console.error('Background embedding generation failed:', e))
    } catch (e) {
      console.error('Failed to trigger embedding generation:', e)
    }

    return result
  } catch (error: any) {
    console.error('RSS Refresh Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to refresh RSS: ${error.message}`
    })
  }
})
