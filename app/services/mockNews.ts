import type { NewsItem, TrendingTopic } from '../types/news'

const mockNewsData: NewsItem[] = [
  {
    id: 1,
    title: 'OpenAI发布新一代AI模型，性能提升40%',
    source: 'TechCrunch',
    sourceId: 'techcrunch',
    originalContent:
      'OpenAI today announced its latest AI model, which the company says is 40% more powerful than its predecessor. The new model demonstrates significant improvements in reasoning capabilities and can handle more complex instructions. According to OpenAI, the model has been trained on a dataset that is five times larger than before, encompassing a wider range of topics and languages.',
    aiSummary:
      'OpenAI发布新一代AI模型，性能比前代提升40%。新模型在推理能力和处理复杂指令方面有显著改进，训练数据量是之前的5倍，涵盖更广泛的主题 and 语言。',
    time: '2小时前',
    category: 'tech',
    sentiment: 'positive',
    importance: 9,
    aiProcessed: true,
    aiHighlight: true,
    similarSources: ['BBC', 'Reuters'],
    tags: ['AI突破', '技术发展', '创新']
  },
  {
    id: 2,
    title: '美联储维持利率不变，市场反应平淡',
    source: '路透社',
    sourceId: 'reuters',
    originalContent:
      "The Federal Reserve held interest rates steady on Wednesday and signaled that it may keep them higher for longer as policymakers continue to fight inflation. The decision was widely expected by financial markets, which showed little reaction following the announcement. Fed Chair Jerome Powell emphasized that the central bank remains committed to bringing inflation back to its 2% target.",
    aiSummary:
      '美联储周三维持利率不变，并暗示可能将利率维持在高位更长时间以继续对抗通胀。这一决定符合市场预期，市场反应平淡。美联储主席鲍威尔强调央行致力于将通胀率恢复到2%的目标。',
    time: '4小时前',
    category: 'finance',
    sentiment: 'neutral',
    importance: 8,
    aiProcessed: true,
    aiHighlight: true,
    similarSources: ['纽约时报', 'BBC'],
    tags: ['货币政策', '经济政策', '通货膨胀']
  },
  {
    id: 3,
    title: '全球气候峰会达成新协议，2050年碳中和目标获通过',
    source: 'BBC新闻',
    sourceId: 'bbc',
    originalContent:
      'World leaders at the Global Climate Summit have agreed on a new accord that sets a target of net-zero carbon emissions by 2050. The agreement, which was reached after two weeks of intense negotiations, includes commitments from developed countries to provide financial support to developing nations. Environmental groups have welcomed the deal but warn that immediate action is needed.',
    aiSummary:
      '全球气候峰会达成新协议，设定2050年实现碳中和目标。经过两周紧张谈判达成的协议包括发达国家向发展中国家提供财政支持的承诺。环保组织欢迎该协议，但警告需要立即采取行动。',
    time: '6小时前',
    category: 'international',
    sentiment: 'positive',
    importance: 9,
    aiProcessed: true,
    aiHighlight: true,
    similarSources: ['卫报', '纽约时报'],
    tags: ['气候变化', '国际协议', '环境保护']
  },
  {
    id: 4,
    title: '特斯拉发布新一代电动汽车，续航突破800公里',
    source: 'TechCrunch',
    sourceId: 'techcrunch',
    originalContent:
      'Tesla unveiled its next-generation electric vehicle today, boasting a record-breaking range of over 800 kilometers on a single charge. The new model also features faster charging capabilities and an updated autonomous driving system. CEO Elon Musk said the vehicle represents a significant step forward in making sustainable transportation accessible to more people.',
    time: '8小时前',
    category: 'tech',
    sentiment: 'positive',
    importance: 7,
    aiProcessed: false,
    aiHighlight: false,
    similarSources: ['路透社'],
    tags: ['电动汽车', '技术创新', '可持续交通']
  },
  {
    id: 5,
    title: '欧洲央行考虑进一步加息以应对通胀',
    source: '路透社',
    sourceId: 'reuters',
    originalContent:
      "The European Central Bank is considering further interest rate hikes as inflation remains stubbornly high across the eurozone. According to sources familiar with the matter, policymakers are debating whether another increase is necessary at their next meeting. The eurozone's inflation rate has been above the ECB's target for over two years.",
    aiSummary:
      '欧洲央行考虑进一步加息以应对持续高企的通胀。熟悉情况的消息人士称，政策制定者正在辩论是否在下次会议上再次加息。欧元区通胀率已连续两年多高于欧洲央行目标。',
    time: '10小时前',
    category: 'finance',
    sentiment: 'neutral',
    importance: 7,
    aiProcessed: true,
    aiHighlight: false,
    similarSources: ['BBC'],
    tags: ['欧洲经济', '货币政策', '通货膨胀']
  },
  {
    id: 6,
    title: '人工智能在医疗诊断领域取得突破性进展',
    source: 'BBC新闻',
    sourceId: 'bbc',
    originalContent:
      'Researchers have developed an AI system that can diagnose certain medical conditions with accuracy comparable to human experts. The technology, which was tested across multiple hospitals, showed promising results in early detection of diseases. Experts believe this could help address shortages of medical professionals in some regions.',
    time: '12小时前',
    category: 'tech',
    sentiment: 'positive',
    importance: 8,
    aiProcessed: false,
    aiHighlight: true,
    similarSources: ['纽约时报'],
    tags: ['医疗AI', '诊断技术', '医疗创新']
  },
  {
    id: 7,
    title: '世界杯预选赛：多支强队提前晋级',
    source: 'BBC新闻',
    sourceId: 'bbc',
    originalContent:
      "Several top football nations have secured their spots in the upcoming World Cup following the latest round of qualifiers. The results have set the stage for what promises to be an exciting tournament next year. Fans are already anticipating high-stakes matches between traditional rivals.",
    time: '1天前',
    category: 'sports',
    sentiment: 'positive',
    importance: 6,
    aiProcessed: false,
    aiHighlight: false,
    similarSources: [],
    tags: ['足球', '世界杯', '体育赛事']
  },
  {
    id: 8,
    title: '好莱坞编剧罢工结束，新协议达成',
    source: '纽约时报',
    sourceId: 'nytimes',
    originalContent:
      "The Hollywood writers' strike has come to an end after union leaders reached a tentative agreement with major studios. The deal includes higher pay and improved working conditions for writers, particularly regarding streaming media residuals. Production on many television shows and films is expected to resume soon.",
    time: '1天前',
    category: 'entertainment',
    sentiment: 'neutral',
    importance: 5,
    aiProcessed: false,
    aiHighlight: false,
    similarSources: [],
    tags: ['娱乐产业', '劳资谈判', '流媒体']
  }
]

