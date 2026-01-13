import { defineEventHandler, readBody, createError } from 'h3'
import { query } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  try {
    // For single user app, we just manage the first record
    const check = await query('SELECT id FROM tnews.ai_settings LIMIT 1')
    if (check.rows.length > 0) {
       await query(`
        UPDATE tnews.ai_settings SET
          summary_length = $1,
          sentiment_sensitivity = $2,
          importance_threshold = $3,
          active_model_id = $4,
          updated_at = now()
        WHERE id = $5
      `, [body.summaryLength, body.sentimentSensitivity, body.importanceThreshold, body.activeModelId, check.rows[0].id])
    } else {
      await query(`
        INSERT INTO tnews.ai_settings (summary_length, sentiment_sensitivity, importance_threshold, active_model_id)
        VALUES ($1, $2, $3, $4)
      `, [body.summaryLength, body.sentimentSensitivity, body.importanceThreshold, body.activeModelId])
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
