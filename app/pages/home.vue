<template>
  <div class="max-w-[1800px] mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px] min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
    <!-- Left Sidebar -->
    <aside class="hidden md:block bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 py-5 sticky top-0 h-screen overflow-y-auto z-10">
      <div class="px-5 pb-5 border-b border-slate-200 dark:border-slate-800 mb-5">
        <div class="flex items-center text-xl font-bold text-primary">
          <i class="fas fa-brain mr-2.5 text-2xl bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent"></i>
          智能新闻聚合
          <span class="text-[10px] bg-gradient-to-r from-emerald-500 to-amber-500 text-white px-2 py-0.5 rounded-full ml-2 font-medium">FreeRSS + AI</span>
        </div>
        <div class="inline-flex items-center bg-blue-50 dark:bg-blue-900/30 text-primary text-[11px] px-2.5 py-1 rounded-full mt-2 border border-blue-100 dark:border-blue-800">
          <i class="fas fa-robot mr-1.5 text-[10px]"></i>
          实时AI摘要与分析
        </div>
      </div>

      <div class="px-5 mb-6">
        <div class="text-[11px] uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-4 font-bold">新闻源管理</div>
        <ul class="space-y-1">
          <li
            class="flex items-center p-3 rounded-lg cursor-pointer transition-all border-l-4 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 group"
            :class="{ 'bg-blue-50 dark:bg-blue-900/20 border-primary text-primary font-medium': currentSource === 'all', 'text-slate-600 dark:text-slate-400': currentSource !== 'all' }"
            @click="selectSource('all')"
          >
            <div class="w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-indigo-500 text-white shadow-sm">
              <i class="fas fa-layer-group"></i>
            </div>
            <span class="text-sm flex-grow">全部聚合</span>
            <span class="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full">{{ newsData.length }}</span>
          </li>

          <li
            v-for="source in enabledRssSources"
            :key="source.id"
            class="flex items-center p-3 rounded-lg cursor-pointer transition-all border-l-4 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 group"
            :class="{ 'bg-blue-50 dark:bg-blue-900/20 border-primary text-primary font-medium': currentSource === source.id, 'text-slate-600 dark:text-slate-400': currentSource !== source.id }"
            @click="selectSource(source.id)"
          >
            <div class="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-white shadow-sm" :style="{ backgroundColor: source.color }">
              <i :class="`fas fa-${source.icon}`"></i>
            </div>
            <span class="text-sm flex-grow">{{ source.name }}</span>
            <span class="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full">{{ countBySource(source.id) }}</span>
          </li>
        </ul>
        <button 
          class="w-full mt-4 p-3 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 text-sm flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-primary hover:text-primary transition-all group"
          @click="openModal()"
        >
          <i class="fas fa-plus mr-2 group-hover:scale-110 transition-transform"></i>
          添加RSS源
        </button>
      </div>

      <div class="px-5 mb-6">
        <div class="text-[11px] uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-4 font-bold">AI分类筛选</div>
        <ul class="space-y-1">
          <li
            class="flex items-center p-3 rounded-lg cursor-pointer transition-all border-l-4 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
            :class="{ 'bg-blue-50 dark:bg-blue-900/20 border-primary text-primary font-medium': currentAiFilter === 'all', 'text-slate-600 dark:text-slate-400': currentAiFilter !== 'all' }"
            @click="applyAiFilter('all')"
          >
            <div class="w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-indigo-500 text-white shadow-sm">
              <i class="fas fa-globe"></i>
            </div>
            <span class="text-sm flex-grow">全部新闻</span>
            <span class="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full">{{ newsData.length }}</span>
          </li>
          <li
            class="flex items-center p-3 rounded-lg cursor-pointer transition-all border-l-4 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
            :class="{ 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-medium': currentAiFilter === 'ai-highlight', 'text-slate-600 dark:text-slate-400': currentAiFilter !== 'ai-highlight' }"
            @click="applyAiFilter('ai-highlight')"
          >
            <div class="w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-emerald-500 text-white shadow-sm">
              <i class="fas fa-star"></i>
            </div>
            <span class="text-sm flex-grow">AI重点推荐</span>
            <span class="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full">{{ highlightCount }}</span>
          </li>
          <li
            class="flex items-center p-3 rounded-lg cursor-pointer transition-all border-l-4 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
            :class="{ 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-600 dark:text-amber-400 font-medium': currentAiFilter === 'ai-summary', 'text-slate-600 dark:text-slate-400': currentAiFilter !== 'ai-summary' }"
            @click="applyAiFilter('ai-summary')"
          >
            <div class="w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-amber-500 text-white shadow-sm">
              <i class="fas fa-robot"></i>
            </div>
            <span class="text-sm flex-grow">已生成摘要</span>
            <span class="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full">{{ summaryCount }}</span>
          </li>
        </ul>
      </div>

      <div class="px-5 mb-6">
        <div class="text-[11px] uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-4 font-bold">AI检测标签</div>
        <div class="flex flex-wrap gap-2">
          <span class="text-[10px] px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 font-medium">科技动态</span>
          <span class="text-[10px] px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800 font-medium">财经要闻</span>
          <span class="text-[10px] px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 font-medium">积极情绪</span>
          <span class="text-[10px] px-2 py-1 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800 font-medium text-nowrap">高重要性</span>
          <span class="text-[10px] px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700 font-medium">国际新闻</span>
          <span class="text-[10px] px-2 py-1 rounded bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800 font-medium">争议话题</span>
        </div>
      </div>

      <!-- Settings & Theme Toggle in Sidebar -->
      <div class="px-5 mt-auto pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <NuxtLink 
          to="/settings" 
          class="flex items-center justify-between w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary transition-all border border-slate-200 dark:border-slate-700"
        >
          <span class="text-xs font-medium">系统设置</span>
          <i class="fas fa-cog"></i>
        </NuxtLink>
        <div 
          class="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 cursor-pointer transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
          @click="toggleTheme"
        >
          <div 
            class="flex items-center justify-center flex-1 py-1.5 rounded-full transition-all duration-300"
            :class="!isDarkMode ? 'bg-white shadow-sm text-amber-500' : 'text-slate-500'"
          >
            <Sun class="h-4 w-4 mr-1.5" />
            <span class="text-[10px] font-bold">浅色</span>
          </div>
          <div 
            class="flex items-center justify-center flex-1 py-1.5 rounded-full transition-all duration-300"
            :class="isDarkMode ? 'bg-slate-900 shadow-sm text-indigo-400' : 'text-slate-500'"
          >
            <Moon class="h-4 w-4 mr-1.5" />
            <span class="text-[10px] font-bold">深色</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-5 md:p-8 overflow-y-auto max-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{{ pageTitle }}</h1>
          <p class="text-slate-500 dark:text-slate-400 text-sm mt-1.5 flex items-center">
            <span class="flex items-center"><i class="far fa-newspaper mr-1.5"></i>{{ `共 ${displayedNews.length} 条新闻` }}</span>
            <span class="mx-3 w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
            <span class="text-primary font-medium flex items-center">
              <i class="fas fa-magic mr-1.5"></i>
              {{ `AI已处理 ${summaryCount} 条 (${aiProcessedPercentage}%)` }}
            </span>
          </p>
        </div>
        <div class="flex items-center gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
          <button 
            class="flex-1 sm:flex-none flex items-center justify-center bg-gradient-to-r from-primary to-secondary text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all" 
            @click="generateAllSummaries()"
          >
            <i class="fas fa-robot mr-2"></i>
            生成AI摘要
          </button>
          <button 
            class="flex-1 sm:flex-none flex items-center justify-center bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all" 
            @click="refreshNews()"
          >
            <i class="fas fa-sync-alt mr-2"></i>
            刷新
          </button>
        </div>
      </div>

      <!-- Category Tabs -->
      <div class="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
        <button
          v-for="tab in categoryTabs"
          :key="tab.key"
          class="px-5 py-2 whitespace-nowrap rounded-full text-sm font-medium transition-all"
          :class="currentCategory === tab.key 
            ? 'bg-primary text-white shadow-md shadow-indigo-500/20' 
            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary'"
          @click="selectCategory(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 animate-pulse">
        <div class="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-primary rounded-full animate-spin mb-4"></div>
        <p class="text-slate-500 dark:text-slate-400 font-medium">AI正在为您准备内容...</p>
      </div>

      <div v-else class="flex flex-col gap-6">
        <div
          v-if="displayedNews.length === 0"
          class="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700"
        >
          <div class="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <i class="fas fa-newspaper text-4xl text-slate-300 dark:text-slate-600"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">未找到相关新闻</h3>
          <p class="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">尝试调整筛选条件、搜索词或添加更多RSS源来获取内容</p>
        </div>

        <article
          v-for="(news, index) in displayedNews"
          v-else
          :key="news.id"
          class="group bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/20 transition-all duration-300 animate-fade-in"
          :style="{ animationDelay: `${index * 0.05}s` }"
        >
          <div class="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
            <div class="flex items-center">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm" :style="{ backgroundColor: sourceColor(news.sourceId) }">
                {{ news.source.substring(0, 2) }}
              </div>
              <div class="ml-3">
                <div class="font-bold text-slate-900 dark:text-white flex items-center">
                  {{ news.source }}
                  <i v-if="news.sourceId === 'bbc' || news.sourceId === 'reuters'" class="fas fa-check-circle text-blue-500 text-[10px] ml-1.5"></i>
                </div>
                <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center">
                  <i class="far fa-clock mr-1"></i>
                  {{ news.time }}
                </div>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <span class="text-[11px] px-2.5 py-1 rounded-lg font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                {{ categoryLabel(news.category) }}
              </span>
              <span
                v-if="news.aiProcessed"
                class="text-[11px] px-2.5 py-1 rounded-lg font-semibold"
                :style="sentimentTagStyle(news.sentiment)"
              >
                {{ `${sentimentLabel(news.sentiment)}情绪` }}
              </span>
              <span class="text-[11px] px-2.5 py-1 rounded-lg font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-800/50">
                {{ `重要性: ${importanceLabel(news.importance)}` }}
              </span>
              <span
                v-if="news.aiHighlight"
                class="text-[11px] px-2.5 py-1 rounded-lg font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm"
              >
                <i class="fas fa-fire mr-1"></i>AI重点
              </span>
            </div>
          </div>
          
          <div class="mb-5">
            <h3 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-primary transition-colors leading-snug">
              {{ news.title }}
            </h3>
            <p class="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed line-clamp-3 relative">
              {{ news.originalContent }}
            </p>
            
            <div v-if="news.aiProcessed" class="mt-5 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-l-4 border-primary relative overflow-hidden">
              <div class="absolute top-0 right-0 p-3 opacity-5 dark:opacity-10">
                <i class="fas fa-robot text-4xl"></i>
              </div>
              <div class="flex items-center text-primary font-bold text-sm mb-2.5">
                <i class="fas fa-magic mr-2"></i>
                AI智能摘要
                <span class="ml-auto text-[10px] bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                  强度: {{ aiSettings.summaryLength }}
                </span>
              </div>
              <p class="text-slate-700 dark:text-slate-200 text-sm md:text-base leading-relaxed font-medium italic">
                "{{ news.aiSummary }}"
              </p>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row justify-between items-center pt-5 border-t border-slate-100 dark:border-slate-800 gap-4">
            <div class="flex items-center gap-5">
              <button 
                class="flex items-center text-slate-500 dark:text-slate-400 hover:text-primary text-sm font-medium transition-colors" 
                @click="toggleReadStatus(news.id)"
              >
                <i :class="news.bookmarked ? 'fas fa-bookmark text-primary' : 'far fa-bookmark'" class="mr-1.5"></i>
                {{ news.bookmarked ? '已收藏' : '收藏' }}
              </button>
              <button 
                class="flex items-center text-slate-500 dark:text-slate-400 hover:text-primary text-sm font-medium transition-colors" 
                @click="generateSummaryForNews(news.id)"
              >
                <i class="fas fa-robot mr-1.5"></i>
                {{ news.aiProcessed ? '重新摘要' : '生成摘要' }}
              </button>
              <button 
                class="flex items-center text-slate-500 dark:text-slate-400 hover:text-primary text-sm font-medium transition-colors" 
                @click="shareNews(news.id)"
              >
                <i class="fas fa-share-alt mr-1.5"></i>
                分享
              </button>
            </div>
            <div v-if="news.similarSources?.length" class="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-700">
              同主题来源: <span class="text-primary font-semibold ml-1 cursor-pointer hover:underline">{{ news.similarSources.join(', ') }}</span>
            </div>
          </div>
        </article>
      </div>
    </main>

    <!-- Right Sidebar -->
    <aside class="hidden xl:block bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 sticky top-0 h-screen overflow-y-auto z-10">
      <div class="mb-8">
        <div class="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
          <i class="fas fa-fire mr-3 text-orange-500"></i>
          AI检测热点
        </div>

        <ul class="space-y-1">
          <li v-for="(topic, index) in trendingTopics" :key="topic.id" class="flex items-start p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
            <div class="text-2xl font-black mr-4 w-6 text-center italic" :class="[index === 0 ? 'text-orange-500' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-emerald-500' : 'text-slate-200 dark:text-slate-700']">
              {{ index + 1 }}
            </div>
            <div class="flex-1">
              <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors line-clamp-2 leading-snug">{{ topic.title }}</h4>
              <div class="flex items-center mt-2">
                <div class="flex items-center text-[10px] text-slate-400 dark:text-slate-500">
                  <i class="far fa-newspaper mr-1"></i>
                  <span>{{ `${topic.count} 篇报道` }}</span>
                </div>
                <span class="mx-2 text-slate-200 dark:text-slate-700">•</span>
                <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                  {{ categoryLabel(topic.category) }}
                </span>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div class="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
        <div class="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
          <i class="fas fa-rss mr-3 text-amber-500"></i>
          快捷添加
        </div>

        <div class="flex mb-3">
          <input 
            v-model="rssUrlInput" 
            type="text" 
            class="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-l-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white" 
            placeholder="输入RSS源URL" 
          />
          <button 
            class="bg-primary text-white px-4 rounded-r-xl hover:bg-indigo-600 transition-colors" 
            @click="addRssByUrl()"
          >
            <i class="fas fa-plus"></i>
          </button>
        </div>

        <p class="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed italic">
          AI将自动分析RSS/Atom内容并为您智能分类和标记
        </p>
      </div>
    </aside>
  </div>

  <!-- Modal -->
  <div v-if="isModalOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in" @click="onModalBackdropClick">
    <div class="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl" @click.stop>
      <button class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" @click="closeModal()">
        <i class="fas fa-times text-2xl"></i>
      </button>
      
      <h2 class="text-2xl font-black text-slate-900 dark:text-white mb-2">添加新闻源</h2>
      <p class="text-slate-500 dark:text-slate-400 mb-8">选择我们为您精选的预设源，或输入任何您喜欢的RSS地址</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div class="p-5 rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-primary hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer transition-all group" @click="selectPresetSource('bbc')">
          <div class="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
            <i class="fas fa-globe-europe text-2xl text-blue-600"></i>
          </div>
          <h4 class="font-bold text-slate-900 dark:text-white mb-1">BBC新闻</h4>
          <p class="text-xs text-slate-500 dark:text-slate-400">国际权威资讯</p>
        </div>

        <div class="p-5 rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-primary hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer transition-all group" @click="selectPresetSource('reuters')">
          <div class="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
            <i class="fas fa-newspaper text-2xl text-orange-500"></i>
          </div>
          <h4 class="font-bold text-slate-900 dark:text-white mb-1">路透社</h4>
          <p class="text-xs text-slate-500 dark:text-slate-400">全球财经与政治</p>
        </div>

        <div class="p-5 rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-primary hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer transition-all group" @click="selectPresetSource('techcrunch')">
          <div class="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
            <i class="fas fa-microchip text-2xl text-emerald-500"></i>
          </div>
          <h4 class="font-bold text-slate-900 dark:text-white mb-1">TechCrunch</h4>
          <p class="text-xs text-slate-500 dark:text-slate-400">最新科技创投</p>
        </div>

        <div class="p-5 rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-primary hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer transition-all group" @click="selectPresetSource('nytimes')">
          <div class="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
            <i class="fas fa-landmark text-2xl text-slate-700 dark:text-slate-300"></i>
          </div>
          <h4 class="font-bold text-slate-900 dark:text-white mb-1">纽约时报</h4>
          <p class="text-xs text-slate-500 dark:text-slate-400">深度调查与评论</p>
        </div>

        <div class="p-5 rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-primary hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer transition-all group" @click="selectPresetSource('custom')">
          <div class="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
            <i class="fas fa-plus-circle text-2xl text-primary"></i>
          </div>
          <h4 class="font-bold text-slate-900 dark:text-white mb-1">自定义源</h4>
          <p class="text-xs text-slate-500 dark:text-slate-400">添加任何RSS订阅</p>
        </div>
      </div>

      <div v-if="showCustomRssInput" class="animate-fade-in p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">RSS源链接 (URL)</label>
        <div class="flex flex-col sm:flex-row gap-3">
          <input
            v-model="customRssUrl"
            type="text"
            class="flex-1 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all dark:text-white"
            placeholder="https://example.com/rss.xml"
          />
          <button class="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/25" @click="addCustomRss()">
            确认添加
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Sun, Moon } from 'lucide-vue-next'
import type { NewsItem, TrendingTopic } from '../types/news'
import { useAiConfig } from '../composables/useAiConfig'
import { useRssConfig } from '../composables/useRssConfig'
import { fetchNews, fetchTrendingTopics, mockAiProcess } from '../services/mockNews'

