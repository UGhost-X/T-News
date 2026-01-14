import { query } from './db'

export interface ProxyConfig {
  enabled: boolean
  host: string
  port: number
  protocol: string
  username?: string
  password?: string
}

export async function getProxySettings(): Promise<ProxyConfig | null> {
  try {
    const res = await query('SELECT * FROM tnews.proxy_settings LIMIT 1')
    if (res.rows.length > 0 && res.rows[0].enabled) {
      const row = res.rows[0]
      return {
        enabled: row.enabled,
        host: row.host,
        port: row.port,
        protocol: row.protocol,
        username: row.username || '',
        password: row.password || ''
      }
    }
  } catch (err) {
    console.error('[Proxy] Failed to fetch proxy settings:', err)
  }
  return null
}

/**
 * 获取适用于 Playwright 的代理配置
 */
export async function getPlaywrightProxy() {
  const proxy = await getProxySettings()
  if (!proxy) return undefined

  // Playwright proxy format: { server: 'http://host:port', username: '', password: '' }
  return {
    server: `${proxy.protocol}://${proxy.host}:${proxy.port}`,
    username: proxy.username || undefined,
    password: proxy.password || undefined
  }
}

/**
 * 获取代理 URL 字符串
 */
export async function getProxyUrl() {
  const proxy = await getProxySettings()
  if (!proxy) return null

  const auth = proxy.username && proxy.password ? `${proxy.username}:${proxy.password}@` : ''
  return `${proxy.protocol}://${auth}${proxy.host}:${proxy.port}`
}
