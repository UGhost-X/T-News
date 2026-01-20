import { defineEventHandler, getQuery } from 'h3'
import { query } from '../../utils/db'
import { getSessionUser } from '../../utils/auth'
import { generateEmbedding, rerankNewsItems, generateAiTranslation } from '../../utils/ai'
import type { NewsItem } from '~/types/news'

export default defineEventHandler(async (event) => {
  try {
    const user = await getSessionUser(event)
    const userId = user?.id

    const params = getQuery(event)
    const sourceId = params.sourceId as string
    const aiProcessed = params.aiProcessed === 'true'
    const aiHighlight = params.aiHighlight === 'true'
    const isBookmarked = params.bookmarked === 'true'
    const category = params.category as string
    const aiCategory = params.aiCategory as string
    let searchQuery = params.search as string
    const publishedAfter = params.publishedAfter as string
    const limitParam = params.limit as string
    const settingsRes = await query('SELECT * FROM tnews.ai_settings LIMIT 1')
    const settings = settingsRes.rows[0]
    const limit = limitParam !== undefined ? parseInt(limitParam) : 20
    const page = parseInt(params.page as string) || 1
    const offset = (page - 1) * limit

    let items: NewsItem[] = []
    
    const vectorQuery = params.vectorQuery as string
    if (vectorQuery && limit > 0) {
      if (settings?.embedding_model_id) {
        const modelRes = await query('SELECT * FROM tnews.ai_models WHERE id = $1', [settings.embedding_model_id])
        if (modelRes.rows.length > 0) {
          const embeddingModel = modelRes.rows[0]
          try {
            // Check if model needs instruction (e.g. BGE models)
            let queryText = vectorQuery
            if (embeddingModel.model_name.toLowerCase().includes('bge')) {
               queryText = `Represent this sentence for searching relevant passages: ${vectorQuery}`
            }

            // 混合检索优化：尝试将中文查询翻译成英文
            let translatedQuery = null
            if (settings.translation_model_id && /[\u4e00-\u9fa5]/.test(vectorQuery)) {
                try {
                  const transModelRes = await query('SELECT * FROM tnews.ai_models WHERE id = $1', [settings.translation_model_id])
                  if (transModelRes.rows.length > 0) {
                    const transModel = transModelRes.rows[0]
                    translatedQuery = await generateAiTranslation(
                      vectorQuery,
                      {
                        baseUrl: transModel.base_url,
                        apiKey: transModel.api_key,
                        modelName: transModel.model_name,
                        temperature: 0,
                        provider: transModel.provider
                      },
                      'en'
                    )
                    console.log(`[Vector Search] Translated query: "${vectorQuery}" -> "${translatedQuery}"`)
                  }
                } catch (e) {
                  console.error('Failed to translate query for hybrid search:', e)
                }
            }

            const embeddingVector = await generateEmbedding(
              queryText,
              {
                baseUrl: embeddingModel.base_url,
                apiKey: embeddingModel.api_key,
                modelName: embeddingModel.model_name,
                temperature: 0,
                provider: embeddingModel.provider
              }
            )
            const vectorStr = `[${embeddingVector.join(',')}]`
            
            // 如果有翻译后的查询，也生成一个向量
            let translatedVectorStr = null
            if (translatedQuery) {
               try {
                 let transQueryText = translatedQuery
                 if (embeddingModel.model_name.toLowerCase().includes('bge')) {
                    transQueryText = `Represent this sentence for searching relevant passages: ${translatedQuery}`
                 }
                 const transVec = await generateEmbedding(
                   transQueryText,
                   {
                     baseUrl: embeddingModel.base_url,
                     apiKey: embeddingModel.api_key,
                     modelName: embeddingModel.model_name,
                     temperature: 0,
                     provider: embeddingModel.provider
                   }
                 )
                 translatedVectorStr = `[${transVec.join(',')}]`
               } catch(e) {
                 console.error('Failed to generate embedding for translated query', e)
               }
            }

            const candidateLimit = Math.max(limit * 5, offset + limit, 100)
            const matchThresholdValue = settings?.match_threshold !== null && settings?.match_threshold !== undefined ? parseFloat(settings.match_threshold) : 0.3
            const matchThreshold = Number.isFinite(matchThresholdValue) ? matchThresholdValue : 0.3
            let sql = `
                SELECT 
                  n.id, 
                  n.rss_item_id as "rssItemId",
                  n.title, 
                  n.source_name as source, 
                  n.source_key as "sourceId", 
                  COALESCE(n.url, r.url) as url,
                  n.content_snippet as "contentSnippet",
                  n.original_content as "originalContent", 
                  n.ai_summary as "aiSummary", 
                  n.ai_processed as "aiProcessed", 
                  n.ai_highlight as "aiHighlight", 
                  n.category,
                  n.ai_category as "aiCategory",
                  n.sentiment, 
                  n.importance, 
                  n.similar_sources as "similarSources", 
                  n.tags, 
                  n.published_at as "publishedAt",
                  CASE WHEN b.news_item_id IS NOT NULL THEN true ELSE false END as bookmarked,
                  (1 - (n.embedding <=> $1)) as similarity
                FROM tnews.news_items n
                LEFT JOIN tnews.rss_sources s ON n.source_key = s.source_key
                LEFT JOIN tnews.rss_items r ON n.rss_item_id = r.id
                LEFT JOIN tnews.user_news_bookmarks b ON n.id = b.news_item_id AND b.user_id = $2
                WHERE n.embedding IS NOT NULL
                ORDER BY n.embedding <=> $1 ASC
                LIMIT $3
              `
            
            // 如果有翻译向量，使用混合检索（简单取最大相似度）
            if (translatedVectorStr) {
               sql = `
                SELECT 
                  n.id, 
                  n.rss_item_id as "rssItemId",
                  n.title, 
                  n.source_name as source, 
                  n.source_key as "sourceId", 
                  COALESCE(n.url, r.url) as url,
                  n.content_snippet as "contentSnippet",
                  n.original_content as "originalContent", 
                  n.ai_summary as "aiSummary", 
                  n.ai_processed as "aiProcessed", 
                  n.ai_highlight as "aiHighlight", 
                  n.category,
                  n.ai_category as "aiCategory",
                  n.sentiment, 
                  n.importance, 
                  n.similar_sources as "similarSources", 
                  n.tags, 
                  n.published_at as "publishedAt",
                  CASE WHEN b.news_item_id IS NOT NULL THEN true ELSE false END as bookmarked,
                  GREATEST((1 - (n.embedding <=> $1)), (1 - (n.embedding <=> '${translatedVectorStr}'))) as similarity
                FROM tnews.news_items n
                LEFT JOIN tnews.rss_sources s ON n.source_key = s.source_key
                LEFT JOIN tnews.rss_items r ON n.rss_item_id = r.id
                LEFT JOIN tnews.user_news_bookmarks b ON n.id = b.news_item_id AND b.user_id = $2
                WHERE n.embedding IS NOT NULL
                ORDER BY GREATEST((1 - (n.embedding <=> $1)), (1 - (n.embedding <=> '${translatedVectorStr}'))) DESC
                LIMIT $3
              `
            }

            const res = await query(sql, [vectorStr, userId, candidateLimit])

            const formatDate = (date: Date) => {
              const pad = (n: number) => n.toString().padStart(2, '0')
              const y = date.getFullYear()
              const m = pad(date.getMonth() + 1)
              const d = pad(date.getDate())
              const h = pad(date.getHours())
              const mm = pad(date.getMinutes())
              const s = pad(date.getSeconds())
              return `${y}-${m}-${d} ${h}:${mm}:${s}`
            }

            items = res.rows.map(row => ({
              ...row,
              id: parseInt(row.id),
              time: row.publishedAt ? formatDate(new Date(row.publishedAt)) : '未知时间',
              bookmarked: row.bookmarked,
              similarity: parseFloat(row.similarity).toFixed(4)
            })) as NewsItem[]

            if (settings?.rerank_model_id && items.length > 1) {
              try {
                const rerankModelRes = await query('SELECT * FROM tnews.ai_models WHERE id = $1', [settings.rerank_model_id])
                if (rerankModelRes.rows.length > 0) {
                  const rerankModel = rerankModelRes.rows[0]
                  items = await rerankNewsItems(
                    vectorQuery,
                    items,
                    {
                      baseUrl: rerankModel.base_url,
                      apiKey: rerankModel.api_key,
                      modelName: rerankModel.model_name,
                      temperature: rerankModel.temperature ?? 0,
                      provider: rerankModel.provider
                    }
                  ) as NewsItem[]
                }
              } catch (e) {
                console.error('Rerank error:', e)
              }
            }

            const filteredItems = items.filter((item) => {
              const relevance = item.relevance ? parseFloat(item.relevance) : undefined
              const similarity = item.similarity ? parseFloat(item.similarity) : undefined
              const score = relevance ?? similarity ?? 0
              return score >= matchThreshold
            })
            return {
              items: filteredItems,
              stats: {
                total: filteredItems.length,
                globalTotal: 0,
                aiProcessedCount: 0,
                aiHighlightCount: 0,
                bookmarkedCount: 0,
                sourceCounts: {}
              }
            }
          } catch (e) {
            console.error('Vector search error:', e)
          }
        }
      }
    }

    if (!searchQuery && vectorQuery) {
      searchQuery = vectorQuery
    }

    // 如果 limit 为 0，跳过获取新闻列表，仅获取统计数据
    if (limit > 0) {
      let sql = `
        SELECT 
          n.id, 
          n.rss_item_id as "rssItemId",
          n.title, 
          n.source_name as source, 
          n.source_key as "sourceId", 
          COALESCE(n.url, r.url) as url,
          n.content_snippet as "contentSnippet",
          n.original_content as "originalContent", 
          n.ai_summary as "aiSummary", 
          n.ai_processed as "aiProcessed", 
          n.ai_highlight as "aiHighlight", 
          n.category,
          n.ai_category as "aiCategory",
          n.sentiment, 
          n.importance, 
          n.similar_sources as "similarSources", 
          n.tags, 
          n.published_at as "publishedAt",
          CASE WHEN b.news_item_id IS NOT NULL THEN true ELSE false END as bookmarked
        FROM tnews.news_items n
        LEFT JOIN tnews.rss_sources s ON n.source_key = s.source_key
        LEFT JOIN tnews.rss_items r ON n.rss_item_id = r.id
        LEFT JOIN tnews.user_news_bookmarks b ON n.id = b.news_item_id AND b.user_id = $1
        WHERE 1=1
      `
      const values: any[] = [userId]
      
      if (sourceId && sourceId !== 'all') {
        values.push(sourceId)
        sql += ` AND (n.source_key = $${values.length} OR s.id::text = $${values.length})`
      }

      if (aiProcessed) {
        sql += ` AND n.ai_processed = true`
      }

      if (aiHighlight) {
        sql += ` AND n.ai_highlight = true`
      }

      if (isBookmarked) {
        sql += ` AND b.news_item_id IS NOT NULL`
      }

      if (category && category !== 'all') {
        values.push(category)
        sql += ` AND n.category = $${values.length}`
      }

      if (aiCategory && aiCategory !== 'all') {
        values.push(aiCategory)
        sql += ` AND n.ai_category = $${values.length}`
      }

      if (searchQuery) {
        values.push(`%${searchQuery}%`)
        sql += ` AND (n.title ILIKE $${values.length} OR n.content_snippet ILIKE $${values.length})`
      }

      if (publishedAfter) {
        values.push(publishedAfter)
        sql += ` AND n.published_at > $${values.length}`
      }

      sql += ` ORDER BY n.published_at DESC, n.importance DESC LIMIT ${limit} OFFSET ${offset}`
      const res = await query(sql, values)

      const formatDate = (date: Date) => {
        const pad = (n: number) => n.toString().padStart(2, '0')
        const y = date.getFullYear()
        const m = pad(date.getMonth() + 1)
        const d = pad(date.getDate())
        const h = pad(date.getHours())
        const mm = pad(date.getMinutes())
        const s = pad(date.getSeconds())
        return `${y}-${m}-${d} ${h}:${mm}:${s}`
      }

      items = res.rows.map(row => ({
        ...row,
        id: parseInt(row.id),
        time: row.publishedAt ? formatDate(new Date(row.publishedAt)) : '未知时间',
        bookmarked: row.bookmarked
      })) as NewsItem[]

      if (searchQuery && settings?.rerank_model_id && items.length > 1) {
        try {
          const rerankModelRes = await query('SELECT * FROM tnews.ai_models WHERE id = $1', [settings.rerank_model_id])
          if (rerankModelRes.rows.length > 0) {
            const rerankModel = rerankModelRes.rows[0]
            items = await rerankNewsItems(
              searchQuery,
              items,
              {
                baseUrl: rerankModel.base_url,
                apiKey: rerankModel.api_key,
                modelName: rerankModel.model_name,
                temperature: rerankModel.temperature ?? 0,
                provider: rerankModel.provider
              }
            ) as NewsItem[]
          }
        } catch (e) {
          console.error('Rerank error:', e)
        }
      }
    }
    
    // 获取统计数据
    let statsSql = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE n.ai_processed = true) as "aiProcessedCount",
        COUNT(*) FILTER (WHERE n.ai_highlight = true) as "aiHighlightCount",
        COUNT(b.news_item_id) as "bookmarkedCount"
      FROM tnews.news_items n
      LEFT JOIN tnews.rss_sources s ON n.source_key = s.source_key
      LEFT JOIN tnews.user_news_bookmarks b ON n.id = b.news_item_id AND b.user_id = $1
      WHERE 1=1
    `
    const statsValues: any[] = [userId]
    if (sourceId && sourceId !== 'all') {
      statsValues.push(sourceId)
      statsSql += ` AND (n.source_key = $${statsValues.length} OR s.id::text = $${statsValues.length})`
    }
    
    if (publishedAfter) {
      statsValues.push(publishedAfter)
      statsSql += ` AND n.published_at > $${statsValues.length}`
    }

    if (aiProcessed) {
      statsSql += ` AND n.ai_processed = true`
    }

    if (aiHighlight) {
      statsSql += ` AND n.ai_highlight = true`
    }

    if (isBookmarked) {
      statsSql += ` AND b.news_item_id IS NOT NULL`
    }

    if (category && category !== 'all') {
      statsValues.push(category)
      statsSql += ` AND n.category = $${statsValues.length}`
    }

    if (aiCategory && aiCategory !== 'all') {
      statsValues.push(aiCategory)
      statsSql += ` AND n.ai_category = $${statsValues.length}`
    }

    if (searchQuery) {
      statsValues.push(`%${searchQuery}%`)
      statsSql += ` AND (n.title ILIKE $${statsValues.length} OR n.content_snippet ILIKE $${statsValues.length})`
    }
    const statsRes = await query(statsSql, statsValues)
    const stats = statsRes.rows[0]

    // 获取全局总数（不随 sourceId 变化）
    const globalTotalRes = await query('SELECT COUNT(*) as count FROM tnews.news_items')
    const globalTotal = parseInt(globalTotalRes.rows[0].count)

    // 获取各新闻源的数量统计
    const sourceStatsRes = await query(`
      SELECT source_key, COUNT(*) as count 
      FROM tnews.news_items 
      GROUP BY source_key
    `)
    const sourceCounts = Object.fromEntries(sourceStatsRes.rows.map(r => [r.source_key, parseInt(r.count)]))
    
    return {
      items,
      stats: {
        total: parseInt(stats.total),
        globalTotal: globalTotal,
        aiProcessedCount: parseInt(stats.aiProcessedCount),
        aiHighlightCount: parseInt(stats.aiHighlightCount),
        bookmarkedCount: parseInt(stats.bookmarkedCount),
        sourceCounts
      }
    }
  } catch (err) {
    console.error('Error fetching news:', err)
    return []
  }
})