const {
  aiSettings,
  activeModel
} = useAiConfig()

const {
  enabledRssSources,
  addRssSource,
  getSourceById
} = useRssConfig()

useHead({
  title: '智能新闻聚合',
  link: [
    {
      rel: 'stylesheet',
      href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
    }
  ],
  bodyAttrs: {
    class: 'demo-page'
  }
})

const newsData = ref<NewsItem[]>([])
const trendingTopics = ref<TrendingTopic[]>([])

const currentSource = ref<string>('all')
const currentCategory = ref<string>('all')
const currentAiFilter = ref<'all' | 'ai-highlight' | 'ai-summary'>('all')

const isLoading = ref(false)
const displayedNews = ref<NewsItem[]>([])

const isModalOpen = ref(false)
const showCustomRssInput = ref(false)
const rssUrlInput = ref('')
const customRssUrl = ref('')

// Theme Control
const isDarkMode = ref(false)
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

const categoryTabs = [
  { key: 'all', label: '全部' },
  { key: 'tech', label: '科技' },
  { key: 'finance', label: '财经' },
  { key: 'politics', label: '时政' },
  { key: 'sports', label: '体育' },
  { key: 'entertainment', label: '娱乐' }
]

const pageTitle = computed(() => {
  if (currentSource.value === 'all') return '全部新闻聚合'
  const sourceName = getSourceById(currentSource.value)?.name ?? '未知源'
  return `${sourceName} - 新闻聚合`
})

