import { reactive, computed, watch } from 'vue'
import type { AiSettings, AiModelConfig, AiProvider } from '../types/news'

// Global state
const aiSettings = reactive<AiSettings>({
  summaryLength: 5,
  sentimentSensitivity: 7,
  importanceThreshold: 0,
  summaryModelId: undefined,
  translationModelId: undefined,
  commentModelId: undefined,
   embeddingModelId: undefined,
   rerankModelId: undefined,
   matchThreshold: 0.3,
  models: []
})

let isInitialized = false

export const useAiConfig = () => {
  const fetchSettings = async () => {
    try {
      const settings = await $fetch<any>('/api/settings/ai')
      const models = await $fetch<AiModelConfig[]>('/api/settings/models')
      
      if (models) {
        aiSettings.models = models
      }

      if (settings) {
        aiSettings.summaryLength = settings.summaryLength
        aiSettings.sentimentSensitivity = settings.sentimentSensitivity
        aiSettings.importanceThreshold = settings.importanceThreshold
        aiSettings.summaryModelId = settings.summaryModelId
        aiSettings.translationModelId = settings.translationModelId
        aiSettings.commentModelId = settings.commentModelId
        aiSettings.embeddingModelId = settings.embeddingModelId
        aiSettings.rerankModelId = settings.rerankModelId
        aiSettings.matchThreshold = settings.matchThreshold ?? 0.3
        
        // Fallback: If no specific model is set, try to use the first available model
        const firstModelId = aiSettings.models[0]?.id
        if (!aiSettings.summaryModelId && firstModelId) {
           aiSettings.summaryModelId = firstModelId
        }
        if (!aiSettings.translationModelId && firstModelId) {
           aiSettings.translationModelId = firstModelId
        }
        if (!aiSettings.commentModelId && firstModelId) {
           aiSettings.commentModelId = firstModelId
        }
      }
      
      isInitialized = true
    } catch (e) {
      console.error('Failed to fetch AI config from DB', e)
    }
  }

  const saveSettings = async () => {
    if (!isInitialized) return
    try {
      await $fetch('/api/settings/ai', {
        method: 'POST',
        body: {
          summaryLength: aiSettings.summaryLength,
          sentimentSensitivity: aiSettings.sentimentSensitivity,
          importanceThreshold: aiSettings.importanceThreshold,
          summaryModelId: aiSettings.summaryModelId,
          translationModelId: aiSettings.translationModelId,
          commentModelId: aiSettings.commentModelId,
          embeddingModelId: aiSettings.embeddingModelId,
          rerankModelId: aiSettings.rerankModelId,
          matchThreshold: aiSettings.matchThreshold
        }
      })
    } catch (e) {
      console.error('Failed to save AI settings to DB', e)
    }
  }

  const summaryModel = computed(() => {
    return aiSettings.models.find(m => m.id === aiSettings.summaryModelId) || aiSettings.models[0]
  })

  const translationModel = computed(() => {
    return aiSettings.models.find(m => m.id === aiSettings.translationModelId) || aiSettings.models[0]
  })

  const commentModel = computed(() => {
    return aiSettings.models.find(m => m.id === aiSettings.commentModelId) || aiSettings.models[0]
  })

  const addModel = async (config: Omit<AiModelConfig, 'id'>) => {
    const newModel: AiModelConfig = {
      ...config,
      id: `model-${Date.now()}`
    }
    aiSettings.models.push(newModel)
    try {
      await $fetch('/api/settings/models', {
        method: 'POST',
        body: newModel
      })
    } catch (e) {
      console.error('Failed to save model to DB', e)
    }
    return newModel
  }

  const updateModel = async (model: AiModelConfig) => {
    const index = aiSettings.models.findIndex(m => m.id === model.id)
    if (index !== -1) {
      aiSettings.models[index] = model
      try {
        await $fetch('/api/settings/models', {
          method: 'POST',
          body: model
        })
      } catch (e) {
        console.error('Failed to update model in DB', e)
      }
    }
  }

  const removeModel = async (id: string) => {
    const index = aiSettings.models.findIndex(m => m.id === id)
    if (index !== -1) {
      aiSettings.models.splice(index, 1)
      
      const firstModelId = aiSettings.models[0]?.id
      
      if (aiSettings.summaryModelId === id) {
        aiSettings.summaryModelId = firstModelId
      }
      if (aiSettings.translationModelId === id) {
        aiSettings.translationModelId = firstModelId
      }
      if (aiSettings.commentModelId === id) {
        aiSettings.commentModelId = firstModelId
      }

      try {
        await $fetch('/api/settings/models', {
          method: 'DELETE',
          body: { id }
        })
        await saveSettings()
      } catch (e) {
        console.error('Failed to delete model from DB', e)
      }
    }
  }

  const fetchAvailableModels = async (provider: AiProvider, apiKey: string, baseUrl?: string, proxyUrl?: string) => {
    if (!apiKey && provider !== 'ollama') return []
    
    try {
      let url = ''
      if (provider === 'deepseek') {
        url = 'https://api.deepseek.com/models'
      } else if (provider === 'google') {
        url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/models` : 'https://generativelanguage.googleapis.com/v1beta/models'
      } else if (provider === 'openai') {
        url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/models` : 'https://api.openai.com/v1/models'
      } else if (provider === 'anthropic') {
        url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/models` : 'https://api.anthropic.com/v1/models'
      } else if (provider === 'ollama') {
        url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/tags` : 'http://localhost:11434/api/tags'
      } else {
        url = `${baseUrl?.replace(/\/$/, '')}/models`
      }

      const headers: Record<string, string> = {
        'Accept': 'application/json'
      }

      if (provider === 'google' && apiKey) {
        headers['x-goog-api-key'] = apiKey
      } else if (provider !== 'ollama' && apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`
      }

      const response = await $fetch<any>('/api/ai-proxy', {
        method: 'POST',
        body: {
          url,
          method: 'GET',
          headers,
          proxyUrl
        }
      })

      if (response.status < 200 || response.status >= 300) {
        throw new Error(response.statusText || 'Failed to fetch models')
      }

      const data = response.data
      if (provider === 'ollama') {
        return data.models?.map((m: any) => m.name) || []
      } else if (provider === 'google') {
        return data.models?.map((m: any) => m.name.replace(/^models\//, '')) || []
      }
      
      return data.data?.map((m: any) => m.id) || []
    } catch (e) {
      console.error('Failed to fetch models', e)
      throw e
    }
  }

  const validateModel = async (config: AiModelConfig, proxyUrl?: string) => {
    const baseUrl = config.baseUrl || (config.provider === 'deepseek' ? 'https://api.deepseek.com' : (config.provider === 'google' ? 'https://generativelanguage.googleapis.com/v1beta' : ''))
    if (!baseUrl && config.provider !== 'ollama') return { success: false, message: '缺少 Base URL' }
    
    try {
      let url = ''
      let payload = {}
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (config.provider === 'google') {
        const modelName = config.modelName || 'gemini-pro'
        const model = modelName.startsWith('models/') ? modelName.replace('models/', '') : modelName
        url = `${baseUrl.replace(/\/+$/, '')}/models/${model}:generateContent`
        if (config.apiKey) headers['x-goog-api-key'] = config.apiKey
        
        payload = {
          contents: [{ parts: [{ text: "hi" }] }]
        }
      } else {
        url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`
        if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`
        
        payload = {
          model: config.modelName,
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 5
        }
      }

      const response = await $fetch<any>('/api/ai-proxy', {
        method: 'POST',
        body: {
          url,
          method: 'POST',
          headers,
          data: payload,
          proxyUrl
        }
      })

      if (response.status >= 200 && response.status < 300) {
        return { success: true, message: '验证成功' }
      } else {
        return { success: false, message: response.data?.error?.message || `验证失败: ${response.status}` }
      }
    } catch (e: any) {
      console.error('Model validation failed', e)
      return { success: false, message: e.message || '网络错误' }
    }
  }

  const summaryLengthText = computed(() => {
    const summaryText = aiSettings.summaryLength <= 3 ? '简短' : aiSettings.summaryLength <= 7 ? '中等' : '详细'
    return `${summaryText} (${aiSettings.summaryLength}/10)`
  })

  const sentimentSensitivityText = computed(() => {
    const text =
      aiSettings.sentimentSensitivity <= 3 ? '低敏感度' : aiSettings.sentimentSensitivity <= 7 ? '中敏感度' : '高敏感度'
    return `${text} (${aiSettings.sentimentSensitivity}/10)`
  })

  const importanceThresholdText = computed(() => {
    const text = aiSettings.importanceThreshold <= 3 ? '低' : aiSettings.importanceThreshold <= 7 ? '中' : '高'
    return `${text}重要性 (${aiSettings.importanceThreshold}/10)`
  })

  const applyAiSettings = () => {
    console.log('AI Settings Applied:', aiSettings)
    return true
  }

  // Watch for simple settings changes and save
  watch(
    [
      () => aiSettings.summaryLength,
      () => aiSettings.sentimentSensitivity,
      () => aiSettings.importanceThreshold,
      () => aiSettings.summaryModelId,
      () => aiSettings.translationModelId,
      () => aiSettings.commentModelId,
      () => aiSettings.embeddingModelId,
      () => aiSettings.rerankModelId,
      () => aiSettings.matchThreshold
    ],
    () => {
      saveSettings()
    }
  )

  return {
    aiSettings,
    summaryLengthText,
    sentimentSensitivityText,
    importanceThresholdText,
    applyAiSettings,
    summaryModel,
    translationModel,
    commentModel,
    addModel,
    updateModel,
    removeModel,
    fetchSettings,
    saveSettings,
    fetchAvailableModels,
    validateModel
  }
}
