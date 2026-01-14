import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { initScheduler } from '../utils/scheduler'

export default defineNitroPlugin((nitroApp) => {
  // 延迟初始化，确保数据库等已就绪
  setTimeout(() => {
    initScheduler().catch(console.error)
  }, 1000)
})