const highlightCount = computed(() => newsData.value.filter((n) => n.aiHighlight).length)
const summaryCount = computed(() => newsData.value.filter((n) => n.aiProcessed).length)
const aiProcessedPercentage = computed(() => {
  if (newsData.value.length === 0) return 0
  return Math.round((summaryCount.value / newsData.value.length) * 100)
})

const filteredNews = computed(() => {
  let items = [...newsData.value]

  if (currentSource.value !== 'all') {
    items = items.filter((n) => n.sourceId === currentSource.value)
  }

  if (currentAiFilter.value === 'ai-highlight') {
    items = items.filter((n) => n.aiHighlight)
  } else if (currentAiFilter.value === 'ai-summary') {
    items = items.filter((n) => n.aiProcessed)
  }

  if (currentCategory.value !== 'all') {
    items = items.filter((n) => n.category === currentCategory.value)
  }

  items = items.filter((n) => n.importance >= aiSettings.importanceThreshold)
  return items
})

async function reloadNews() {
  isLoading.value = true
  displayedNews.value = []
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 300))
  displayedNews.value = filteredNews.value
  isLoading.value = false
}

async function loadInitialData() {
  isLoading.value = true
  try {
    const [news, topics] = await Promise.all([
      fetchNews(proxyUrl.value),
      fetchTrendingTopics()
    ])
    newsData.value = news
    trendingTopics.value = topics
    displayedNews.value = filteredNews.value
  } catch (error) {
    console.error('Failed to load news:', error)
  } finally {
    isLoading.value = false
  }
}

