import { defineEventHandler } from 'h3'
import { query } from '../../utils/db'
import { getSessionUser } from '../../utils/auth'
import type { TrendingTopic } from '~/types/news'

export default defineEventHandler(async (event) => {
  try {
    const user = await getSessionUser(event)
    const userId = user?.id

    const sql = `
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
        n.published_at as "publishedAt",
        CASE WHEN b.news_item_id IS NOT NULL THEN true ELSE false END as bookmarked
      FROM tnews.news_items n
      LEFT JOIN tnews.rss_items r ON n.rss_item_id = r.id
      LEFT JOIN tnews.user_news_bookmarks b ON n.id = b.news_item_id AND b.user_id = $1
      ORDER BY n.importance DESC, n.published_at DESC
      LIMIT 10
    `
    const res = await query(sql, [userId])
    
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

    return res.rows.map(row => ({
      ...row,
      id: parseInt(row.id),
      time: row.publishedAt ? formatDate(new Date(row.publishedAt)) : '未知时间',
      count: row.importance, 
      bookmarked: row.bookmarked
    })) as TrendingTopic[]
  } catch (err) {
    console.error('Error fetching trending topics:', err)
    return []
  }
})
