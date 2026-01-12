import { reactive, computed, watch } from 'vue'
import type { AiSettings, AiModelConfig, AiProvider } from '../types/news'

// Global state
const aiSettings = reactive<AiSettings>({
  summaryLength: 5,
  sentimentSensitivity: 7,
  importanceThreshold: 6,
  activeModelId: 'default-openai',
  models: [
    {
      id: 'default-openai',
      name: 'OpenAI GPT-4o',
      provider: 'openai',
      modelName: 'gpt-4o',
      temperature: 0.7,
      enabled: true,
      apiKey: ''
    },
    {
      id: 'default-deepseek',
      name: 'DeepSeek Chat',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      temperature: 0.7,
      enabled: true,
      apiKey: ''
    },
    {
      id: 'default-ollama',
      name: 'Ollama Llama3',
      provider: 'ollama',
      baseUrl: 'http://localhost:11434',
      modelName: 'llama3',
      temperature: 0.7,
      enabled: true
    }
  ]
})

// Load from localStorage on init
if (import.meta.client) {
  const saved = localStorage.getItem('ai_settings')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      Object.assign(aiSettings, parsed)
    } catch (e) {
      console.error('Failed to parse AI settings', e)
    }
  }
}

// Watch for changes and save
watch(aiSettings, (newVal) => {
  if (import.meta.client) {
    localStorage.setItem('ai_settings', JSON.stringify(newVal))
  }
}, { deep: true })

export const useAiConfig = () => {
  const activeModel = computed(() => {
    return aiSettings.models.find(m => m.id === aiSettings.activeModelId) || aiSettings.models[0]
  })

  const addModel = (config: Omit<AiModelConfig, 'id'>) => {
    const newModel: AiModelConfig = {
      ...config,
      id: `model-${Date.now()}`
    }
    aiSettings.models.push(newModel)
    return newModel
  }

  const removeModel = (id: string) => {
    const index = aiSettings.models.findIndex(m => m.id === id)
    if (index !== -1) {
      aiSettings.models.splice(index, 1)
      if (aiSettings.activeModelId === id && aiSettings.models.length > 0) {
        const firstModel = aiSettings.models[0]
        if (firstModel) {
          aiSettings.activeModelId = firstModel.id
        }
      }
    }
  }

  const fetchAvailableModels = async (provider: AiProvider, apiKey: string, baseUrl?: string, proxyUrl?: string) => {
    if (!apiKey && provider !== 'ollama') return []
    
    try {
      let url = ''
      if (provider === 'deepseek') {
        url = 'https://api.deepseek.com/models'
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

      if (provider !== 'ollama' && apiKey) {
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
      }
      
      return data.data?.map((m: any) => m.id) || []
    } catch (e) {
      console.error('Failed to fetch models', e)
      throw e
    }
  }

  const validateModel = async (config: AiModelConfig, proxyUrl?: string) => {
    const baseUrl = config.baseUrl || (config.provider === 'deepseek' ? 'https://api.deepseek.com' : '')
    if (!baseUrl && config.provider !== 'ollama') return { success: false, message: '缺少 Base URL' }
    
    try {
      const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`
      const payload = {
        model: config.modelName,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 5
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`

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

  return {
    aiSettings,
    summaryLengthText,
    sentimentSensitivityText,
    importanceThresholdText,
    applyAiSettings,
    activeModel,
    addModel,
    removeModel,
    fetchAvailableModels,
    validateModel
  }
}
