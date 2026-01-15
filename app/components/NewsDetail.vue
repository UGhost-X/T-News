<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-none shadow-2xl rounded-2xl !grid-cols-none !grid-rows-none">
      <DialogHeader class="sr-only">
        <DialogTitle>{{ news?.title || '新闻详情' }}</DialogTitle>
        <DialogDescription>
          {{ news ? `来自 ${news.source} 的新闻详情` : '新闻内容加载中' }}
        </DialogDescription>
      </DialogHeader>
      <div v-if="news" class="flex flex-col h-full min-h-0 flex-1 bg-white dark:bg-slate-900 overflow-hidden">
        <!-- Header -->
        <div class="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
          <div class="flex flex-wrap items-center gap-3 mb-4">
            <div class="flex items-center">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm" :style="{ backgroundColor: sourceColor(news.sourceId) }">
                {{ news.source.substring(0, 2) }}
              </div>
              <span class="ml-2.5 font-bold text-slate-900 dark:text-white text-sm">{{ news.source }}</span>
            </div>
            <div class="h-4 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1"></div>
            <div class="text-xs text-slate-500 dark:text-slate-400 flex items-center">
              <i class="far fa-clock mr-1.5"></i>
              {{ news.time }}
            </div>
            <div class="flex gap-2 ml-auto">
              <span class="text-[10px] px-2 py-0.5 rounded-md font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                {{ categoryLabel(news.category) }}
              </span>
              <span v-if="news.aiProcessed" class="text-[10px] px-2 py-0.5 rounded-md font-bold" :style="sentimentTagStyle(news.sentiment)">
                {{ sentimentLabel(news.sentiment) }}
              </span>
            </div>
          </div>
          <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {{ news.title }}
          </h2>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 custom-scrollbar break-words">
          <!-- AI Summary Section -->
          <div v-if="news.aiProcessed" class="mb-8 p-6 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 relative overflow-hidden">
            <div class="absolute top-0 right-0 p-4 opacity-5">
              <i class="fas fa-robot text-4xl text-primary"></i>
            </div>
            <div class="flex items-center text-primary font-bold text-base mb-3">
              <i class="fas fa-magic mr-2.5"></i>
              AI 智能摘要
            </div>
            <p class="text-slate-800 dark:text-slate-200 text-base md:text-lg leading-relaxed font-medium italic">
              "{{ news.aiSummary }}"
            </p>
          </div>

          <!-- Original Content Section -->
          <div class="max-w-none">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">
                <i class="fas fa-align-left mr-2"></i>
                原文内容
              </div>
              <button 
                class="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center border border-indigo-100 dark:border-indigo-800"
                @click="handleFullTextTranslate()"
                :disabled="isTranslating"
              >
                <i :class="isTranslating ? 'fas fa-spinner fa-spin' : 'fas fa-language'" class="mr-1.5"></i>
                {{ isTranslating ? '翻译中...' : (isShowingTranslation ? '显示原文' : 'AI 全文翻译') }}
              </button>
            </div>
            <div 
              v-if="isShowingTranslation && translationSegments.length > 0"
              class="news-content prose prose-slate dark:prose-invert max-w-none md:prose-lg prose-headings:font-bold prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:text-blue-500 prose-img:rounded-xl prose-img:shadow-lg"
            >
              <div v-for="segment in translationSegments" :key="segment.id" class="mb-6 relative group">
                <!-- Original HTML Content -->
                <div v-html="segment.html"></div>
                
                <!-- Translation Toggle Trigger -->
                <div 
                  v-if="segment.translation"
                  class="mt-2 flex items-center gap-2 cursor-pointer select-none opacity-60 hover:opacity-100 transition-opacity w-fit"
                  @click="toggleSegmentTranslation(segment.id)"
                >
                  <div class="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs">
                    <i :class="expandedSegments.has(segment.id) ? 'fas fa-chevron-up' : 'fas fa-language'"></i>
                  </div>
                  <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {{ expandedSegments.has(segment.id) ? '收起翻译' : '查看翻译' }}
                  </span>
                </div>

                <!-- Translation Content -->
                <div 
                  v-if="expandedSegments.has(segment.id)" 
                  class="mt-3 p-4 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-xl text-base text-slate-700 dark:text-slate-300 border border-indigo-100 dark:border-indigo-900/30 animate-fade-in"
                >
                  {{ segment.translation }}
                </div>
              </div>
            </div>
            
            <div 
              v-else
              class="news-content prose prose-slate dark:prose-invert max-w-none md:prose-lg prose-headings:font-bold prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:text-blue-500 prose-img:rounded-xl prose-img:shadow-lg"
              v-html="processedNewsContent"
              @mouseup="handleTextSelection"
            >
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <button 
                class="flex items-center px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-primary transition-all text-sm font-bold border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm"
                @click="$emit('toggle-read', news.id)"
              >
                <i :class="news.bookmarked ? 'fas fa-bookmark text-primary' : 'far fa-bookmark'" class="mr-2"></i>
                {{ news.bookmarked ? '取消收藏' : '加入收藏' }}
              </button>

              <button 
                v-if="translationSegments.length > 0"
                class="flex items-center px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-primary transition-all text-sm font-bold border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm"
                @click="handleFullTextTranslate(true)"
              >
                <i :class="isTranslating ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'" class="mr-2"></i>
                {{ isTranslating ? '翻译中...' : '重新翻译' }}
              </button>

              <button 
                class="flex items-center px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-primary transition-all text-sm font-bold border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm"
                @click="$emit('share', news.id)"
              >
                <i class="fas fa-share-alt mr-2"></i>
                分享新闻
              </button>
            </div>
            
            <a 
              v-if="news.url"
              :href="news.url" 
              target="_blank" 
              class="flex items-center px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm"
            >
              阅读原文
              <i class="fas fa-external-link-alt ml-2 text-xs"></i>
            </a>
            <div v-else class="text-xs text-slate-400 dark:text-slate-500 italic">
              暂无原文链接
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Selection Translate Button -->
  <div 
    v-if="showSelectionBtn"
    class="fixed z-[60] transform -translate-x-1/2 -translate-y-full px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl cursor-pointer hover:bg-slate-800 transition-all flex items-center animate-fade-in"
    :style="{ top: `${selectionPosition.y}px`, left: `${selectionPosition.x}px` }"
    @mousedown.prevent="translateSelection" 
  >
    <i class="fas fa-language mr-1.5 text-indigo-400"></i> 翻译选中
  </div>

  <!-- Selection Result Dialog -->
  <Dialog :open="isSelectionTranslateOpen" @update:open="isSelectionTranslateOpen = $event">
    <DialogContent class="sm:max-w-[500px] border-none shadow-2xl rounded-2xl">
      <DialogHeader>
        <DialogTitle class="flex items-center">
          <i class="fas fa-language mr-2 text-indigo-500"></i>
          AI 翻译结果
        </DialogTitle>
      </DialogHeader>
      <div class="py-2">
        <div v-if="isTranslatingSelection" class="flex flex-col items-center justify-center py-8">
           <i class="fas fa-spinner fa-spin text-3xl text-indigo-500 mb-3"></i>
           <p class="text-slate-500 text-sm">正在翻译...</p>
        </div>
        <div v-else class="space-y-4">
           <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm text-slate-600 dark:text-slate-400 leading-relaxed border border-slate-100 dark:border-slate-800">
             {{ selectionText }}
           </div>
           <div class="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed border border-indigo-100 dark:border-indigo-900/30">
             {{ selectionTranslation }}
           </div>
           <div class="flex justify-end pt-2">
             <button 
               class="flex items-center px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all text-sm font-bold"
               @click="translateSelection"
               :disabled="isTranslatingSelection"
             >
               <i :class="isTranslatingSelection ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'" class="mr-2"></i>
               {{ isTranslatingSelection ? '翻译中...' : '重新翻译' }}
             </button>
           </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { toast } from 'vue-sonner'
