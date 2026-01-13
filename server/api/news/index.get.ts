import { defineEventHandler, getQuery } from 'h3'
import { query } from '../../utils/db'
import type { NewsItem } from '~/types/news'

export default defineEventHandler(async (event) => {
  try {
    const params = getQuery(event)
    const sourceId = params.sourceId as string
    const category = params.category as string
    const limit = parseInt(params.limit as string) || 50

    let sql = `
      SELECT 
        id, 
        rss_item_id as "rssItemId",
        title, 
        source_name as source, 
        source_key as "sourceId", 
        original_content as "originalContent", 
        ai_summary as "aiSummary", 
        ai_processed as "aiProcessed", 
        ai_highlight as "aiHighlight", 
        category, 
        sentiment, 
        importance, 
        similar_sources as "similarSources", 
        tags, 
        published_at as "publishedAt"
      FROM tnews.news_items
      WHERE 1=1
    `
    const values: any[] = []

    if (sourceId && sourceId !== 'all') {
      values.push(sourceId)
      sql += ` AND source_key = $${values.length}`
    }

    if (category && category !== 'all') {
      values.push(category)
      sql += ` AND category = $${values.length}`
    }

    sql += ` ORDER BY published_at DESC LIMIT ${limit}`

    const res = await query(sql, values)
    
    return res.rows.map(row => ({
      ...row,
      id: parseInt(row.id),
      time: row.publishedAt ? new Date(row.publishedAt).toLocaleString() : '未知时间',
      bookmarked: false // This would normally come from a join with user_news_bookmarks
    })) as NewsItem[]
  } catch (err) {
    console.error('Error fetching news:', err)
    return []
  }
})
