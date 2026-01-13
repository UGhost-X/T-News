import crypto from 'node:crypto'
import { H3Event, getCookie, setCookie, deleteCookie } from 'h3'
import { query } from './db'

const SESSION_COOKIE_NAME = 'tnews_session'

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export async function verifyPassword(password: string, storedHash: string) {
  if (!storedHash || !storedHash.includes(':')) return false
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return false
  const key = crypto.scryptSync(password, salt, 64).toString('hex')
  return hash === key
}

export async function createSession(event: H3Event, userId: string) {
  const sessionId = crypto.randomUUID()
  const refreshToken = crypto.randomBytes(40).toString('hex')
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  await query(
    'INSERT INTO tnews.user_sessions (id, user_id, refresh_token_hash, expires_at) VALUES ($1, $2, $3, $4)',
    [sessionId, userId, refreshTokenHash, expiresAt]
  )

  setCookie(event, SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt
  })

  return sessionId
}

export async function getSessionUser(event: H3Event) {
  const sessionId = getCookie(event, SESSION_COOKIE_NAME)
  if (!sessionId) return null

  const res = await query(
    `SELECT u.* FROM tnews.users u 
     JOIN tnews.user_sessions s ON u.id = s.user_id 
     WHERE s.id = $1 AND s.expires_at > NOW() AND s.revoked_at IS NULL`,
    [sessionId]
  )

  if (res.rows.length === 0) return null

  const user = res.rows[0]
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.display_name,
    avatarUrl: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
    isAdmin: user.is_admin
  }
}

export async function deleteSession(event: H3Event) {
  const sessionId = getCookie(event, SESSION_COOKIE_NAME)
  if (sessionId) {
    await query('UPDATE tnews.user_sessions SET revoked_at = NOW() WHERE id = $1', [sessionId])
  }
  deleteCookie(event, SESSION_COOKIE_NAME)
}
