import { query } from './db'
import { refreshRssSource } from './rss'
import { generateAiSummary, generateEmbedding } from './ai'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'
import DOMPurify from 'isomorphic-dompurify'
import * as cheerio from 'cheerio'
import { chromium, Browser, Page } from 'playwright'
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



export async function parseArticle(url: string): Promise<CrawlResult> {
  let browser: Browser | undefined;
  
  try {
    const proxy = await getPlaywrightProxy();
    
    // 1. 浏览器启动配置优化 (增加指纹伪装参数)
    browser = await chromium.launch({
      headless: true,
      proxy: proxy || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled', // 隐藏自动化特征
        '--disable-infobars'
      ]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      extraHTTPHeaders: {
        'Accept-Language': 'ja,zh-CN;q=0.9,en;q=0.8', // 针对你提到的 NHK，稍微优先日语
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    const page = await context.newPage();

    // 2. 更加健壮的导航逻辑
    let navigationError = null;
    try {
      // 稍微延长超时，部分重媒体网站加载慢
      console.log(`[Crawler] Navigating to ${url}...`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    } catch (e: any) {
      navigationError = e;
      console.warn(`[Crawler] Initial load failed: ${e.message}, attempting without proxy...`);
    }

    // 如果第一次失败且有代理，尝试不使用代理重试
    if (navigationError && proxy) {
      try {
        // 关闭当前浏览器，重新启动一个不带代理的
        await browser.close();
        browser = await chromium.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars'
          ]
        });
        const retryContext = await browser.newContext({
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          viewport: { width: 1920, height: 1080 },
          extraHTTPHeaders: {
            'Accept-Language': 'ja,zh-CN;q=0.9,en;q=0.8',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Upgrade-Insecure-Requests': '1'
          }
        });
        const retryPage = await retryContext.newPage();
        console.log(`[Crawler] Retrying without proxy: ${url}...`);
        await retryPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        
        return await extractContentFromPage(retryPage, url, browser);
      } catch (retryError: any) {
        console.error(`[Crawler] Retry without proxy also failed: ${retryError.message}`);
        throw retryError;
      }
    } else if (navigationError) {
      throw navigationError;
    }

    return await extractContentFromPage(page, url, browser);
  } catch (error: any) {
    console.error(`[Crawler] Failed: ${url} - ${error.message}`);
    return {
      title: '',
      content: '',
      excerpt: '',
      success: false,
      error: error.message
    };
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * 从已加载的页面中提取内容
 */
async function extractContentFromPage(page: Page, url: string, browser: Browser): Promise<CrawlResult> {
  try {
    // 3. 【关键】自动滚动以触发懒加载 (解决截断问题)
    await autoScroll(page);

    // 4. 等待网络空闲 (确保 JS 渲染的内容加载完毕)
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {}); 
    } catch (e) {
      console.log('[Crawler] Network idle timeout, proceeding anyway...');
    }

    // 5. 在浏览器上下文中预处理 DOM (移除绝对的垃圾)
    await page.evaluate(() => {
      // 移除脚本、样式、弹窗
      document.querySelectorAll('script, style, noscript, iframe, svg, canvas').forEach(el => el.remove());
      document.querySelectorAll('dialog, [role="dialog"], [class*="popup"], [class*="modal"]').forEach(el => el.remove());
      const body = document.body;
      if (body) {
        body.querySelectorAll('nav, footer').forEach(el => {
          if (!el.closest('article') && !el.closest('[role="main"]')) el.remove();
        });
      }
    });

    // 6. 获取完整 HTML 并在 Node 环境解析
    const fullHtml = await page.content();
    
    // 7. 使用 JSDOM + Readability 进行智能提取
    const dom = new JSDOM(fullHtml, { url });
    const reader = new Readability(dom.window.document, {
      charThreshold: 100,
      nbTopCandidates: 5
    });

    const article = reader.parse();

    if (!article || !article.content) {
      throw new Error('Readability failed to identify content');
    }

    // 8. 后处理 (Cheerio + DOMPurify)
    const $ = cheerio.load(article.content);

    // 修复图片链接
    $('img').each((_, img) => {
      const $img = $(img);
      const realSrc = $img.attr('data-src') || $img.attr('data-original') || $img.attr('src');
      if (realSrc) {
        $img.attr('src', realSrc);
        $img.removeAttr('loading');
        $img.removeAttr('srcset');
      }
    });

    // 移除空标签
    $('div, span, p').each((_, el) => {
      if ($(el).text().trim().length === 0 && $(el).find('img').length === 0) {
        $(el).remove();
      }
    });

    // 安全清洗
    const finalContent = DOMPurify.sanitize($.html(), {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'img', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'table', 'tr', 'td', 'th', 'tbody', 'thead'],
      ALLOWED_ATTR: ['src', 'href', 'alt', 'title'],
      KEEP_CONTENT: true
    }) as string;

    // 处理媒体文件上传到 MinIO
    const contentWithMinio = await processMedia(finalContent, url);
    return {
      title: article.title || '',
      content: contentWithMinio,
      excerpt: article.excerpt || article.textContent?.substring(0, 200) || '',
      publishTime: article.publishedTime || undefined,
      success: true
    };
  } catch (error: any) {
    throw error;
  }
}

