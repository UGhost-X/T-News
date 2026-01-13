import { defineEventHandler, createError } from 'h3'
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

    return user
  } catch (err: any) {
    if (err.statusCode === 401) throw err
    console.error('Failed to fetch user profile:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch user profile'
    })
  }
})
