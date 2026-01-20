import { defineEventHandler } from 'h3'
import { query } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const res = await query('SELECT * FROM tnews.ai_models ORDER BY created_at ASC')
    return res.rows.map(row => ({
      id: row.id,
      name: row.name,
      provider: row.provider,
      type: row.type,
      modelName: row.model_name,
      baseUrl: row.base_url || '',
      apiKey: row.api_key || '',
      temperature: parseFloat(row.temperature),
      enabled: row.enabled
    }))
  } catch (err) {
    console.error('Failed to fetch AI models:', err)
    return []
  }
})
