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

// Load from localStorage on init
if (import.meta.client) {
  const saved = localStorage.getItem('proxy_settings')
  if (saved) {
    try {
      Object.assign(proxySettings, JSON.parse(saved))
    } catch (e) {
      console.error('Failed to parse proxy settings', e)
    }
  }
}

// Watch for changes and save
watch(proxySettings, (newVal) => {
  if (import.meta.client) {
    localStorage.setItem('proxy_settings', JSON.stringify(newVal))
  }
}, { deep: true })

export const useProxyConfig = () => {
  const proxyUrl = computed(() => {
    if (!proxySettings.enabled) return ''
    const auth = proxySettings.username ? `${proxySettings.username}:${proxySettings.password}@` : ''
    return `${proxySettings.protocol}://${auth}${proxySettings.host}:${proxySettings.port}`
  })

  return {
    proxySettings,
    proxyUrl
  }
}
