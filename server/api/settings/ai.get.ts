import { defineEventHandler } from 'h3'
import { query } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    await query('ALTER TABLE tnews.ai_settings ADD COLUMN IF NOT EXISTS match_threshold double precision')
    const res = await query('SELECT * FROM tnews.ai_settings LIMIT 1')
    if (res.rows.length === 0) {
      return {
        summaryLength: 5,
        sentimentSensitivity: 7,
        importanceThreshold: 6,
        summaryModelId: undefined,
        translationModelId: undefined,
        commentModelId: undefined,
        embeddingModelId: undefined,
        rerankModelId: undefined,
        matchThreshold: 0.3
      }
    }
    const row = res.rows[0]
    const matchThreshold = row.match_threshold !== null && row.match_threshold !== undefined ? parseFloat(row.match_threshold) : 0.3
    return {
      summaryLength: row.summary_length,
      sentimentSensitivity: row.sentiment_sensitivity,
      importanceThreshold: row.importance_threshold,
      summaryModelId: row.summary_model_id,
      translationModelId: row.translation_model_id,
      commentModelId: row.comment_model_id,
      embeddingModelId: row.embedding_model_id,
      rerankModelId: row.rerank_model_id,
      matchThreshold: Number.isFinite(matchThreshold) ? matchThreshold : 0.3
    }
  } catch (err) {
    console.error('Failed to fetch AI settings:', err)
    return null
  }
})
