import { defineEventHandler, readBody, createError } from 'h3'
import { query } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  try {
    await query('ALTER TABLE tnews.ai_settings ADD COLUMN IF NOT EXISTS match_threshold double precision')
    // For single user app, we just manage the first record
    const check = await query('SELECT id FROM tnews.ai_settings LIMIT 1')
    if (check.rows.length > 0) {
       await query(`
        UPDATE tnews.ai_settings SET
          summary_length = $1,
          sentiment_sensitivity = $2,
          importance_threshold = $3,
          summary_model_id = $4,
          translation_model_id = $5,
          comment_model_id = $6,
          embedding_model_id = $7,
          rerank_model_id = $8,
          match_threshold = $9,
          updated_at = now()
        WHERE id = $10
      `, [
        body.summaryLength, 
        body.sentimentSensitivity, 
        body.importanceThreshold, 
        body.summaryModelId,
        body.translationModelId,
        body.commentModelId,
        body.embeddingModelId,
        body.rerankModelId,
        body.matchThreshold,
        check.rows[0].id
      ])
    } else {
      await query(`
        INSERT INTO tnews.ai_settings (summary_length, sentiment_sensitivity, importance_threshold, summary_model_id, translation_model_id, comment_model_id, embedding_model_id, rerank_model_id, match_threshold)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        body.summaryLength, 
        body.sentimentSensitivity, 
        body.importanceThreshold, 
        body.summaryModelId,
        body.translationModelId,
        body.commentModelId,
        body.embeddingModelId,
        body.rerankModelId,
        body.matchThreshold
      ])
    }

    return { success: true }
  } catch (err) {
    console.error('Failed to update AI settings:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update AI settings'
    })
  }
})
