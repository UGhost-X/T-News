import { SUMMARY_PROMPT, TRANSLATION_PROMPT, QUERY_TRANSLATION_PROMPT, STRUCTURED_TRANSLATION_PROMPT } from './ai-prompts'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { getProxyUrl } from './proxy'

export interface AiResponse {
  summary: string
  sentiment: 'positive' | 'neutral' | 'negative'
  importance: number
  highlight: boolean
  category: string
}

export interface TranslationSegment {
  id: number
  text: string
}

export interface TranslatedSegment {
  id: number
  translation: string
}

export interface ModelConfig {
  baseUrl: string
  apiKey: string
  modelName: string
  temperature: number
  provider?: string
}

async function getProxyAgent() {
  const proxyUrl = await getProxyUrl()
  if (proxyUrl) {
    if (proxyUrl.startsWith('socks')) {
      return new SocksProxyAgent(proxyUrl)
    } else {
      return new HttpsProxyAgent(proxyUrl)
    }
  }
  return null
}

async function callAiApi(
  modelConfig: ModelConfig,
  messages: any[],
  jsonMode: boolean = false
): Promise<string> {
  const agent = await getProxyAgent()
  
  if (modelConfig.provider === 'google') {
    // Google Native API
    const baseUrl = modelConfig.baseUrl || 'https://generativelanguage.googleapis.com/v1beta'
    const model = modelConfig.modelName.startsWith('models/') ? modelConfig.modelName.replace('models/', '') : modelConfig.modelName
    
    const url = `${baseUrl.replace(/\/$/, '')}/models/${model}:generateContent`
    
    // Construct prompt from messages
    let contents = []
    
    // Google API typically expects 'user' and 'model' roles. 
    // It doesn't strictly support 'system' role in 'contents' for all models (Gemini 1.5 supports systemInstruction).
    // We will merge system prompt into the first user message.
    
    let currentRole = 'user'
    let currentParts: any[] = []
    
    for (const msg of messages) {
        if (msg.role === 'system') {
            currentParts.push({ text: msg.content + "\n\n" })
        } else if (msg.role === 'user') {
            if (currentRole === 'user') {
                currentParts.push({ text: msg.content })
            } else {
                // Switch from model to user
                if (currentParts.length > 0) contents.push({ role: 'model', parts: currentParts })
                currentParts = [{ text: msg.content }]
                currentRole = 'user'
            }
        } else if (msg.role === 'assistant') {
            if (currentRole === 'model') {
                currentParts.push({ text: msg.content })
            } else {
                // Switch from user to model
                if (currentParts.length > 0) contents.push({ role: 'user', parts: currentParts })
                currentParts = [{ text: msg.content }]
                currentRole = 'model'
            }
        }
    }
    
    if (currentParts.length > 0) {
        contents.push({ role: currentRole, parts: currentParts })
    }
    
    // Ensure we start with user and alternate (Google requirement usually, but for single turn it's fine)
    // If we only have system prompt, treat as user.
    if (contents.length === 0 && messages.length > 0) {
        // Fallback for simple case
         contents.push({ role: 'user', parts: [{ text: messages.map(m => m.content).join('\n\n') }] })
    }

    const headers: any = { 'Content-Type': 'application/json' }
    if (modelConfig.apiKey) headers['x-goog-api-key'] = modelConfig.apiKey
    
    const body: any = {
      contents,
      generationConfig: {
        temperature: modelConfig.temperature
      }
    }
    
    if (jsonMode) {
      body.generationConfig.responseMimeType = "application/json"
    }
    
    const response: any = await $fetch(url, {
      method: 'POST',
      headers,
      body,
      agent
    })
    
    if (response.candidates && response.candidates.length > 0) {
      return response.candidates[0].content.parts[0].text
    }
    throw new Error('No candidates in Google AI response')
    
  } else {
    // OpenAI Compatible
    const baseUrl = modelConfig.baseUrl || 'https://api.openai.com/v1'
    const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`
    
    const body: any = {
      model: modelConfig.modelName,
      messages,
      temperature: modelConfig.temperature
    }
    
    if (jsonMode) {
      body.response_format = { type: 'json_object' }
    }
    
    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${modelConfig.apiKey}`
    }
    
    try {
      const response: any = await $fetch(url, {
        method: 'POST',
        headers,
        body,
        agent
      })
      
      if (!response?.choices?.[0]?.message?.content) {
        console.error('[AI API Error] Invalid response structure:', JSON.stringify(response, null, 2))
        throw new Error('Invalid response structure from AI provider')
      }

      return response.choices[0].message.content
    } catch (error: any) {
      // Retry without response_format if 400 error and jsonMode is enabled
      // This handles models that don't support response_format: { type: 'json_object' }
      if (jsonMode && error.statusCode === 400 && body.response_format) {
        console.warn('AI API returned 400 with json_object response_format, retrying without it...')
        delete body.response_format
        
        const response: any = await $fetch(url, {
          method: 'POST',
          headers,
          body,
          agent
        })
        
        if (!response?.choices?.[0]?.message?.content) {
          console.error('[AI API Error] Invalid response structure (retry):', JSON.stringify(response, null, 2))
          throw new Error('Invalid response structure from AI provider (retry)')
        }

        return response.choices[0].message.content
      }
      throw error
    }
  }
}

