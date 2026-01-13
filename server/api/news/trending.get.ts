import { defineEventHandler } from 'h3'
import { query } from '../../utils/db'
import type { TrendingTopic } from '~/types/news'

export default defineEventHandler(async (event) => {
  try {
    // For now, let's simulate trending topics by counting news items per tag or just returning most recent items as topics
    // In a real app, this might involve more complex aggregation or a dedicated table
    const sql = `
      SELECT 
        id, 
        title, 
        category,
        importance as count -- Using importance as a mock count for now
      FROM tnews.news_items
      ORDER BY importance DESC, published_at DESC
      LIMIT 10
    `
    const res = await query(sql)
    
    return res.rows.map(row => ({
      id: parseInt(row.id),
      title: row.title,
      count: row.count || 1,
      category: row.category
    })) as TrendingTopic[]
  } catch (err) {
    console.error('Error fetching trending topics:', err)
    return []
  }
})
