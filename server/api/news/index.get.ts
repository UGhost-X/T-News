import { defineEventHandler, getQuery } from 'h3'
import { query } from '../../utils/db'
import { getSessionUser } from '../../utils/auth'
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
    const searchQuery = params.search as string
    const publishedAfter = params.publishedAfter as string
    const limitParam = params.limit as string
    const limit = limitParam !== undefined ? parseInt(limitParam) : 20
    const page = parseInt(params.page as string) || 1
    const offset = (page - 1) * limit

    let items: NewsItem[] = []
    
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
      const values: any[] = [userId] // $1 is userId
      
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
        bookmarked: row.bookmarked // Use DB value
      })) as NewsItem[]
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

    if (searchQuery) {
      statsValues.push(`%${searchQuery}%`)
      statsSql += ` AND (n.title ILIKE $${statsValues.length} OR n.content_snippet ILIKE $${statsValues.length})`
    }

    // Note: stats query intentionally ignores aiProcessed/aiHighlight/bookmarked filters 
    // to return global counts for the sidebar badges, unless we want filtered stats.
    // However, if we filter by source, we want stats for that source.
    // If we filter by 'bookmarked', do we want total news count? Probably yes, to show what's available.
    // But 'bookmarkedCount' needs to be correct.

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