function selectSource(sourceId: string) {
  currentSource.value = sourceId
  reloadNews()
}

function selectCategory(category: string) {
  currentCategory.value = category
  reloadNews()
}

function applyAiFilter(filter: 'all' | 'ai-highlight' | 'ai-summary') {
  currentAiFilter.value = filter
  reloadNews()
}

function openModal() {
  isModalOpen.value = true
  showCustomRssInput.value = false
}

function closeModal() {
  isModalOpen.value = false
  showCustomRssInput.value = false
}

function onModalBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) closeModal()
}

function selectPresetSource(source: string) {
  if (source === 'custom') {
    showCustomRssInput.value = true
    return
  }

  const sourceName =
    source === 'bbc' ? 'BBC新闻' : source === 'reuters' ? '路透社' : source === 'techcrunch' ? 'TechCrunch' : '纽约时报'
  
  addRssSource(`http://preset-source/${source}`, sourceName)
  toast.success(`已添加 ${sourceName} RSS源`)
  closeModal()
}

function addCustomRss() {
  const url = customRssUrl.value.trim()
  if (!url) {
    toast.error('请输入有效的RSS URL')
    return
  }

  addRssSource(url)
  toast.success(`已添加自定义RSS源: ${url}`)
  customRssUrl.value = ''
  closeModal()
}