import type { NewsItem } from '../types/news'
import { useRssConfig } from '../composables/useRssConfig'

const props = defineProps<{
  news: NewsItem
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'toggle-read', id: number): void
  (e: 'share', id: number): void
}>()

const { getSourceById } = useRssConfig()

const isTranslating = ref(false)
const isShowingTranslation = ref(false)
const selectionText = ref('')
const showSelectionBtn = ref(false)
const selectionPosition = reactive({ x: 0, y: 0 })
const selectionTranslation = ref('')
const isSelectionTranslateOpen = ref(false)
const isTranslatingSelection = ref(false)

interface TranslationSegment {
  id: number
  tag: string
  html: string
  translation: string | null
}

const translationSegments = ref<TranslationSegment[]>([])
const expandedSegments = ref<Set<number>>(new Set())

function sourceColor(sourceId: string) {
  return getSourceById(sourceId)?.color ?? '#6366f1'
}

function categoryLabel(category: string) {
  const labels: Record<string, string> = {
    tech: '科技',
    finance: '财经',
    international: '国际',
    sports: '体育',
    entertainment: '娱乐',
    politics: '时政'
  }
  return labels[category] || '其他'
}

function sentimentLabel(sentiment: NewsItem['sentiment']) {
  const labels: Record<string, string> = {
    neutral: '中性',
    negative: '消极',
    positive: '积极'
  }
  return labels[sentiment] || '中性'
}

function sentimentTagStyle(sentiment: NewsItem['sentiment']) {
  const color = sentiment === 'neutral' ? '#6b7280' : sentiment === 'negative' ? '#ef4444' : '#10b981'
  return { backgroundColor: `${color}20`, color }
}

function processHtmlContent(html: string) {
  if (!html) return ''
  let content = html

  // 1. 处理环球网等特定来源的图片包裹结构
  content = content.replace(/<i\s+class="pic-con"[^>]*>\s*(<img[^>]+>)\s*<\/i>/gi, '$1')

  // 2. 修复图片 src 属性可能存在的空格
  content = content.replace(/src="\s*([^"]+?)\s*"/gi, 'src="$1"')

  // 3. 替换 img 标签，使用后端反向代理
  content = content.replace(/<img([^>]*)\ssrc="([^"]+)"([^>]*)>/gi, (match, p1, src, p2) => {
    if (src.includes('/api/proxy/image') || src.startsWith('data:') || src.startsWith('/')) {
      return match
    }
    const encodedUrl = encodeURIComponent(src)
    return `<img${p1} src="/api/proxy/image?url=${encodedUrl}"${p2} referrerpolicy="no-referrer">`
  })

  return content
}

