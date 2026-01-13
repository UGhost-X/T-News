import { ref, computed } from 'vue'
import type { RssSource } from '../types/news'

export const useRssConfig = () => {
  const rssSources = ref<RssSource[]>([])
  const isLoading = ref(false)

  const enabledRssSources = computed(() => rssSources.value.filter((s) => s.enabled))

  const fetchSources = async () => {
    isLoading.value = true
    try {
      const data = await $fetch<RssSource[]>('/api/rss/sources')
      if (data) {
        rssSources.value = data
      }
    } catch (e) {
      console.error('Failed to fetch RSS sources', e)
    } finally {
      isLoading.value = false
    }
  }

  const validateRssUrl = async (url: string) => {
    try {
      const res = await $fetch<{ valid: boolean; message: string; title?: string }>('/api/rss/validate', {
        method: 'POST',
        body: { url }
      })
      return res
    } catch (e) {
      return { valid: false, message: '网络错误，无法验证订阅源' }
    }
  }

  const addRssSource = async (source: Partial<RssSource>) => {
    const tempId = `custom-${Date.now()}`
    const newSource: RssSource = {
      id: tempId,
      name: source.name || '自定义源',
      url: source.url || '',
      category: source.category || 'general',
      color: source.color || '#6366f1',
      icon: source.icon || 'rss',
      enabled: source.enabled ?? true,
      lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' ')
    }

    try {
      const res = await $fetch<{ success: boolean; id?: string }>('/api/rss/sources', {
        method: 'POST',
        body: newSource
      })
      if (res.success) {
        if (res.id) newSource.id = res.id
        rssSources.value.push(newSource)
        return newSource
      }
    } catch (e) {
      console.error('Failed to add RSS source', e)
      throw e
    }
    return null
  }

  const updateRssSource = async (id: string, updates: Partial<RssSource>) => {
    const index = rssSources.value.findIndex(s => s.id === id)
    if (index === -1) return null

    const currentSource = rssSources.value[index]
    if (!currentSource) return null

    const updatedSource: RssSource = { ...currentSource, ...updates } as RssSource
    
    try {
      const res = await $fetch<{ success: boolean }>('/api/rss/sources', {
        method: 'POST',
        body: updatedSource
      })
      if (res.success) {
        rssSources.value[index] = updatedSource
        return updatedSource
      }
    } catch (e) {
      console.error('Failed to update RSS source', e)
      throw e
    }
    return null
  }

  const removeRssSource = async (id: string) => {
    const index = rssSources.value.findIndex(s => s.id === id)
    if (index === -1) return null

    try {
      const res = await $fetch<{ success: boolean }>('/api/rss/sources', {
        method: 'DELETE',
        body: { id }
      })
      if (res.success) {
        const removed = rssSources.value.splice(index, 1)
        return removed[0]
      }
    } catch (e) {
      console.error('Failed to remove RSS source', e)
      throw e
    }
    return null
  }

  const getSourceById = (id: string) => rssSources.value.find((s) => s.id === id)

  // 初始化加载
  if (process.client) {
    fetchSources()
  }

  return {
    rssSources,
    enabledRssSources,
    isLoading,
    fetchSources,
    validateRssUrl,
    addRssSource,
    updateRssSource,
    removeRssSource,
    getSourceById
  }
}
