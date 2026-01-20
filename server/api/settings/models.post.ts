import { defineEventHandler, readBody, createError } from 'h3'
import { query } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  try {
    await query(`
      INSERT INTO tnews.ai_models (id, name, provider, type, model_name, base_url, api_key, temperature, enabled)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        provider = EXCLUDED.provider,
        type = EXCLUDED.type,
        model_name = EXCLUDED.model_name,
        base_url = EXCLUDED.base_url,
        api_key = EXCLUDED.api_key,
        temperature = EXCLUDED.temperature,
        enabled = EXCLUDED.enabled
    `, [body.id, body.name, body.provider, body.type || 'llm', body.modelName, body.baseUrl, body.apiKey, body.temperature, body.enabled])
    
    return { success: true }
  } catch (err) {
    console.error('Failed to save AI model:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save AI model'
    })
  }
})
