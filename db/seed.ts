import pg from 'pg'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const { Pool } = pg

const pool = new Pool({
  connectionString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
})

const mockNewsData = [
  {
    id: 1,
    title: 'OpenAI发布新一代AI模型，性能提升40%',
    source: 'TechCrunch',
    sourceId: 'techcrunch',
    originalContent: 'OpenAI today announced its latest AI model...',
    aiSummary: 'OpenAI发布新一代AI模型，性能比前代提升40%...',
    time: '2023-10-15 09:30:00',
    category: 'tech',
    sentiment: 'positive',
    importance: 9,
    aiProcessed: true,
    aiHighlight: true,
    similarSources: ['BBC', 'Reuters'],
    tags: ['AI突破', '技术发展', '创新'],
    url: 'https://techcrunch.com/openai-new-model'
  },
  {
    id: 2,
    title: '美联储维持利率不变，市场反应平淡',
    source: '路透社',
    sourceId: 'reuters',
    originalContent: "The Federal Reserve held interest rates steady...",
    aiSummary: '美联储周三维持利率不变...',
    time: '2023-10-15 10:15:00',
    category: 'finance',
    sentiment: 'neutral',
    importance: 8,
    aiProcessed: true,
    aiHighlight: true,
    similarSources: ['纽约时报', 'BBC'],
    tags: ['货币政策', '经济政策', '通货膨胀'],
    url: 'https://reuters.com/fed-rates-steady'
  },
  {
    id: 3,
    title: '全球气候峰会达成新协议，2050年碳中和目标获通过',
    source: 'BBC新闻',
    sourceId: 'bbc',
    originalContent: 'World leaders at the Global Climate Summit have agreed...',
    aiSummary: '全球气候峰会达成新协议...',
    time: '2023-10-15 11:20:00',
    category: 'international',
    sentiment: 'positive',
    importance: 9,
    aiProcessed: true,
    aiHighlight: true,
    similarSources: ['卫报', '纽约时报'],
    tags: ['气候变化', '国际协议', '环境保护'],
    url: 'https://bbc.com/climate-summit-2050'
  }

]

async function seed() {
  const client = await pool.connect()
  try {
    console.log('Starting seed...')
    
    // 1. Seed RSS Sources (from previous init.sql, but ensuring they exist)
    const rssSources = [
      ['bbc', 'BBC新闻', 'http://feeds.bbci.co.uk/news/rss.xml', 'international', '#FF5733', 'globe-europe'],
      ['reuters', '路透社', 'http://feeds.reuters.com/reuters/topNews', 'finance', '#3498db', 'newspaper'],
      ['techcrunch', 'TechCrunch', 'http://feeds.feedburner.com/TechCrunch/', 'tech', '#e74c3c', 'microchip'],
      ['nytimes', '纽约时报', 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', 'general', '#2c3e50', 'landmark']
    ]

    for (const source of rssSources) {
      await client.query(`
        INSERT INTO tnews.rss_sources (source_key, name, url, category, color, icon, enabled)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        ON CONFLICT (source_key) DO UPDATE SET 
          name = EXCLUDED.name,
          url = EXCLUDED.url,
          category = EXCLUDED.category
      `, source)
    }
    console.log('RSS Sources seeded.')

    // 2. Seed News Items
    for (const news of mockNewsData) {
      // Ensure ai_summary column exists (migration)
      await client.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='tnews' AND table_name='news_items' AND column_name='ai_summary') THEN
            ALTER TABLE tnews.news_items ADD COLUMN ai_summary text;
          END IF;
        END $$;
      `)

      const res = await client.query(`
        INSERT INTO tnews.news_items (
          title, source_name, source_key, url, original_content, ai_summary, 
          published_at, category, sentiment, importance, 
          ai_processed, ai_highlight, similar_sources, tags
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id
      `, [
        news.title, news.source, news.sourceId, news.url, news.originalContent, news.aiSummary,
        news.time, news.category, news.sentiment, news.importance,
        news.aiProcessed, news.aiHighlight, news.similarSources, news.tags
      ])
      console.log(`Inserted news item: ${news.title} (ID: ${res.rows[0].id})`)
    }

    // 3. Seed AI Settings
    await client.query(`
      INSERT INTO tnews.ai_settings (summary_length, sentiment_sensitivity, importance_threshold, active_model_id)
      SELECT 5, 7, 6, 'default-openai'
      WHERE NOT EXISTS (SELECT 1 FROM tnews.ai_settings)
    `)
    console.log('AI Settings seeded.')

    // 4. Seed AI Models
    const aiModels = [
      ['default-openai', 'OpenAI GPT-4o', 'openai', 'gpt-4o', 0.7, true, ''],
      ['default-deepseek', 'DeepSeek Chat', 'deepseek', 'deepseek-chat', 0.7, true, ''],
      ['default-ollama', 'Ollama Llama3', 'ollama', 'llama3', 0.7, true, 'http://localhost:11434']
    ]
    for (const model of aiModels) {
      await client.query(`
        INSERT INTO tnews.ai_models (id, name, provider, model_name, temperature, enabled, base_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          provider = EXCLUDED.provider,
          model_name = EXCLUDED.model_name,
          temperature = EXCLUDED.temperature,
          enabled = EXCLUDED.enabled,
          base_url = EXCLUDED.base_url
      `, model)
    }
    console.log('AI Models seeded.')

    // 5. Seed Proxy Settings
    await client.query(`
      INSERT INTO tnews.proxy_settings (enabled, host, port, protocol)
      SELECT false, '127.0.0.1', 7890, 'http'
      WHERE NOT EXISTS (SELECT 1 FROM tnews.proxy_settings)
    `)
    console.log('Proxy Settings seeded.')

    console.log('Seed completed successfully.')
  } catch (err) {
    console.error('Error during seed:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