export async function generateAiSummary(
  title: string,
  content: string,
  modelConfig: ModelConfig,
  summaryLength: number
): Promise<AiResponse> {
  const prompt = SUMMARY_PROMPT
    .replace('{title}', title)
    .replace('{content}', content)
    .replace('{summaryLength}', summaryLength.toString())

  const resultText = await callAiApi(modelConfig, [{ role: 'user', content: prompt }], true)
  
  try {
    const parsed = JSON.parse(resultText)
    return {
      summary: parsed.summary || '',
      sentiment: parsed.sentiment || 'neutral',
      importance: parsed.importance || 5,
      highlight: !!parsed.highlight,
      category: parsed.category || 'other'
    }
  } catch (e) {
    console.error('Failed to parse AI response:', resultText)
    throw new Error('Invalid JSON response from AI')
  }
}

export async function generateAiTranslation(
  content: string,
  modelConfig: ModelConfig,
  targetLang: 'zh' | 'en' = 'zh'
): Promise<string> {
  const promptTemplate = targetLang === 'en' ? QUERY_TRANSLATION_PROMPT : TRANSLATION_PROMPT
  const prompt = promptTemplate.replace('{content}', content)
  return await callAiApi(modelConfig, [{ role: 'user', content: prompt }], false)
}

export async function generateStructuredTranslation(
  segments: TranslationSegment[],
  modelConfig: ModelConfig
): Promise<TranslatedSegment[]> {
  const prompt = STRUCTURED_TRANSLATION_PROMPT + '\n\n' + JSON.stringify(segments)
  const resultText = await callAiApi(modelConfig, [{ role: 'user', content: prompt }], true)

  try {
    const parsed = JSON.parse(resultText)
    // Handle cases where the model returns an object with a key (like { "translations": [...] }) instead of an array
    if (Array.isArray(parsed)) {
      return parsed
    } else if (parsed.translations && Array.isArray(parsed.translations)) {
      return parsed.translations
    } else if (parsed.result && Array.isArray(parsed.result)) {
      return parsed.result
    } else {
        // Try to find the first array in values
        const values = Object.values(parsed)
        const arrayVal = values.find(v => Array.isArray(v)) as TranslatedSegment[] | undefined
        if (arrayVal) return arrayVal
        throw new Error('Could not find array in response')
    }
  } catch (e) {
    console.error('Failed to parse structured translation:', resultText)
    throw new Error('Invalid JSON response from AI for structured translation')
  }
}

