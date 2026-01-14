import { defineEventHandler, readBody } from 'h3'
import { query } from '../../utils/db'
import { parseArticle } from '../../utils/tasks'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { id } = body

    if (!id) {
      return { error: 'News ID is required' }
    }

    // 1. 获取新闻详情
    const newsRes = await query(
      'SELECT id, url FROM tnews.news_items WHERE id = $1',
      [id]
    )

    if (newsRes.rows.length === 0) {
      return { error: 'News item not found' }
    }

    const news = newsRes.rows[0]
    if (!news.url) {
      return { error: 'News URL not found' }
    }

    // 2. 执行爬取
    console.log(`[Manual Crawler] Processing: ${news.url}`)
    const result = await parseArticle(news.url)

    if (result.success && result.content) {
      // 3. 更新数据库
      await query(
        `UPDATE tnews.news_items 
         SET original_content = $1, 
             crawled_at = now(), 
             updated_at = now() 
         WHERE id = $2`,
        [result.content, id]
      )
      
      return { 
        success: true, 
        content: result.content,
        title: result.title 
      }
    } else {
      return { 
        success: false, 
        error: 'Failed to crawl article content' 
      }
    }

  } catch (err: any) {
    console.error(`[Manual Crawler] Error:`, err)
    return { error: err.message }
  }
})
