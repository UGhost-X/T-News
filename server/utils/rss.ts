import Parser from 'rss-parser'
import { query } from './db'
import { getProxyUrl } from './proxy'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { SocksProxyAgent } from 'socks-proxy-agent'

export async function refreshRssSource(sourceId: string) {
  try {
    // 0. 准备 Parser 和 代理
    const proxyUrl = await getProxyUrl()
    let parserConfig: any = {}
    
    if (proxyUrl) {
      const agent = proxyUrl.startsWith('socks') 
        ? new SocksProxyAgent(proxyUrl) 
        : new HttpsProxyAgent(proxyUrl)
      
      parserConfig.requestOptions = {
        agent: agent
      }
    }
    
    const parser = new Parser(parserConfig)

    // 1. 获取订阅源信息
    const sourceRes = await query(
      'SELECT * FROM tnews.rss_sources WHERE id::text = $1 OR source_key = $1',
      [sourceId]
    )

    if (sourceRes.rows.length === 0) {
      throw new Error('RSS Source not found')
    }

    const source = sourceRes.rows[0]

    // 2. 抓取 RSS 数据
    const feed = await parser.parseURL(source.url)
    
    let newItemsCount = 0

    // 3. 逐条处理
    for (const item of feed.items) {
      const guid = item.guid || item.link
      const url = item.link
      const title = item.title
      const content = item.contentSnippet || item.content || ''
      const fullContent = item.content || item.contentSnippet || ''
      const publishedAt = item.isoDate ? new Date(item.isoDate) : new Date()

      if (!title || !url) continue

      try {
        // 首先尝试插入到 rss_items
        const rssItemRes = await query(
          `INSERT INTO tnews.rss_items (rss_source_id, guid, url, title, author, published_at, content_text, content_html, raw)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (rss_source_id, guid) WHERE guid IS NOT NULL DO NOTHING
           RETURNING id`,
          [
            source.id, 
            guid, 
            url, 
            title, 
            item.creator || item.author, 
            publishedAt, 
            content, 
            item.content,
            JSON.stringify(item)
          ]
        )

        let rssItemId = rssItemRes.rows[0]?.id

        if (!rssItemId && !guid) {
           const rssItemUrlRes = await query(
            `INSERT INTO tnews.rss_items (rss_source_id, guid, url, title, author, published_at, content_text, content_html, raw)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (rss_source_id, url) WHERE guid IS NULL AND url IS NOT NULL DO NOTHING
             RETURNING id`,
            [
              source.id, 
              null, 
              url, 
              title, 
              item.creator || item.author, 
              publishedAt, 
              content, 
              item.content,
              JSON.stringify(item)
            ]
          )
          rssItemId = rssItemUrlRes.rows[0]?.id
        }

        // 4. 如果是新抓取的条目，同步到 news_items
        if (rssItemId) {
          await query(
            `INSERT INTO tnews.news_items (rss_item_id, title, source_name, source_key, url, content_snippet, original_content, category, published_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (rss_item_id) DO NOTHING`,
            [
              rssItemId,
              title,
              source.name,
              source.source_key,
              url,
            content, // 存储来自 RSS 的截断内容或摘要
            fullContent, // 存储来自 RSS 的完整 XML 内容（如果有的话）
            source.category,
            publishedAt
          ]
          )
          newItemsCount++
        }
      } catch (err) {
        console.error(`Error processing RSS item ${guid}:`, err)
      }
    }

    // 更新最后更新时间
    await query(
      'UPDATE tnews.rss_sources SET last_updated_at = NOW() WHERE id = $1',
      [source.id]
    )

    return {
      success: true,
      sourceName: source.name,
      fetchedCount: feed.items.length,
      newItemsCount
    }

  } catch (error: any) {
    console.error('RSS Refresh Error:', error)
    throw error
  }
}