const mockTrendingTopics: TrendingTopic[] = [
  { id: 1, title: 'AI模型性能突破', count: 42, category: 'tech' },
  { id: 2, title: '全球货币政策调整', count: 38, category: 'finance' },
  { id: 3, title: '气候变化协议进展', count: 35, category: 'international' },
  { id: 4, title: '电动汽车技术创新', count: 28, category: 'tech' },
  { id: 5, title: '医疗AI诊断应用', count: 24, category: 'tech' }
]

export const fetchNews = async (proxyUrl?: string): Promise<NewsItem[]> => {
  if (proxyUrl) {
    console.log(`Fetching news via proxy: ${proxyUrl}`)
  }
  await new Promise((resolve) => setTimeout(resolve, 800))
  return [...mockNewsData]
}

export const fetchTrendingTopics = async (): Promise<TrendingTopic[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return [...mockTrendingTopics]
}

export const mockAiProcess = async (newsId: number, summaryLength: number, modelName: string = 'Default'): Promise<Partial<NewsItem>> => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  const news = mockNewsData.find((n) => n.id === newsId)
  console.log(`Processing with model: ${modelName}`)
  return {
    aiProcessed: true,
    aiSummary: `[AI Summary by ${modelName}] - [Length ${summaryLength}/10]: This is a simulated AI summary for "${news?.title}". It captures the core essence of the news content.`
  }
}