function addRssByUrl() {
  const url = rssUrlInput.value.trim()
  if (!url) {
    toast.error('请输入有效的RSS URL')
    return
  }

  addRssSource(url)
  toast.success(`已添加RSS源: ${url}\nAI将开始分析该源的内容。`)
  rssUrlInput.value = ''
}

async function generateAllSummaries() {
  isLoading.value = true
  
  const modelName = activeModel.value?.name || '默认模型'
  const processPromises = newsData.value.map(async (n) => {
    if (n.aiProcessed) return n
    const updates = await mockAiProcess(n.id, aiSettings.summaryLength, modelName)
    return { ...n, ...updates }
  })

  newsData.value = await Promise.all(processPromises)
  await reloadNews()
  toast.success(`AI摘要生成完成！使用模型: ${modelName}`)
}

const { proxyUrl } = useProxyConfig()

async function refreshNews() {
  isLoading.value = true
  newsData.value = await fetchNews(proxyUrl.value)
  toast.info('新闻已刷新！从RSS源获取了最新内容。')
  await reloadNews()
}

function toggleReadStatus(newsId: number) {
  const target = newsData.value.find((n) => n.id === newsId)
  if (!target) return
  const bookmarked = !target.bookmarked
  target.bookmarked = bookmarked
  toast.success(`已${bookmarked ? '添加' : '移除'}稍后阅读: "${target.title}"`)
}

