import { defineEventHandler } from 'h3'
import { query } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const res = await query('SELECT * FROM tnews.proxy_settings LIMIT 1')
    if (res.rows.length === 0) {
      return {
        enabled: false,
        host: '127.0.0.1',
        port: 7890,
        protocol: 'http',
        username: '',
        password: ''
      }
    }
    const row = res.rows[0]
    return {
      enabled: row.enabled,
      host: row.host,
      port: row.port,
      protocol: row.protocol,
      username: row.username || '',
      password: row.password || ''
    }
  } catch (err) {
    console.error('Failed to fetch proxy settings:', err)
    return null
  }
})
