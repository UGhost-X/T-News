import { defineEventHandler, readBody } from 'h3'
import { query } from '../../utils/db'
import { generateAiTranslation } from '../../utils/ai'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { text } = body

    if (!text) {
      throw new Error('Text to translate is required')
    }

    // Fetch AI settings and active model
    const settingsRes = await query('SELECT * FROM tnews.ai_settings LIMIT 1')
    const settings = settingsRes.rows[0] || { active_model_id: 'default-openai' }
    
    // Determine which model to use: translation_model_id > active_model_id
    const targetModelId = settings.translation_model_id || settings.active_model_id

    const modelRes = await query('SELECT * FROM tnews.ai_models WHERE id = $1', [targetModelId])
    if (modelRes.rows.length === 0) {
      throw new Error('Target AI model not found or configured')
    }
    const model = modelRes.rows[0]

    // Generate AI translation
    const translation = await generateAiTranslation(
      text,
      {
        baseUrl: model.base_url,
        apiKey: model.api_key,
        modelName: model.model_name,
        temperature: parseFloat(model.temperature),
        provider: model.provider
      }
    )

    return {
      translation
    }
  } catch (err: any) {
    console.error('Error in AI translation:', err)
    return {
      error: err.message || 'AI translation failed'
    }
  }
})
