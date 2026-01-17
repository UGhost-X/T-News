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
  url?: string
  contentSnippet?: string
  originalContent: string
  aiSummary?: string
  time: string
  publishedAt?: string
  category: string
  aiCategory?: string
  sentiment: 'positive' | 'neutral' | 'negative'
  importance: number
  aiProcessed: boolean
  aiHighlight: boolean
  similarSources: string[]
  tags: string[]
  bookmarked?: boolean
}

export type TrendingTopic = NewsItem & {
  count: number
}

export type AiSettings = {
  summaryLength: number
  sentimentSensitivity: number
  importanceThreshold: number
  summaryModelId?: string
  translationModelId?: string
  commentModelId?: string
  models: AiModelConfig[]
}

export type AiProvider = 'openai' | 'deepseek' | 'ollama' | 'anthropic' | 'google' | 'custom'

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

export type NewsStats = {
  total: number
  globalTotal: number
  aiProcessedCount: number
  aiHighlightCount: number
  bookmarkedCount: number
  sourceCounts: Record<string, number>
}