export async function generateEmbedding(
  text: string,
  modelConfig: ModelConfig
): Promise<number[]> {
  const agent = await getProxyAgent()
  
  if (modelConfig.provider === 'google') {
    // Google Embedding API
    const baseUrl = modelConfig.baseUrl || 'https://generativelanguage.googleapis.com/v1beta'
    const model = modelConfig.modelName.startsWith('models/') ? modelConfig.modelName.replace('models/', '') : modelConfig.modelName
    
    const url = `${baseUrl.replace(/\/$/, '')}/models/${model}:embedContent`
    
    const headers: any = { 'Content-Type': 'application/json' }
    if (modelConfig.apiKey) headers['x-goog-api-key'] = modelConfig.apiKey
    
    const body: any = {
      content: { parts: [{ text }] },
      model: `models/${model}`
    }
    
    const response: any = await $fetch(url, {
      method: 'POST',
      headers,
      body,
      agent
    })
    
    if (response.embedding && response.embedding.values) {
      return response.embedding.values
    }
    throw new Error('No embedding in Google AI response')
    
  } else {
    // OpenAI Compatible
    const baseUrl = modelConfig.baseUrl || 'https://api.openai.com/v1'
    const url = `${baseUrl.replace(/\/$/, '')}/embeddings`
    
    const body: any = {
      model: modelConfig.modelName,
      input: text
    }
    
    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${modelConfig.apiKey}`
    }
    
    const response: any = await $fetch(url, {
      method: 'POST',
      headers,
      body,
      agent
    })
    
    return response.data[0].embedding
  }
}

async function callNativeRerankApi(
  query: string,
  documents: string[],
  modelConfig: ModelConfig
): Promise<{ index: number; relevance_score: number }[]> {
  const agent = await getProxyAgent()
  let baseUrl = modelConfig.baseUrl || 'https://api.openai.com/v1'
  baseUrl = baseUrl.replace(/\/$/, '')
  baseUrl = baseUrl.replace(/\/chat\/completions$/, '')
  const url = `${baseUrl}/rerank`
  
  const body = {
    model: modelConfig.modelName,
    query: query,
    documents: documents,
    top_n: documents.length,
    return_documents: false
  }
  
  const headers: any = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${modelConfig.apiKey}`
  }
  
  console.log(`[Rerank] Calling Native Rerank API: ${url} for model ${modelConfig.modelName}`)

  let response: any
  try {
    response = await $fetch(url, {
      method: 'POST',
      headers,
      body,
      agent
    })
  } catch (e: any) {
    if (e.statusCode === 400) {
      console.warn(`[Rerank] First attempt failed with 400, retrying with minimal payload...`)
      const minimalBody = {
        model: modelConfig.modelName,
        query: query,
        documents: documents
      }
      try {
        response = await $fetch(url, {
          method: 'POST',
          headers,
          body: minimalBody,
          agent
        })
      } catch (retryError: any) {
        console.error(`[Rerank] Minimal payload also failed:`, retryError.data || retryError.message)
        throw retryError
      }
    } else {
      throw e
    }
  }
  
  if (response.results) return response.results
  if (response.data) return response.data 
  
  throw new Error('Invalid response from Rerank API')
}

const MAX_RERANK_QUERY_CHARS = 80
const MAX_RERANK_DOC_CHARS = 400

function truncateText(text: string, maxChars: number) {
  if (!text) return ''
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars)
}

type RerankItem = {
  id: number
  title: string
  contentSnippet?: string
  originalContent?: string
  similarity?: string
  relevance?: string
}

