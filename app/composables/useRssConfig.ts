import { ref, computed } from 'vue'
import type { RssSource } from '../types/news'

export const useRssConfig = () => {
  const rssSources = ref<RssSource[]>([
    {
      id: 'bbc',
      name: 'BBC新闻',
      url: 'http://feeds.bbci.co.uk/news/rss.xml',
      category: 'international',
      color: '#FF5733',
      icon: 'globe-europe',
      enabled: true,
      lastUpdated: '2023-10-15 09:30'
    },
    {
      id: 'reuters',
      name: '路透社',
      url: 'http://feeds.reuters.com/reuters/topNews',
      category: 'finance',
      color: '#3498db',
      icon: 'newspaper',
      enabled: true,
      lastUpdated: '2023-10-15 10:15'
    },
    {
      id: 'techcrunch',
      name: 'TechCrunch',
      url: 'http://feeds.feedburner.com/TechCrunch/',
      category: 'tech',
      color: '#e74c3c',
      icon: 'microchip',
      enabled: true,
      lastUpdated: '2023-10-15 08:45'
    },
    {
      id: 'nytimes',
      name: '纽约时报',
      url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
      category: 'general',
      color: '#2c3e50',
      icon: 'landmark',
      enabled: true,
      lastUpdated: '2023-10-15 11:20'
    },
    {
      id: 'guardian',
      name: '卫报',
      url: 'https://www.theguardian.com/world/rss',
      category: 'international',
      color: '#14284B',
      icon: 'shield-alt',
      enabled: false,
      lastUpdated: '2023-10-14 16:30'
    }
  ])

  const enabledRssSources = computed(() => rssSources.value.filter((s) => s.enabled))

  const addRssSource = (url: string, name?: string) => {
    const newSource: RssSource = {
      id: `custom-${Date.now()}`,
      name: name || '自定义源',
      url,
      category: 'general',
      color: '#6366f1',
      icon: 'rss',
      enabled: true,
      lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' ')
    }
    rssSources.value.push(newSource)
    return newSource
  }

  const getSourceById = (id: string) => rssSources.value.find((s) => s.id === id)

  return {
    rssSources,
    enabledRssSources,
    addRssSource,
    getSourceById
  }
}
