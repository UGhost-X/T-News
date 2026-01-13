import { defineEventHandler } from 'h3'
import { query } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const res = await query('SELECT * FROM tnews.ai_settings LIMIT 1')
    if (res.rows.length === 0) {
      return {
        summaryLength: 5,
        sentimentSensitivity: 7,
        importanceThreshold: 6,
        activeModelId: 'default-openai'
      }
    }
    const row = res.rows[0]
    return {
      summaryLength: row.summary_length,
      sentimentSensitivity: row.sentiment_sensitivity,
      importanceThreshold: row.importance_threshold,
      activeModelId: row.active_model_id
    }
  } catch (err) {
    console.error('Failed to fetch AI settings:', err)
    return null
  }
})
