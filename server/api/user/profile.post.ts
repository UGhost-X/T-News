import { defineEventHandler, readBody, createError } from 'h3'
import { query } from '../../utils/db'
import { getSessionUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await getSessionUser(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const body = await readBody(event)
    const { displayName, avatarUrl, email } = body

    const updateRes = await query(
      `UPDATE tnews.users 
       SET display_name = $1, avatar_url = $2, email = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, username, email, display_name, avatar_url, is_admin`,
      [displayName, avatarUrl, email, user.id]
    )

    const row = updateRes.rows[0]
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      isAdmin: row.is_admin
    }
  } catch (err: any) {
    if (err.statusCode === 401) throw err
    console.error('Failed to update user profile:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update user profile'
    })
  }
})
