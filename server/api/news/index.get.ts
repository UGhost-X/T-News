import { defineEventHandler, getQuery } from 'h3'
import { query } from '../../utils/db'
import type { NewsItem } from '~/types/news'

export default defineEventHandler(async (event) => {
  try {
    const params = getQuery(event)
    const sourceId = params.sourceId as string
    const aiProcessed = params.aiProcessed === 'true'
    const aiHighlight = params.aiHighlight === 'true'
    const limit = parseInt(params.limit as string) || 20
    const page = parseInt(params.page as string) || 1
    const offset = (page - 1) * limit

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
        n.sentiment, 
        n.importance, 
        n.similar_sources as "similarSources", 
        n.tags, 
        n.published_at as "publishedAt"
      FROM tnews.news_items n
      LEFT JOIN tnews.rss_sources s ON n.source_key = s.source_key
      LEFT JOIN tnews.rss_items r ON n.rss_item_id = r.id
      WHERE 1=1
    `
    const values: any[] = []
    
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

    sql += ` ORDER BY n.published_at DESC, n.importance DESC LIMIT ${limit} OFFSET ${offset}`
    const res = await query(sql, values)

    // 获取统计数据
    let statsSql = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE n.ai_processed = true) as "aiProcessedCount",
        COUNT(*) FILTER (WHERE n.ai_highlight = true) as "aiHighlightCount"
      FROM tnews.news_items n
      LEFT JOIN tnews.rss_sources s ON n.source_key = s.source_key
      WHERE 1=1
    `
    const statsValues: any[] = []
    if (sourceId && sourceId !== 'all') {
      statsValues.push(sourceId)
      statsSql += ` AND (n.source_key = $${statsValues.length} OR s.id::text = $${statsValues.length})`
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

    return {
      items: res.rows.map(row => ({
        ...row,
        id: parseInt(row.id),
        time: row.publishedAt ? formatDate(new Date(row.publishedAt)) : '未知时间',
        bookmarked: false
      })) as NewsItem[],
      stats: {
        total: parseInt(stats.total),
        globalTotal: globalTotal,
        aiProcessedCount: parseInt(stats.aiProcessedCount),
        aiHighlightCount: parseInt(stats.aiHighlightCount),
        sourceCounts
      }
    }
  } catch (err) {
    console.error('Error fetching news:', err)
    return []
  }
})