/**
 * 自动滚动页面到底部，以触发懒加载内容
 */
async function autoScroll(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 300; // 每次滚动距离
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        // 如果滚动超过页面高度，或者滚动时间超过 10 秒（防止无限滚动页面卡死）
        if (totalHeight >= scrollHeight || totalHeight > 15000) {
          clearInterval(timer);
          resolve();
        }
      }, 100); // 滚动间隔
    });
  });
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

  // 刷新完成后，自动触发增量 Embedding 生成
  try {
    console.log('[Task] Starting incremental embedding generation after RSS update...')
    await runEmbeddingGeneration()
  } catch (err: any) {
    console.error('[Task] Auto embedding generation failed:', err.message)
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

      // 尝试生成 Embedding
      let embeddingVector = null
      if (settings.embedding_model_id) {
        const embedModelRes = await query('SELECT * FROM tnews.ai_models WHERE id = $1', [settings.embedding_model_id])
        if (embedModelRes.rows.length > 0) {
          const embedModel = embedModelRes.rows[0]
          try {
            const vec = await generateEmbedding(
              `${news.title}\n${news.original_content.substring(0, 500)}`, // 组合标题和摘要/内容前缀
              {
                baseUrl: embedModel.base_url,
                apiKey: embedModel.api_key,
                modelName: embedModel.model_name,
                temperature: 0,
                provider: embedModel.provider
              }
            )
            embeddingVector = `[${vec.join(',')}]`
          } catch (e) {
            console.error(`Failed to generate embedding for news ${news.id}:`, e)
          }
        }
      }

      await query(`
        UPDATE tnews.news_items
        SET 
          ai_summary = $1,
          ai_processed = true,
          ai_highlight = $2,
          sentiment = $3,
          importance = $4,
          embedding = COALESCE($5, embedding),
          updated_at = now()
        WHERE id = $6
      `, [aiResult.summary, aiResult.highlight, aiResult.sentiment, aiResult.importance, embeddingVector, news.id])

      results.push({ id: news.id, status: 'success' })
    } catch (err: any) {
      results.push({ id: news.id, status: 'error', error: err.message })
    }
  }
  return results
}

export async function runEmbeddingGeneration() {
  const settingsRes = await query('SELECT * FROM tnews.ai_settings LIMIT 1')
  const settings = settingsRes.rows[0]
  
  if (!settings?.embedding_model_id) {
    throw new Error('Embedding model not configured')
  }

  const modelRes = await query('SELECT * FROM tnews.ai_models WHERE id = $1', [settings.embedding_model_id])
  if (modelRes.rows.length === 0) {
    throw new Error('Embedding model not found')
  }
  const model = modelRes.rows[0]

  // 获取没有 embedding 的新闻
  const newsRes = await query(
    'SELECT id, title, original_content, content_snippet FROM tnews.news_items WHERE embedding IS NULL ORDER BY published_at DESC LIMIT 50'
  )

  const results = []
  for (const news of newsRes.rows) {
    try {
      // 优先使用 original_content，如果太长截取前 8000 字符
      const contentText = news.original_content 
        ? news.original_content.substring(0, 8000) 
        : (news.content_snippet || news.title)
      
      const textToEmbed = `${news.title}\n${contentText}`

      const vec = await generateEmbedding(
        textToEmbed,
        {
          baseUrl: model.base_url,
          apiKey: model.api_key,
          modelName: model.model_name,
          temperature: 0,
          provider: model.provider
        }
      )
      
      const vectorStr = `[${vec.join(',')}]`

      await query(
        'UPDATE tnews.news_items SET embedding = $1 WHERE id = $2',
        [vectorStr, news.id]
      )

      results.push({ id: news.id, status: 'success' })
    } catch (err: any) {
      console.error(`Failed to generate embedding for news ${news.id}:`, err)
      results.push({ id: news.id, status: 'error', error: err.message })
    }
  }
  return results
}

