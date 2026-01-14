import { query } from './db'
import { refreshRssSource } from './rss'
import { generateAiSummary } from './ai'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'
import DOMPurify from 'isomorphic-dompurify'
import * as cheerio from 'cheerio'
import { chromium } from 'playwright'
import { uploadToMinio } from './minio'
import { getPlaywrightProxy, getProxyUrl } from './proxy'
import path from 'path'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { SocksProxyAgent } from 'socks-proxy-agent'

// 定义爬取结果的接口
interface CrawlResult {
  title?: string
  content: string
  excerpt?: string
  success: boolean
  publishTime?: string
  error?: string
}

/**
 * 处理 HTML 中的媒体文件，将其上传到 MinIO 并替换链接
 */
async function processMedia(html: string, baseUrl: string): Promise<string> {
  const $ = cheerio.load(html)
  const mediaElements = $('img, video, source')
  
  for (const el of mediaElements.toArray()) {
    const $el = $(el)
    let src = $el.attr('src')
    
    if (!src) continue
    
    // 处理相对路径
    if (src.startsWith('/') || !src.startsWith('http')) {
      try {
        src = new URL(src, baseUrl).href
      } catch (e) {
        continue
      }
    }

    // 跳过已经是 MinIO 的链接或 data: 链接
    if (src.includes('localhost:9000') || src.startsWith('data:')) continue

    try {
      console.log(`[Crawler] Downloading media: ${src}`)
      
      const proxyUrl = await getProxyUrl()
      const fetchOptions: any = {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(15000)
      }

      if (proxyUrl) {
        if (proxyUrl.startsWith('socks')) {
          fetchOptions.agent = new SocksProxyAgent(proxyUrl)
        } else {
          fetchOptions.agent = new HttpsProxyAgent(proxyUrl)
        }
      }

      let response;
      try {
        response = await fetch(src, fetchOptions)
      } catch (fetchError: any) {
        // 如果代理抓取媒体失败，尝试直连
        if (proxyUrl && (fetchError.message.includes('ECONNREFUSED') || fetchError.message.includes('proxy'))) {
          console.warn(`[Crawler] Media proxy failed, trying direct for ${src}`);
          response = await fetch(src, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(15000)
          })
        } else {
          throw fetchError;
        }
      }

      if (!response.ok) continue

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const contentType = response.headers.get('content-type') || 'application/octet-stream'
      
      // 生成文件名
      const urlPath = new URL(src).pathname
      let fileName = path.basename(urlPath) || `media-${Date.now()}`
      if (!path.extname(fileName)) {
        const ext = contentType.split('/')[1]?.split(';')[0] || 'bin'
        fileName = `${fileName}.${ext}`
      }

      const minioUrl = await uploadToMinio(buffer, fileName, contentType)
      $el.attr('src', minioUrl)
      console.log(`[Crawler] Media uploaded to MinIO: ${minioUrl}`)
    } catch (error: any) {
      console.error(`[Crawler] Failed to process media ${src}:`, error.message)
    }
  }

  return $.html()
}


/**
 * 核心解析函数：提取正文、处理媒体并上传 MinIO (Playwright 方案)
 */
