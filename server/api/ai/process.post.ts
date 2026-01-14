import { defineEventHandler, readBody } from 'h3'
import { query } from '../../utils/db'
import { generateAiSummary } from '../../utils/ai'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { newsId, summaryLength } = body

    if (!newsId) {
      throw new Error('News ID is required')
    }

    // 1. Fetch the news item
    const newsRes = await query('SELECT title, original_content FROM tnews.news_items WHERE id = $1', [newsId])
    if (newsRes.rows.length === 0) {
      throw new Error('News item not found')
    }
    const news = newsRes.rows[0]

    // 2. Fetch AI settings and active model
    const settingsRes = await query('SELECT * FROM tnews.ai_settings LIMIT 1')
    const settings = settingsRes.rows[0] || { summary_length: 5, active_model_id: 'default-openai' }
    
    const modelRes = await query('SELECT * FROM tnews.ai_models WHERE id = $1', [settings.active_model_id])
    if (modelRes.rows.length === 0) {
      throw new Error('Active AI model not found or configured')
    }
    const model = modelRes.rows[0]

    // 3. Generate AI summary
    const finalSummaryLength = summaryLength || settings.summary_length
    const aiResult = await generateAiSummary(
      news.title,
      news.original_content,
      {
        baseUrl: model.base_url,
        apiKey: model.api_key,
        modelName: model.model_name,
        temperature: parseFloat(model.temperature)
      },
      finalSummaryLength
    )

    // 4. Update the database
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
    `, [aiResult.summary, aiResult.highlight, aiResult.sentiment, aiResult.importance, newsId])

    // 5. Log to ai_summaries table
    await query(`
      INSERT INTO tnews.ai_summaries (news_item_id, provider, model_name, summary, status)
      VALUES ($1, $2, $3, $4, 'success')
    `, [newsId, model.provider, model.model_name, aiResult.summary])

    return {
      aiSummary: aiResult.summary,
      aiProcessed: true,
      aiHighlight: aiResult.highlight,
      sentiment: aiResult.sentiment,
      importance: aiResult.importance
    }
  } catch (err: any) {
    console.error('Error in AI processing:', err)
    return {
      error: err.message || 'AI processing failed'
    }
  }
})
