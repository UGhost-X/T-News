import { defineEventHandler, readBody } from 'h3'
import { query } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { newsId, summaryLength, modelName } = body

    if (!newsId) {
      throw new Error('News ID is required')
    }

    // 1. Fetch the news item
    const newsRes = await query('SELECT title, original_content FROM tnews.news_items WHERE id = $1', [newsId])
    if (newsRes.rows.length === 0) {
      throw new Error('News item not found')
    }
    const news = newsRes.rows[0]

    // 2. Simulate AI summary generation
    const summary = `[${modelName}] 这是一条关于 "${news.title}" 的AI生成的智能摘要。长度设为 ${summaryLength}。该新闻讨论了 ${news.original_content.substring(0, 50)}... 等核心内容。`
    const sentiment = Math.random() > 0.6 ? 'positive' : Math.random() > 0.3 ? 'neutral' : 'negative'
    const importance = Math.floor(Math.random() * 5) + 5 // 5-10
    const aiHighlight = importance > 8

    // 3. Update the database
    await query(`
      UPDATE tnews.news_items
      SET 
        ai_summary = $1,
        ai_processed = true,
        ai_highlight = $2,
        sentiment = $3,
        importance = $4,
        updated_at = now()
      WHERE id = $5
    `, [summary, aiHighlight, sentiment, importance, newsId])

    // 4. Log to ai_summaries table
    await query(`
      INSERT INTO tnews.ai_summaries (news_item_id, provider, model_name, summary, status)
      VALUES ($1, $2, $3, $4, 'success')
    `, [newsId, 'mock-provider', modelName, summary])

    return {
      aiSummary: summary,
      aiProcessed: true,
      aiHighlight: aiHighlight,
      sentiment: sentiment,
      importance: importance
    }
  } catch (err: any) {
    console.error('Error in AI processing:', err)
    return {
      error: err.message || 'AI processing failed'
    }
  }
})
