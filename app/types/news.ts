export type RssSource = {
  id: string
  name: string
  url: string
  category: string
  color: string
  icon: string
  enabled: boolean
  lastUpdated: string
}

export type NewsItem = {
  id: number
  title: string
  source: string
  sourceId: string
  originalContent: string
  aiSummary?: string
  time: string
  category: string
  sentiment: 'positive' | 'neutral' | 'negative'
  importance: number
  aiProcessed: boolean
  aiHighlight: boolean
  similarSources: string[]
  tags: string[]
  bookmarked?: boolean
}

export type TrendingTopic = {
  id: number
  title: string
  count: number
  category: string
}

export type AiSettings = {
  summaryLength: number
  sentimentSensitivity: number
  importanceThreshold: number
  activeModelId: string
  models: AiModelConfig[]
}

export type AiProvider = 'openai' | 'deepseek' | 'ollama' | 'anthropic' | 'custom'

export type AiModelConfig = {
  id: string
  name: string
  provider: AiProvider
  baseUrl?: string
  apiKey?: string
  modelName: string
  temperature: number
  enabled: boolean
}

export type ProxySettings = {
  enabled: boolean
  host: string
  port: number
  protocol: 'http' | 'https' | 'socks5'
  username?: string
  password?: string
}
