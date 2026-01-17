import { SUMMARY_PROMPT, TRANSLATION_PROMPT, STRUCTURED_TRANSLATION_PROMPT } from './ai-prompts'
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
    
    const response: any = await $fetch(url, {
      method: 'POST',
      headers,
      body,
      agent
    })
    
    return response.choices[0].message.content
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
  modelConfig: ModelConfig
): Promise<string> {
  const prompt = TRANSLATION_PROMPT.replace('{content}', content)
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