export async function rerankNewsItems(
  queryText: string,
  items: RerankItem[],
  modelConfig: ModelConfig
): Promise<RerankItem[]> {
  if (!items || items.length <= 1) return items

  const isLikelyReranker = modelConfig.modelName.toLowerCase().includes('rerank') || 
                          modelConfig.modelName.toLowerCase().includes('bge')

  if (isLikelyReranker) {
      try {
          const trimmedQuery = truncateText(queryText, MAX_RERANK_QUERY_CHARS)
          const docs = items.map(item => truncateText(`${item.title}\n${item.contentSnippet || item.originalContent || ''}`, MAX_RERANK_DOC_CHARS))
          const results = await callNativeRerankApi(trimmedQuery, docs, modelConfig)
          
          const rankedItems: RerankItem[] = []
          for (const res of results) {
            const item = items[res.index]
            if (!item) continue
            rankedItems.push({
              ...item,
              relevance: res.relevance_score.toFixed(4)
            })
          }
          
          // Sort by relevance desc
          rankedItems.sort((a, b) => parseFloat(b.relevance!) - parseFloat(a.relevance!))
          
          // Append any missing items
          const rankedIds = new Set(rankedItems.map(i => i.id))
          for (const item of items) {
              if (!rankedIds.has(item.id)) {
                  rankedItems.push(item)
              }
          }
          
          return rankedItems
      } catch (e: any) {
          const errorMessage = e?.data?.error?.message || e?.message || ''
          if (errorMessage.includes('maximum context length')) {
            return items
          }
          console.warn('Native Rerank API failed, falling back to Chat API:', e)
      }
  }

  const payload = {
    query: truncateText(queryText, MAX_RERANK_QUERY_CHARS),
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      content: truncateText(item.contentSnippet || item.originalContent || '', MAX_RERANK_DOC_CHARS)
    }))
  }

  const prompt = `
你是一个搜索重排序模型。请根据用户查询 \`query\` 与候选新闻的相关性，对新闻进行从高到低排序，并给出相关性得分（0-1之间，1为最相关）。

要求：
1. 只使用提供的候选列表中的 id，不要生成新的 id
2. 不要返回任何解释文字
3. 只返回 JSON，格式如下：
   {
     "ranked": [
       {"id": id1, "score": 0.95},
       {"id": id2, "score": 0.88},
       ...
     ]
   }

下面是数据：
${JSON.stringify(payload, null, 2)}
`

  try {
    const resultText = await callAiApi(
      modelConfig,
      [{ role: 'user', content: prompt }],
      true
    )

    let parsed: any
    try {
      parsed = JSON.parse(resultText)
    } catch (e) {
      // 有些模型会返回包了一层字符串的 JSON
      parsed = JSON.parse(resultText.replace(/^[^{\[]+/, '').replace(/[^}\]]+$/, ''))
    }

    let rankedList: { id: number; score: number }[] | undefined

    if (parsed && typeof parsed === 'object') {
       if (Array.isArray(parsed.ranked)) {
         rankedList = parsed.ranked
       } else if (Array.isArray(parsed.order)) {
         // Fallback for old format or model hallucination
         rankedList = parsed.order.map((id: number) => ({ id, score: 0 }))
       }
    } else if (Array.isArray(parsed)) {
       // Direct array
       if (parsed.length > 0 && typeof parsed[0] === 'object' && 'id' in parsed[0]) {
          rankedList = parsed
       } else if (parsed.every(v => typeof v === 'number')) {
          rankedList = parsed.map((id: number) => ({ id, score: 0 }))
       }
    }

    if (!rankedList) {
      console.warn('Rerank response does not contain valid ranked list, fallback to original order')
      return items
    }

    const byId = new Map(items.map((item) => [item.id, item]))
    const ranked: typeof items = []

    for (const item of rankedList) {
      const found = byId.get(item.id)
      if (found) {
        // Add score to item if available and not 0 (or if 0 but explicitly returned)
        const newItem = { ...found }
        if (item.score !== undefined) {
           // Store as 'relevance' to distinguish from vector 'similarity'
           // @ts-ignore
           newItem.relevance = item.score.toFixed(4)
        }
        ranked.push(newItem)
        byId.delete(item.id)
      }
    }

    // 把未出现在结果中的剩余项追加在后面
    for (const rest of byId.values()) {
      ranked.push(rest)
    }

    return ranked
  } catch (e: any) {
    // If Chat API fails and we haven't tried Rerank API yet, try it now
    if (!isLikelyReranker && (
        e.message?.includes('Chat Completions API') || 
        e.message?.includes('Invalid response structure')
    )) {
         console.log('Chat API failed (likely not a chat model), trying Native Rerank API as fallback...')
         try {
            const docs = items.map(item => `${item.title}\n${item.contentSnippet || item.originalContent || ''}`)
            const results = await callNativeRerankApi(queryText, docs, modelConfig)
            const rankedItems: RerankItem[] = []
            for (const res of results) {
              const item = items[res.index]
              if (!item) continue
              rankedItems.push({
                ...item,
                relevance: res.relevance_score.toFixed(4)
              })
            }
              rankedItems.sort((a, b) => parseFloat(b.relevance!) - parseFloat(a.relevance!))
              
              const rankedIds = new Set(rankedItems.map(i => i.id))
              for (const item of items) {
                  if (!rankedIds.has(item.id)) {
                      rankedItems.push(item)
                  }
              }
              return rankedItems
         } catch (rerankError) {
             console.error('Both Chat API and Rerank API failed. Original error:', e)
         }
    } else {
        console.error('Failed to rerank news items:', e)
    }
    return items
  }
}
