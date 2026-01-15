import { getProxyUrl } from '../../utils/proxy'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { SocksProxyAgent } from 'socks-proxy-agent'
import http from 'http'
import https from 'https'
import { URL } from 'url'

// 国内常见域名后缀和 CDN 域名白名单
const DOMESTIC_DOMAINS = [
  '.cn',
  '.qq.com',
  '.163.com',
  '.126.net',
  '.baidu.com',
  '.sina.com.cn',
  '.weibo.com',
  '.sohu.com',
  '.zhimg.com', // 知乎
  '.bilivideo.com',
  '.hdslb.com',
  '.alicdn.com',
  '.bdstatic.com',
  '.gtimg.com', // 腾讯
  '.qpic.cn',   // 腾讯
  '.xinhuanet.com',
  '.people.com.cn',
  '.huanqiu.com',
  '.huanqiucdn.cn',
  '.cctv.com',
  '.cs.com.cn'
]

function isDomesticUrl(urlStr: string): boolean {
  try {
    const hostname = new URL(urlStr).hostname
    return DOMESTIC_DOMAINS.some(domain => hostname.endsWith(domain))
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const imageUrl = query.url as string

  if (!imageUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing url parameter'
    })
  }

  // 1. 检查是否为国内域名
  const isDomestic = isDomesticUrl(imageUrl)
  
  // 2. 获取代理配置
  // 如果是国内域名，强制不使用代理
  const proxyUrl = isDomestic ? null : await getProxyUrl()

  // 3. 准备请求选项
  const options: any = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      // 不发送 Referer 以绕过防盗链，或者可以设置为来源域名
      'Referer': '' 
    }
  }

  if (proxyUrl) {
    const agent = proxyUrl.startsWith('socks') 
      ? new SocksProxyAgent(proxyUrl) 
      : new HttpsProxyAgent(proxyUrl)
    options.agent = agent
  }

  // 4. 发起请求
  return new Promise((resolve, reject) => {
    const client = imageUrl.startsWith('https') ? https : http
    
    const req = client.get(imageUrl, options, (res) => {
      // 检查状态码
      if (res.statusCode && res.statusCode >= 400) {
        // 如果是 404 或其他错误，尝试直接重定向回原链接（让客户端自己试）
        // 或者直接返回错误图片
        // 这里选择抛出错误
        reject(createError({
          statusCode: res.statusCode,
          statusMessage: `Failed to fetch image: ${res.statusMessage}`
        }))
        return
      }

      // 设置响应头
      const contentType = res.headers['content-type']
      if (contentType) {
        setHeader(event, 'Content-Type', contentType)
      }
      // 设置缓存头，图片通常可以缓存很久
      setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

      // 管道流传输
      resolve(res)
    })

    req.on('error', (err) => {
      reject(createError({
        statusCode: 502,
        statusMessage: `Proxy request failed: ${err.message}`
      }))
    })
    
    // 设置超时
    req.setTimeout(10000, () => {
      req.destroy()
      reject(createError({
        statusCode: 504,
        statusMessage: 'Proxy request timeout'
      }))
    })
  })
})