const processedNewsContent = computed(() => {
  if (!props.news?.originalContent) return ''
  return processHtmlContent(props.news.originalContent)
})

const toggleSegmentTranslation = (id: number) => {
  if (expandedSegments.value.has(id)) {
    expandedSegments.value.delete(id)
  } else {
    expandedSegments.value.add(id)
  }
}

const handleFullTextTranslate = async (force = false) => {
  if (!props.news) return
  
  if (!force && isShowingTranslation.value) {
    // If already showing, toggle off
    isShowingTranslation.value = false
    return
  }
  
  // If we already have segments and not forcing re-translation, just show them
  if (!force && translationSegments.value.length > 0) {
    isShowingTranslation.value = true
    // Auto expand all segments
    translationSegments.value.forEach(s => {
      if (s.translation) {
        expandedSegments.value.add(s.id)
      }
    })
    return
  }

  isTranslating.value = true
  
  try {
    // Clear existing segments to trigger re-translation if forced
    if (force) {
      translationSegments.value = []
      expandedSegments.value.clear()
    }

    const data = await $fetch<{ segments: TranslationSegment[] }>('/api/ai/translate-structured', {
      method: 'POST',
      body: { newsId: props.news.id }
    })
    
    // Process HTML in segments (e.g. proxy images)
    translationSegments.value = data.segments.map(s => ({
      ...s,
      html: processHtmlContent(s.html)
    }))
    
    // Auto expand all segments
    translationSegments.value.forEach(s => {
      if (s.translation) {
        expandedSegments.value.add(s.id)
      }
    })
    
    isShowingTranslation.value = true
  } catch (e) {
    toast.error('翻译失败')
    console.error(e)
  } finally {
    isTranslating.value = false
  }
}

const handleTextSelection = () => {
  const selection = window.getSelection()
  if (!selection || selection.toString().trim().length === 0) {
    showSelectionBtn.value = false
    return
  }
  
  // Check if the selection is inside the news content
  const newsContentEl = document.querySelector('.news-content')
  if (newsContentEl && !newsContentEl.contains(selection.anchorNode)) {
    showSelectionBtn.value = false
    return
  }
  
  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  
  selectionText.value = selection.toString()
  selectionPosition.x = rect.left + (rect.width / 2)
  selectionPosition.y = rect.top - 10
  showSelectionBtn.value = true
}

const translateSelection = async () => {
  isSelectionTranslateOpen.value = true
  isTranslatingSelection.value = true
  showSelectionBtn.value = false
  
  try {
    const { translation } = await $fetch<{ translation: string }>('/api/ai/translate', {
      method: 'POST',
      body: { text: selectionText.value }
    })
    selectionTranslation.value = translation
  } catch (e) {
    toast.error('翻译失败')
    selectionTranslation.value = '翻译失败'
  } finally {
    isTranslatingSelection.value = false
  }
}

watch(() => props.open, (val) => {
  if (!val) {
    // Reset state when dialog closes
    isShowingTranslation.value = false
    translationSegments.value = []
    expandedSegments.value.clear()
    showSelectionBtn.value = false
    isSelectionTranslateOpen.value = false
    selectionTranslation.value = ''
    isTranslating.value = false
  }
})
</script>

<style scoped>
/* News Content Styles */
.news-content {
  line-height: 1.8;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
}

.news-content :deep(p) {
  margin-bottom: 1.5rem;
}

.news-content :deep(pre), .news-content :deep(code) {
  white-space: pre-wrap;
  word-break: break-all;
}

.news-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 1rem;
  margin: 1.5rem 0;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.news-content :deep(video) {
  max-width: 100%;
  border-radius: 1rem;
  margin: 1.5rem 0;
}

.news-content :deep(iframe) {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 1rem;
  margin: 1.5rem 0;
  border: none;
}

.news-content :deep(h1), .news-content :deep(h2), .news-content :deep(h3) {
  font-weight: 800;
  color: inherit;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.news-content :deep(h1) { font-size: 1.5rem; }
.news-content :deep(h2) { font-size: 1.25rem; }
.news-content :deep(h3) { font-size: 1.125rem; }

.news-content :deep(ul), .news-content :deep(ol) {
  margin-bottom: 1.5rem;
  padding-left: 1.5rem;
}

.news-content :deep(ul) { list-style-type: disc; }
.news-content :deep(ol) { list-style-type: decimal; }

.news-content :deep(li) {
  margin-bottom: 0.5rem;
}

.news-content :deep(blockquote) {
  border-left: 4px solid #6366f1;
  padding-left: 1rem;
  font-style: italic;
  margin: 1.5rem 0;
  color: #64748b;
}

:global(.dark) .news-content :deep(blockquote) {
  color: #94a3b8;
}
</style>