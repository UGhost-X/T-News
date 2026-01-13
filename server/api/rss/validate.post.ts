import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { url } = body

  if (!url) {
    throw createError({
      statusCode: 400,
      message: 'URL is required'
    })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'T-News RSS Validator/1.0'
      }
    })

    if (!response.ok) {
      return { 
        valid: false, 
        message: `HTTP Error: ${response.status} ${response.statusText}` 
      }
    }

    const contentType = response.headers.get('content-type') || ''
    const text = await response.text()

    // Basic check for RSS/Atom XML structure
    const isXml = contentType.includes('xml') || text.trim().startsWith('<?xml') || text.includes('<rss') || text.includes('<feed')
    
    if (!isXml) {
      return { 
        valid: false, 
        message: 'The URL does not point to a valid XML feed' 
      }
    }

    // More specific check for common RSS/Atom tags
    const hasRssTag = text.includes('<rss') || text.includes('<feed') || text.includes('<channel')
    
    if (!hasRssTag) {
      return { 
        valid: false, 
        message: 'The XML does not appear to be an RSS or Atom feed' 
      }
    }

    // Try to extract some basic info if possible (optional)
    let title = ''
    const titleMatch = text.match(/<title>(.*?)<\/title>/i)
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/i, '$1').trim()
    }

    return { 
      valid: true, 
      title,
      message: 'Valid RSS/Atom feed'
    }

  } catch (err: any) {
    console.error('RSS Validation Error:', err)
    return { 
      valid: false, 
      message: `Failed to fetch: ${err.message}` 
    }
  }
})
