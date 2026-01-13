import { reactive, watch, computed } from 'vue'
import type { ProxySettings } from '../types/news'

// Global state
const proxySettings = reactive<ProxySettings>({
  enabled: false,
  host: '127.0.0.1',
  port: 7890,
  protocol: 'http',
  username: '',
  password: ''
})

let isInitialized = false

export const useProxyConfig = () => {
  const fetchSettings = async () => {
    try {
      const data = await $fetch<ProxySettings>('/api/settings/proxy')
      if (data) {
        Object.assign(proxySettings, data)
      }
      isInitialized = true
    } catch (e) {
      console.error('Failed to fetch proxy settings from DB', e)
    }
  }

  const saveSettings = async () => {
    if (!isInitialized) return
    try {
      await $fetch('/api/settings/proxy', {
        method: 'POST',
        body: proxySettings
      })
    } catch (e) {
      console.error('Failed to save proxy settings to DB', e)
    }
  }

  const proxyUrl = computed(() => {
    if (!proxySettings.enabled) return ''
    const auth = proxySettings.username ? `${proxySettings.username}:${proxySettings.password}@` : ''
    return `${proxySettings.protocol}://${auth}${proxySettings.host}:${proxySettings.port}`
  })

  // Watch and save
  watch(proxySettings, () => {
    saveSettings()
  }, { deep: true })

  return {
    proxySettings,
    proxyUrl,
    fetchSettings,
    saveSettings
  }
}