export async function parseArticle(url: string): Promise<CrawlResult> {
  let browser;
  try {
    // 获取代理配置
    const proxy = await getPlaywrightProxy();
    
    // 1. 启动 Playwright 浏览器
    browser = await chromium.launch({
      headless: true,
      proxy: proxy || undefined, // 应用系统代理
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-zygote'
      ]
    });
    
    let context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      extraHTTPHeaders: {
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    let page = await context.newPage();

    // 快速加载页面
    try {
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
    } catch (gotoError: any) {
      console.error(`[Crawler] Primary navigation failed for ${url}:`, gotoError.message);
      
      // 如果是代理连接失败或服务器返回空响应 (可能是代理不稳定或被封锁)
      const isProxyError = gotoError.message.includes('ERR_PROXY_CONNECTION_FAILED') || 
                          gotoError.message.includes('ERR_TUNNEL_CONNECTION_FAILED') ||
                          gotoError.message.includes('ERR_EMPTY_RESPONSE') ||
                          gotoError.message.includes('ERR_CONNECTION_CLOSED');

      if (proxy && isProxyError) {
        console.warn(`[Crawler] Network error (${gotoError.message}), attempting direct connection for ${url}`);
        
        // 关闭旧浏览器并重新启动一个不带代理的
        await browser.close();
        browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        context = await browser.newContext({
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          extraHTTPHeaders: {
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
          }
        });
        page = await context.newPage();
        
        await page.goto(url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 30000 
        });
      } else {
        throw gotoError;
      }
    }

    // 等待主内容出现（NHK 用 JS 加载）
    await page.waitForTimeout(1500);

    // 一步到位：移除所有干扰 + 获取内容
    const result = await page.evaluate(() => {
      // 1. 移除模态框（如果有）
      document.querySelectorAll('dialog, [role="dialog"]').forEach(el => el.remove());
      
      // 2. 移除明确的干扰区块
      const removeList = [
        'nav', 'header', 'footer', 'aside',
        '[class*="recommend"]', '[class*="related"]', 
        '[class*="latest"]', '[class*="share"]',
        '[class*="comment"]', '[class*="ad"]',
        '.nhk-header', '.nhk-footer'
      ];
      
      removeList.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          // 只删除不在 article/main 内的元素
          if (!el.closest('article, main')) {
            el.remove();
          }
        });
      });

      // 3. 删除包含关键词的标题及其区块
      document.querySelectorAll('h2, h3').forEach(heading => {
        const text = heading.textContent || '';
        if (text.includes('深掘り') || text.includes('新着') || 
            text.includes('ライブ') || text.includes('天気')) {
          // 找到父容器并删除
          const parent = heading.closest('section, div[class]');
          if (parent && !parent.closest('article, main')) {
            parent.remove();
          }
        }
      });

      // 4. 查找主内容
      let contentElement = document.querySelector('article') || 
                          document.querySelector('main') ||
                          document.querySelector('[class*="article-body"]') ||
                          document.querySelector('[class*="content-body"]');

      if (!contentElement) {
        // 降级：查找包含最多段落的容器
        let maxP = 0;
        let bestElement: Element | null = null;
        
        document.querySelectorAll('div, section').forEach(el => {
          const pCount = el.querySelectorAll('p').length;
          if (pCount > maxP) {
            maxP = pCount;
            bestElement = el;
          }
        });
        
        contentElement = bestElement;
      }

      if (!contentElement) {
        return null;
      }

      // 5. 在内容内部再次清理
      contentElement.querySelectorAll('[class*="share"], [class*="recommend"], [class*="related"]')
        .forEach(el => el.remove());

      // 6. 提取标题
      const h1 = document.querySelector('h1');
      const title = h1 ? h1.textContent?.trim() : 
                    document.title.split('|')[0].trim();

      // 7. 提取时间
      const timeElement = document.querySelector('time, [class*="date"], [class*="time"]');
      const publishTime = timeElement ? timeElement.textContent?.trim() : undefined;

      return {
        html: contentElement.innerHTML,
        text: contentElement.textContent?.trim() || '',
        title: title,
        publishTime: publishTime
      };
    });

    await browser.close();
    browser = undefined;

    if (!result || !result.text || result.text.length < 100) {
      throw new Error('Content extraction failed or content too short');
    }

    console.log(`[Crawler] Extracted ${result.text.length} chars from ${url}`);

    // Cheerio 后处理
    const $ = cheerio.load(result.html);

    // 修复图片
    $('img').each((_, img) => {
      const $img = $(img);
      const src = $img.attr('data-src') || $img.attr('data-original') || $img.attr('src');
      if (src) {
        $img.attr('src', src);
        $img.removeAttr('data-src');
        $img.removeAttr('data-original');
        $img.removeAttr('loading');
      }
    });

    // 删除残留干扰
    $('[class*="share"], [class*="recommend"], [class*="related"], [class*="comment"]').remove();
    $('script, style').remove();

    // 删除空元素
    $('p, div, span').each((_, el) => {
      const $el = $(el);
      if ($el.text().trim() === '' && $el.children().length === 0) {
        $el.remove();
      }
    });

    // DOMPurify 清洗
    const cleanContent = DOMPurify.sanitize($.html(), {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'a', 'img',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
        'figure', 'figcaption', 'div', 'span',
        'table', 'thead', 'tbody', 'tr', 'th', 'td'
      ],
      ALLOWED_ATTR: ['src', 'href', 'alt', 'title', 'width', 'height'],
      KEEP_CONTENT: true
    }) as string;

    // 处理媒体文件
    const finalContent = await processMedia(cleanContent, url);

    // 生成摘要
    const excerpt = result.text.substring(0, 200).replace(/\s+/g, ' ');

    return {
      title: result.title,
      content: finalContent,
      excerpt: excerpt,
      publishTime: result.publishTime,
      textLength: result.text.length,
      success: true
    };

  } catch (error: any) {
    console.error(`[Crawler] Failed to parse ${url}:`, error.message);
    return {
      content: '',
      success: false,
      error: error.message
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

interface ArticleResult {
  title?: string;
  content: string;
  excerpt?: string;
  publishTime?: string;
  textLength?: number;
  success: boolean;
  error?: string;
}



export async function runRssUpdate() {
  const sourcesRes = await query('SELECT id FROM tnews.rss_sources WHERE enabled = true')
  const results = []
  for (const row of sourcesRes.rows) {
    try {
      const res = await refreshRssSource(row.id)
      results.push({ id: row.id, status: 'success', ...res })
    } catch (err: any) {
      results.push({ id: row.id, status: 'error', error: err.message })
    }
  }
  return results
}

export async function runAiSummary() {
  // 获取未处理的新闻
  const newsRes = await query(
    'SELECT id, title, original_content FROM tnews.news_items WHERE ai_processed = false ORDER BY published_at DESC LIMIT 10'
  )
  
  if (newsRes.rows.length === 0) return { status: 'no_news' }

  // 获取 AI 设置
  const settingsRes = await query('SELECT * FROM tnews.ai_settings LIMIT 1')
  const settings = settingsRes.rows[0] || { summary_length: 5, active_model_id: 'default-openai' }
  
  const modelRes = await query('SELECT * FROM tnews.ai_models WHERE id = $1', [settings.active_model_id])
  if (modelRes.rows.length === 0) {
    throw new Error('Active AI model not found or configured')
  }
  const model = modelRes.rows[0]

  const results = []
  for (const news of newsRes.rows) {
    try {
      const aiResult = await generateAiSummary(
        news.title,
        news.original_content,
        {
          baseUrl: model.base_url,
          apiKey: model.api_key,
          modelName: model.model_name,
          temperature: parseFloat(model.temperature)
        },
        settings.summary_length
      )

      await query(`
        UPDATE tnews.news_items
        SET 
          ai_summary = $1,
          ai_processed = true,
          ai_highlight = $2,
          sentiment = $3,
          importance = $4,
          updated_at = now()
        WHERE id = $5
      `, [aiResult.summary, aiResult.highlight, aiResult.sentiment, aiResult.importance, news.id])

      results.push({ id: news.id, status: 'success' })
    } catch (err: any) {
      results.push({ id: news.id, status: 'error', error: err.message })
    }
  }
  return results
}

export async function runNewsCrawl() {
  console.log('[Crawler] Starting batch job...')

  // 1. 查询待爬取列表 (未爬取过且 URL 有效)
  const newsRes = await query(
    `SELECT id, url 
     FROM tnews.news_items 
     WHERE crawled_at IS NULL 
     AND (original_content <> 'CRAWL_FAILED' AND original_content <> 'INVALID_URL' OR original_content IS NULL OR original_content = '')
     ORDER BY published_at DESC
     LIMIT 20`
  )
  
  if (newsRes.rows.length === 0) {
    console.log('[Crawler] No pending news items.')
    return []
  }

  const results = []

  // 2. 遍历执行
  for (const news of newsRes.rows) {
    // 简单的休眠，礼貌爬虫，防止被封 IP
    await new Promise(r => setTimeout(r, 1000))

    try {
      if (!news.url) {
        // 标记为无效，避免下次再查到
        await query(
           `UPDATE tnews.news_items SET original_content = 'INVALID_URL' WHERE id = $1`,
           [news.id]
        )
        continue
      }
      
      console.log(`[Crawler] Processing: ${news.url}`)
      const result = await parseArticle(news.url)

      if (result.success && result.content) {
        // 3. 成功：更新数据库
        await query(
          `UPDATE tnews.news_items 
           SET original_content = $1, 
               crawled_at = now(), 
               updated_at = now() 
           WHERE id = $2`,
          [result.content, news.id]
        )
        
        results.push({ id: news.id, status: 'success', title: result.title })
      } else {
        // 4. 失败：记录错误，防止死循环
        await query(
          `UPDATE tnews.news_items 
           SET original_content = 'CRAWL_FAILED', 
               updated_at = now() 
           WHERE id = $1`,
          [news.id]
        )
        
        results.push({ id: news.id, status: 'failed' })
      }

    } catch (err: any) {
      console.error(`[Crawler] DB Error for ID ${news.id}:`, err)
      results.push({ id: news.id, status: 'error', error: err.message })
    }
  }
  
  console.log(`[Crawler] Batch finished. Processed ${results.length} items.`)
  return results
}
