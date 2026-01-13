import { defineEventHandler, readBody, createError } from 'h3'
import { query } from '../../utils/db'
import { hashPassword, createSession } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, username, password, displayName } = body

  if (!email || !username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email, username and password are required'
    })
  }

  try {
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM tnews.users WHERE email = $1 OR username = $2',
      [email, username]
    )

    if (existingUser.rows.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'User with this email or username already exists'
      })
    }

    const passwordHash = await hashPassword(password)
    
    const res = await query(
      `INSERT INTO tnews.users (email, username, password_hash, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, username, display_name, is_admin`,
      [email, username, passwordHash, displayName || username]
    )

    const user = res.rows[0]
    await createSession(event, user.id)

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
        isAdmin: user.is_admin
      }
    }
  } catch (error: any) {
    console.error('Registration error:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error during registration'
    })
  }
})
