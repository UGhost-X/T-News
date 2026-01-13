import { defineEventHandler, readBody, createError } from 'h3'
import { query } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  try {
    const check = await query('SELECT id FROM tnews.proxy_settings LIMIT 1')
    if (check.rows.length === 0) {
      await query(`
        INSERT INTO tnews.proxy_settings (enabled, host, port, protocol, username, password)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [body.enabled, body.host, body.port, body.protocol, body.username, body.password])
    } else {
      await query(`
        UPDATE tnews.proxy_settings SET
          enabled = $1,
          host = $2,
          port = $3,
          protocol = $4,
          username = $5,
          password = $6
        WHERE id = $7
      `, [body.enabled, body.host, body.port, body.protocol, body.username, body.password, check.rows[0].id])
    }
    return { success: true }
  } catch (err) {
    console.error('Failed to update proxy settings:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update proxy settings'
    })
  }
})
