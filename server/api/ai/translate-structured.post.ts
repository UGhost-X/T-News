
import { defineEventHandler, readBody } from 'h3'
import { query } from '../../utils/db'
import { generateStructuredTranslation } from '../../utils/ai'
import * as cheerio from 'cheerio'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { newsId } = body

    if (!newsId) {
      throw new Error('News ID is required')
    }

    // 1. Fetch news content
    const newsRes = await query('SELECT * FROM tnews.news_items WHERE id = $1', [newsId])
    if (newsRes.rows.length === 0) {
      throw new Error('News not found')
    }
    const newsItem = newsRes.rows[0]

    // 2. Check if translation exists
    if (newsItem.translation_data) {
        // Assuming translation_data matches the current segmentation logic
        // We still need to parse the original content to pair it with translations
        // Because we only stored the translations (to save space/redundancy? or did we store both?)
        // Let's decide to store: [{ id: 0, text: "...", translation: "..." }] 
        // If we stored that, we can just return it.
        // If we stored just translations, we need to re-segment.
        // Let's assume we store the FULL structured object for simplicity and consistency.
        return {
            segments: newsItem.translation_data
        }
    }

    // 3. Parse content and prepare segments
    const $ = cheerio.load(newsItem.original_content || '', { xmlMode: false })
    const segments: any[] = []
    let idCounter = 0
    const textSegmentsToTranslate: any[] = []

    // Define containers to flatten
    const flattenTags = ['html', 'body', 'div', 'section', 'article', 'main', 'header', 'footer', 'ul', 'ol', 'aside', 'nav']

    function processElement(el: any) {
      // If root is body/html, tag might be undefined if we passed root directly? 
      // cheerio load result root is a Document, body is inside.
      // We start with $('body')[0] which is an Element.
      
      const tagName = $(el).prop('tagName')
      const tag = tagName ? tagName.toLowerCase() : ''
      
      if (flattenTags.includes(tag)) {
        $(el).contents().each((_, child) => {
          if (child.type === 'tag') {
            processElement(child)
          } else if (child.type === 'text') {
            const text = $(child).text().trim()
            if (text.length > 0) {
              // Orphan text node in container -> treat as p
              const id = idCounter++
              segments.push({
                id,
                tag: 'p',
                html: `<p>${text}</p>`, // Wrap in p for consistency
                text: text,
                translation: null
              })
              textSegmentsToTranslate.push({ id, text })
            }
          }
        })
      } else {
        // It's a block or media or other
        const html = $.html(el)
        const text = $(el).text().trim()
        
        const id = idCounter++
        const segment: any = {
          id,
          tag,
          html,
          text,
          translation: null
        }
        
        segments.push(segment)
        
        // Only translate if it has meaningful text
        // And exclude script/style tags if any
        if (text.length > 0 && !['script', 'style', 'img', 'video', 'iframe', 'br', 'hr'].includes(tag)) {
           textSegmentsToTranslate.push({ id, text })
        }
      }
    }

    // Start processing from body
    // Note: cheerio.load wraps content in <html><head><body>...</body></head></html>
    const bodyElement = $('body')[0]
    if (bodyElement) {
      processElement(bodyElement)
    } else {
      // Fallback if body not found (unlikely with cheerio.load)
      segments.push({
         id: 0,
         tag: 'div',
         html: newsItem.original_content,
         text: $(newsItem.original_content).text(),
         translation: null
      })
      textSegmentsToTranslate.push({ id: 0, text: segments[0].text })
    }

    // 4. Call AI for translation
    // Fetch AI settings
    const settingsRes = await query('SELECT * FROM tnews.ai_settings LIMIT 1')
    const settings = settingsRes.rows[0] || { }
    
    // Determine which model to use
    const targetModelId = settings.translation_model_id

    if (!targetModelId) {
       throw new Error('Translation model not configured. Please go to Settings > AI to select a model.')
    }

    const modelRes = await query('SELECT * FROM tnews.ai_models WHERE id = $1', [targetModelId])
    if (modelRes.rows.length === 0) {
      throw new Error('Target AI model not found or configured')
    }
    const model = modelRes.rows[0]

    // Chunking? If text is too long, we might need to split requests.
    // For now, assume it fits in context window (most news does).
    // If we have > 50 segments, maybe split?
    // Let's implement a simple chunking to be safe (e.g. 20 segments per batch)
    
    const BATCH_SIZE = 20
    const translatedResults: any[] = []
    
    for (let i = 0; i < textSegmentsToTranslate.length; i += BATCH_SIZE) {
        const batch = textSegmentsToTranslate.slice(i, i + BATCH_SIZE)
        const batchResults = await generateStructuredTranslation(
            batch,
            {
                baseUrl: model.base_url,
                apiKey: model.api_key,
                modelName: model.model_name,
                temperature: parseFloat(model.temperature),
                provider: model.provider
            }
        )
        translatedResults.push(...batchResults)
    }

    // 5. Merge translations back
    translatedResults.forEach(res => {
        const segment = segments.find(s => s.id === res.id)
        if (segment) {
            segment.translation = res.translation
        }
    })

    // 6. Save to DB
    // We save the FULL segments array (including HTML and Translation) to ensure consistency
    // This uses more storage but guarantees the UI renders exactly what was translated.
    await query('UPDATE tnews.news_items SET translation_data = $1 WHERE id = $2', [JSON.stringify(segments), newsId])

    return {
      segments
    }

  } catch (err: any) {
    console.error('Error in AI structured translation:', err)
    return {
      error: err.message || 'AI translation failed'
    }
  }
})
