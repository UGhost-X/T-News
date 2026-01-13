import { defineEventHandler, readBody, createError } from 'h3'
import { query } from '../../utils/db'
import { verifyPassword, createSession } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { identifier, password } = body // identifier can be email or username

  if (!identifier || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Identifier and password are required'
    })
  }

  try {
    const res = await query(
      'SELECT * FROM tnews.users WHERE email = $1 OR username = $1',
      [identifier]
    )

    if (res.rows.length === 0) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials'
      })
    }

    const user = res.rows[0]
    const isValid = await verifyPassword(password, user.password_hash)

    if (!isValid) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials'
      })
    }

    // Update last login
    await query('UPDATE tnews.users SET last_login_at = NOW() WHERE id = $1', [user.id])

    await createSession(event, user.id)

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
        isAdmin: user.is_admin
      }
    }
  } catch (error: any) {
    console.error('Login error:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error during login'
    })
  }
})
