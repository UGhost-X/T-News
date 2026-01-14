import { SUMMARY_PROMPT } from './ai-prompts'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { getProxyUrl } from './proxy'

export interface AiResponse {
  summary: string
  sentiment: 'positive' | 'neutral' | 'negative'
  importance: number
  highlight: boolean
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

export async function generateAiSummary(
  title: string,
  content: string,
  modelConfig: {
    baseUrl: string
    apiKey: string
    modelName: string
    temperature: number
  },
  summaryLength: number
): Promise<AiResponse> {
  const prompt = SUMMARY_PROMPT
    .replace('{title}', title)
    .replace('{content}', content)
    .replace('{summaryLength}', summaryLength.toString())

  const baseUrl = modelConfig.baseUrl || 'https://api.openai.com/v1'
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`
  const agent = await getProxyAgent()

  const response: any = await $fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${modelConfig.apiKey}`
    },
    body: {
      model: modelConfig.modelName,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: modelConfig.temperature,
      response_format: { type: 'json_object' }
    },
    agent: agent
  })

  const resultText = response.choices[0].message.content
  
  try {
    const parsed = JSON.parse(resultText)
    return {
      summary: parsed.summary || '',
      sentiment: parsed.sentiment || 'neutral',
      importance: parsed.importance || 5,
      highlight: !!parsed.highlight
    }
  } catch (e) {
    console.error('Failed to parse AI response:', resultText)
    throw new Error('Invalid JSON response from AI')
  }
}
