import { defineEventHandler, readBody } from 'h3'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { SocksProxyAgent } from 'socks-proxy-agent'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { url, method, headers, data, proxyUrl } = body

  if (!url || typeof url !== 'string') {
    return { status: 400, statusText: 'Missing url', data: null }
  }

  const fetchOptions: any = {
    method: method || 'GET',
    headers: headers || {},
  }

  if (data) {
    fetchOptions.body = typeof data === 'string' ? data : JSON.stringify(data)
  }

  if (proxyUrl) {
    if (proxyUrl.startsWith('socks')) {
      fetchOptions.agent = new SocksProxyAgent(proxyUrl)
    } else {
      fetchOptions.agent = new HttpsProxyAgent(proxyUrl)
    }
  }

  try {
    const response = await $fetch.raw(url, {
      ...fetchOptions,
      // @ts-ignore
      agent: fetchOptions.agent
    })
    
    return {
      status: response.status,
      statusText: response.statusText,
      data: response._data
    }
  } catch (error: any) {
    return {
      status: error.status || 500,
      statusText: error.message,
      data: error.data
    }
  }
})