async function generateSummaryForNews(newsId: number) {
  const target = newsData.value.find((n) => n.id === newsId)
  if (!target) return

  isLoading.value = true
  const modelName = activeModel.value?.name || '默认模型'
  const updates = await mockAiProcess(newsId, aiSettings.summaryLength, modelName)
  
  Object.assign(target, updates)

  await reloadNews()
  toast.success(`已使用 ${modelName} 为"${target.title}"生成AI摘要`)
}

function shareNews(newsId: number) {
  const target = newsData.value.find((n) => n.id === newsId)
  if (!target) return

  const shareText = `分享新闻: ${target.title}\n${target.aiSummary ?? target.originalContent.substring(0, 100)}...`

  if (typeof navigator !== 'undefined' && navigator.share) {
    navigator.share({
      title: target.title,
      text: target.aiSummary ?? target.originalContent.substring(0, 100),
      url: window.location.href
    }).catch(() => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
          toast.success('已复制分享内容到剪贴板')
        })
      }
    })
  } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(shareText).then(() => {
      toast.success('已复制分享内容到剪贴板')
    })
  } else {
    toast.error('您的浏览器不支持分享或复制功能')
  }
}

function sourceColor(sourceId: string) {
  return getSourceById(sourceId)?.color ?? '#6366f1'
}

function countBySource(sourceId: string) {
  return newsData.value.filter((n) => n.sourceId === sourceId).length
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

function importanceLabel(importance: number) {
  if (importance >= 8) return '高'
  if (importance <= 5) return '低'
  return '中'
}

onMounted(() => {
  loadInitialData()
  
  // Initialize theme from localStorage
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDarkMode.value = true
    document.documentElement.classList.add('dark')
  } else {
    isDarkMode.value = false
    document.documentElement.classList.remove('dark')
  }
})
</script>

<style>
/* Custom Hide Scrollbar */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
