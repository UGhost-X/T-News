<template>
  <div
    class="max-w-[1800px] mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px] min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

    <aside
      class="hidden md:grid grid-rows-[auto_1fr_auto] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 sticky top-0 h-screen z-10 w-64">

      <div class="px-5 py-5 border-b border-slate-200 dark:border-slate-800">
        <div class="flex items-center text-xl font-bold text-slate-900 dark:text-white mb-2">
          <div
            class="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden mr-2.5 flex-shrink-0">
            <img src="/logo.png" alt="T-News Logo" class="w-full h-full object-contain p-1" />
          </div>
          T-News
        </div>
      </div>

      <div class="flex flex-col overflow-hidden min-h-0">

        <div
          class="flex flex-col border-b border-slate-100 dark:border-slate-800 transition-all duration-300 ease-sidebar overflow-hidden"
          :class="[
            isSourceSectionCollapsed
              ? 'grow-0 basis-[54px]'
              : 'grow basis-0'
          ]">
          <div
            class="h-[54px] px-5 flex items-center justify-between text-[11px] uppercase text-slate-400 dark:text-slate-500 tracking-widest font-bold shrink-0 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors select-none group"
            @click="isSourceSectionCollapsed = !isSourceSectionCollapsed">
            <span>新闻源管理</span>
            <i class="fas fa-chevron-down transition-transform duration-300"
              :class="{ '-rotate-90': isSourceSectionCollapsed }"></i>
          </div>

          <div class="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 px-5 pb-2 transition-opacity duration-300"
            :class="isSourceSectionCollapsed ? 'opacity-0' : 'opacity-100 delay-75'" style="scrollbar-gutter: stable;">
            <ul class="space-y-1 pb-2">
              <li
                class="flex items-center p-3 rounded-lg cursor-pointer transition-all border-l-4 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 group sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-sm mb-1"
                :class="{ 'bg-blue-50 dark:bg-blue-900/20 border-primary text-primary font-medium': currentSource === 'all', 'text-slate-600 dark:text-slate-400': currentSource !== 'all' }"
                @click="selectSource('all')">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-indigo-500 text-white shadow-sm">
                  <i class="fas fa-layer-group"></i>
                </div>
                <span class="text-sm flex-grow">全部新闻</span>
                <span
                  class="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full">{{
                    newsStats.globalTotal }}</span>
              </li>

              <template v-for="group in groupedRssSources" :key="group.id">
                <li
                  class="flex items-center px-3 py-2 mt-2 cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors select-none group"
                  @click="toggleCategory(group.id)">
                  <component :is="ChevronRight"
                    class="w-3.5 h-3.5 mr-1 text-slate-400 transition-transform duration-300 ease-out"
                    :class="{ 'rotate-90': expandedCategories.has(group.id) }" />
                  <component :is="group.icon" class="w-4 h-4 mr-2" />
                  <span class="text-xs font-bold uppercase tracking-wider flex-grow">{{ group.name }}</span>
                  <span
                    class="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 rounded text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">{{
                      group.sources.length }}</span>
                </li>

                <li class="block">
                  <div
                    class="grid transition-[grid-template-rows,opacity] duration-300 ease-panel"
                    :class="expandedCategories.has(group.id) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-50'">
                    <div class="overflow-hidden">
                      <ul class="pb-1">
                        <li v-for="source in group.sources" :key="source.id"
                          class="flex items-center p-2 pl-8 rounded-lg cursor-pointer transition-all border-l-4 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 group mb-0.5"
                          :class="{ 'bg-blue-50 dark:bg-blue-900/20 border-primary text-primary font-medium': currentSource === source.id, 'text-slate-600 dark:text-slate-400': currentSource !== source.id }"
                          @click="selectSource(source.id)"
                          @contextmenu.prevent.stop="handleRssContextMenu($event, source)">
                          <div
                            class="w-7 h-7 rounded-lg flex items-center justify-center mr-2.5 text-white shadow-sm shrink-0"
                            :style="{ backgroundColor: source.color }">
                            <i :class="`fas fa-${source.icon}`" class="text-xs"></i>
                          </div>
                          <span class="text-sm flex-grow truncate">{{ source.name }}</span>
                          <span
                            class="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full shrink-0">{{
                            countBySource(source.id) }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </li>
              </template>
            </ul>
          </div>
        </div>

        <div
          class="flex flex-col border-b border-slate-100 dark:border-slate-800 transition-all duration-300 ease-sidebar overflow-hidden"
          :class="[
            isAiFilterSectionCollapsed
              ? 'grow-0 basis-[54px]'
              : (isSourceSectionCollapsed ? 'grow basis-0' : 'grow-0 basis-[35%] border-t border-slate-100 dark:border-slate-800')
          ]">
          <div
            class="h-[54px] px-5 flex items-center justify-between text-[11px] uppercase text-slate-400 dark:text-slate-500 tracking-widest font-bold shrink-0 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors select-none group"
            @click="isAiFilterSectionCollapsed = !isAiFilterSectionCollapsed">
            <span>AI分类筛选</span>
            <i class="fas fa-chevron-down transition-transform duration-300"
              :class="{ '-rotate-90': isAiFilterSectionCollapsed }"></i>
          </div>
          <div class="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 px-5 pb-2 transition-opacity duration-300"
            :class="isAiFilterSectionCollapsed ? 'opacity-0' : 'opacity-100 delay-75'"
            style="scrollbar-gutter: stable;">
            <ul class="space-y-1 pb-2">
              <li
                class="flex items-center p-3 rounded-lg cursor-pointer transition-all border-l-4 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
                :class="{ 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-medium': currentAiFilter === 'ai-highlight', 'text-slate-600 dark:text-slate-400': currentAiFilter !== 'ai-highlight' }"
                @click="applyAiFilter('ai-highlight')">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-emerald-500 text-white shadow-sm">
                  <i class="fas fa-star"></i></div>
                <span class="text-sm flex-grow">AI重点推荐</span>
                <span
                  class="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full">{{
                  highlightCount }}</span>
              </li>
              <li
                class="flex items-center p-3 rounded-lg cursor-pointer transition-all border-l-4 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
                :class="{ 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-600 dark:text-amber-400 font-medium': currentAiFilter === 'ai-summary', 'text-slate-600 dark:text-slate-400': currentAiFilter !== 'ai-summary' }"
                @click="applyAiFilter('ai-summary')">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-amber-500 text-white shadow-sm">
                  <i class="fas fa-robot"></i></div>
                <span class="text-sm flex-grow">已生成摘要</span>
                <span
                  class="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full">{{
                  summaryCount }}</span>
              </li>
              <li
                class="flex items-center p-3 rounded-lg cursor-pointer transition-all border-l-4 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
                :class="{ 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-medium': currentAiFilter === 'bookmarks', 'text-slate-600 dark:text-slate-400': currentAiFilter !== 'bookmarks' }"
                @click="applyAiFilter('bookmarks')">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-indigo-500 text-white shadow-sm">
                  <i class="fas fa-bookmark"></i></div>
                <span class="text-sm flex-grow">稍后阅读</span>
                <span
                  class="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full">{{
                  bookmarkedCount || 0 }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div v-if="user"
        class="px-4 py-3 border-t border-slate-200 dark:border-slate-800 relative bg-white dark:bg-slate-900 z-20">
        <div
          class="text-[10px] uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-2 font-bold shrink-0 pl-1">
          个人中心</div>
        <div
          class="flex items-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all group"
          @click="toggleUserMenu">
          <div class="relative">
            <img v-if="user.avatarUrl" :src="user.avatarUrl"
              class="w-9 h-9 rounded-full border-2 border-white dark:border-slate-700 shadow-sm object-cover"
              alt="User Avatar" />
            <div v-else
              class="w-9 h-9 rounded-full border-2 border-white dark:border-slate-700 shadow-sm bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
              {{ (user?.displayName || user?.username || 'U').charAt(0).toUpperCase() }}
            </div>
            <div
              class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full">
            </div>
          </div>

          <div class="ml-3 flex-grow overflow-hidden">
            <div class="text-sm font-bold text-slate-900 dark:text-white truncate">{{ user.displayName || user.username
              }}
            </div>
            <div class="text-[10px] text-slate-500 dark:text-slate-400 truncate">{{ user.email }}</div>
          </div>
          <div
            class="ml-1 flex h-4 w-4 items-center justify-center rounded-full border border-slate-200 transition-colors group-hover:border-primary dark:border-slate-700">
            <i class="fas fa-chevron-up text-[9px] text-slate-400 transition-colors group-hover:text-primary"></i>
          </div>
        </div>

        <div v-if="isUserMenuOpen" class="fixed inset-0 z-40" @click="closeUserMenu"></div>
        <transition enter-active-class="transition duration-200 ease-out"
          enter-from-class="transform scale-95 opacity-0 translate-y-2"
          enter-to-class="transform scale-100 opacity-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="transform scale-100 opacity-100 translate-y-0"
          leave-to-class="transform scale-95 opacity-0 translate-y-2">
          <div v-if="isUserMenuOpen"
            class="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 overflow-hidden">
            <div class="p-3 border-b border-slate-100 dark:border-slate-800 mb-1">
              <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">个人中心</div>
              <div class="flex items-center">
                <img v-if="user.avatarUrl" :src="user.avatarUrl" class="w-8 h-8 rounded-full mr-2 object-cover" />
                <div v-else
                  class="w-8 h-8 rounded-full mr-2 bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                  {{ (user?.displayName || user?.username || 'U').charAt(0).toUpperCase() }}
                </div>
                <div class="overflow-hidden">
                  <div class="text-xs font-bold text-slate-900 dark:text-white truncate">{{ user.displayName ||
                    user.username
                    }}</div>
                  <div class="text-[10px] text-slate-500 dark:text-slate-400 truncate">{{ user.email }}</div>
                </div>
              </div>
            </div>

            <button @click="openEditProfileModal"
              class="flex items-center w-full p-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <i class="fas fa-user-edit mr-3 text-primary"></i>修改信息
            </button>
            <NuxtLink to="/settings"
              class="flex items-center w-full p-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              @click="closeUserMenu">
              <Settings class="mr-3 h-4 w-4 text-primary" />系统设置
            </NuxtLink>
            <NuxtLink to="/tasks"
              class="flex items-center w-full p-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              @click="closeUserMenu">
              <Clock class="mr-3 h-4 w-4 text-primary" />定时任务
            </NuxtLink>

            <div class="p-2 mt-1 border-t border-slate-100 dark:border-slate-800">
              <div
                class="flex items-center bg-slate-50 dark:bg-slate-800/50 p-1 rounded-full border border-slate-200 dark:border-slate-700 cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                @click="toggleTheme">
                <div class="flex items-center justify-center flex-1 py-1 rounded-full transition-all duration-300"
                  :class="!isDarkMode ? 'bg-white shadow-sm text-amber-500' : 'text-slate-500'">
                  <Sun class="h-3.5 w-3.5 mr-1.5" /> <span class="text-[9px] font-bold">浅色</span>
                </div>
                <div class="flex items-center justify-center flex-1 py-1 rounded-full transition-all duration-300"
                  :class="isDarkMode ? 'bg-slate-900 shadow-sm text-indigo-400' : 'text-slate-500'">
                  <Moon class="h-3.5 w-3.5 mr-1.5" /> <span class="text-[9px] font-bold">深色</span>
                </div>
              </div>
            </div>

            <button @click="logout"
              class="flex items-center w-full p-2.5 mt-1 rounded-lg text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
              <i class="fas fa-sign-out-alt mr-3"></i>退出登录
            </button>
          </div>
        </transition>
      </div>
    </aside>

    <main ref="mainContentRef"
      class="flex-1 p-5 md:p-8 overflow-y-auto max-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300"
      @scroll="handleScroll">
      
      <transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="transform -translate-y-4 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-4 opacity-0"
      >
        <div v-if="newNewsCount > 0" class="sticky top-0 z-30 flex justify-center mb-4 pointer-events-none">
           <button 
             @click="handleNewItemsClick" 
             class="bg-blue-600/90 backdrop-blur hover:bg-blue-700 text-white px-4 py-1.5 rounded-full shadow-lg transition-all flex items-center gap-2 text-sm font-medium animate-pulse hover:animate-none pointer-events-auto cursor-pointer"
           >
             <i class="fas fa-arrow-up"></i>
             有 {{ newNewsCount }} 条新消息
           </button>
        </div>
      </transition>

      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{{ pageTitle }}
          </h1>
          <p class="text-slate-500 dark:text-slate-400 text-sm mt-4 ml-2 flex items-center">
            <span class="flex items-center"><i class="far fa-newspaper mr-1.5"></i>{{ `共 ${newsStats.total} 条新闻`
              }}</span>
            <span class="mx-3 w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
          </p>
        </div>
        <div class="flex items-center gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
          <button
            class="flex-1 sm:flex-none flex items-center justify-center bg-gradient-to-r from-primary to-secondary text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            :disabled="isGeneratingAll" @click="generateAllSummaries()">
            <i v-if="isGeneratingAll" class="fas fa-spinner fa-spin mr-2"></i>
            <i v-else class="fas fa-robot mr-2"></i>
            {{ isGeneratingAll ? '正在处理...' : '生成AI摘要' }}
          </button>
          <button
            class="flex-1 sm:flex-none flex items-center justify-center bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            @click="refreshNews()">
            <i class="fas fa-sync-alt mr-2"></i>
            刷新
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2 mb-3 overflow-x-auto pb-2 no-scrollbar">
        <button
          class=" px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all"
          :class="currentCategory === 'all' 
            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg shadow-slate-900/20' 
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'"
          @click="selectCategory('all')">
          全部
        </button>
        <button
          v-for="cat in newsCategories" :key="cat.id"
          class="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2"
          :class="currentCategory === cat.id
            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg shadow-slate-900/20' 
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'"
          @click="selectCategory(cat.id)">
          <component :is="cat.icon" class="w-3 h-3" />
          {{ cat.name }}
        </button>
      </div>

      <div v-if="isLoading && displayedNews.length === 0"
        class="flex flex-col items-center justify-center py-20 animate-pulse">
        <div
          class="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-primary rounded-full animate-spin mb-4">
        </div>
        <p class="text-slate-500 dark:text-slate-400 font-medium">正在为您准备内容...</p>
      </div>

      <div v-else class="flex flex-col gap-6">
        <div v-if="displayedNews.length === 0"
          class="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
          <div
            class="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <i class="fas fa-newspaper text-4xl text-slate-300 dark:text-slate-600"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">未找到相关新闻</h3>
          <p class="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">尝试调整筛选条件、搜索词或添加更多RSS源来获取内容</p>
        </div>

        <article v-for="(news, index) in displayedNews" v-else :key="news.id"
          class="group bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/20 transition-all duration-300 animate-fade-in cursor-pointer"
          :style="{ animationDelay: `${index * 0.05}s` }"
          @click="openNewsDetail(news)">
          <div class="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
            <div class="flex items-center">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                :style="{ backgroundColor: sourceColor(news.sourceId) }">
                {{ news.source.substring(0, 2) }}
              </div>
              <div class="ml-3">
                <div class="font-bold text-slate-900 dark:text-white flex items-center">
                  {{ news.source }}
                  <i v-if="news.sourceId === 'bbc' || news.sourceId === 'reuters'"
                    class="fas fa-check-circle text-blue-500 text-[10px] ml-1.5"></i>
                </div>
                <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center">
                  <i class="far fa-clock mr-1"></i>
                  {{ news.time }}
                </div>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <span
                class="text-[11px] px-2.5 py-1 rounded-lg font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                {{ categoryLabel(news.category) }}
              </span>
              <span v-if="news.aiCategory"
                class="text-[11px] px-2.5 py-1 rounded-lg font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                {{ aiCategoryLabel(news.aiCategory) }}
              </span>
              <span v-if="news.aiProcessed" class="text-[11px] px-2.5 py-1 rounded-lg font-semibold"
                :style="sentimentTagStyle(news.sentiment)">
                {{ `${sentimentLabel(news.sentiment)}情绪` }}
              </span>
              <span
                class="text-[11px] px-2.5 py-1 rounded-lg font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-800/50">
                {{ `重要性: ${importanceLabel(news.importance)}` }}
              </span>
              <span v-if="news.aiHighlight"
                class="text-[11px] px-2.5 py-1 rounded-lg font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm">
                <i class="fas fa-fire mr-1"></i>AI重点
              </span>
            </div>
          </div>

          <div class="mb-5">
            <h3
              class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-primary transition-colors leading-snug cursor-pointer"
              @click="openNewsDetail(news)">
              {{ news.title }}
            </h3>
            <p class="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed line-clamp-3 relative cursor-pointer"
              @click="openNewsDetail(news)">
              {{ stripHtml(news.contentSnippet || news.originalContent) }}
            </p>

            <div v-if="news.aiProcessed"
              class="mt-5 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-l-4 border-primary relative overflow-hidden">
              <div class="absolute top-0 right-0 p-3 opacity-5 dark:opacity-10">
                <i class="fas fa-robot text-3xl text-primary"></i>
              </div>
              <div class="flex items-center text-primary font-bold text-sm mb-2.5">
                <i class="fas fa-magic mr-2"></i>
                AI智能摘要

              </div>
              <p class="text-slate-700 dark:text-slate-200 text-sm md:text-base leading-relaxed font-medium italic">
                "{{ news.aiSummary }}"
              </p>
            </div>
          </div>

          <div
            class="flex flex-col sm:flex-row justify-between items-center pt-5 border-t border-slate-100 dark:border-slate-800 gap-4">
            <div class="flex items-center gap-5">
              <button
                class="flex items-center text-slate-500 dark:text-slate-400 hover:text-primary text-sm font-medium transition-colors"
                @click.stop="toggleReadStatus(news.id)">
                <i :class="news.bookmarked ? 'fas fa-bookmark text-primary' : 'far fa-bookmark'" class="mr-1.5"></i>
                {{ news.bookmarked ? '已收藏' : '收藏' }}
              </button>

              <button
                class="flex items-center text-slate-500 dark:text-slate-400 hover:text-primary text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                @click.stop="generateSummaryForNews(news.id)" :disabled="processingNewsIds.has(news.id)">
                <i :class="processingNewsIds.has(news.id) ? 'fas fa-spinner fa-spin' : 'fas fa-robot'"
                  class="mr-1.5"></i>
                {{ processingNewsIds.has(news.id) ? 'AI处理中...' : (news.aiProcessed ? '重新摘要' : '生成摘要') }}
              </button>
              <button
                class="flex items-center text-slate-500 dark:text-slate-400 hover:text-primary text-sm font-medium transition-colors"
                @click.stop="shareNews(news.id)">
                <i class="fas fa-share-alt mr-1.5"></i>
                分享
              </button>
            </div>
            <div v-if="news.similarSources?.length"
              class="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-700">
              同主题来源: <span class="text-primary font-semibold ml-1 cursor-pointer hover:underline">{{
                news.similarSources.join(', ') }}</span>
            </div>
          </div>
        </article>
        <!-- Load More Indicator -->
        <div v-if="hasMore" class="py-8 flex justify-center">
          <div v-if="isFetchingMore" class="flex items-center text-slate-500 dark:text-slate-400">
            <i class="fas fa-spinner fa-spin mr-2"></i>
            正在加载更多新闻...
          </div>
          <div v-else class="text-slate-400 dark:text-slate-500 text-sm italic">
            继续向下滚动加载更多
          </div>
        </div>
        <div v-else-if="displayedNews.length > 0" class="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
          <div class="w-12 h-px bg-slate-200 dark:bg-slate-800 mx-auto mb-4"></div>
          已经看到最后啦
        </div>
      </div>
    </main>

    <!-- Right Sidebar -->
    <aside
      class="hidden xl:block bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 sticky top-0 h-screen overflow-y-auto z-10">
      <div class="mb-8">
        <div class="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
          <i class="fas fa-fire mr-3 text-orange-500"></i>
          AI检测热点
        </div>

        <ul class="space-y-1">
          <li v-for="(topic, index) in trendingTopics" :key="topic.id"
            class="flex items-start p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer"
            @click="openNewsDetail(topic)">
            <div class="text-2xl font-black mr-4 w-6 text-center italic"
              :class="[index === 0 ? 'text-orange-500' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-emerald-500' : 'text-slate-200 dark:text-slate-700']">
              {{ index + 1 }}
            </div>
            <div class="flex-1">
              <h4
                class="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                {{ topic.title }}</h4>
              <div class="flex items-center mt-2">
                <div class="flex items-center text-[10px] text-slate-400 dark:text-slate-500">
                  <i class="far fa-newspaper mr-1"></i>
                  <span>{{ `${topic.count} 篇报道` }}</span>
                </div>
                <span class="mx-2 text-slate-200 dark:text-slate-700">•</span>
                <span
                  class="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                  {{ categoryLabel(topic.category) }}
                </span>
              </div>
            </div>
          </li>
        </ul>
      </div>

    </aside>
  </div>

  <!-- Modal -->
  <div v-if="isModalOpen"
    class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
    @click="onModalBackdropClick">
    <div
      class="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl"
      @click.stop>
      <button
        class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        @click="closeModal()">
        <i class="fas fa-times text-2xl"></i>
      </button>

      <h2 class="text-2xl font-black text-slate-900 dark:text-white mb-2">添加新闻源</h2>
      <div
        class="p-5 rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-primary hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer transition-all group"
        @click="selectPresetSource('custom')">
        <div
          class="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
          <i class="fas fa-plus-circle text-2xl text-primary"></i>
        </div>
        <h4 class="font-bold text-slate-900 dark:text-white mb-1">自定义源</h4>
        <p class="text-xs text-slate-500 dark:text-slate-400">添加任何RSS订阅</p>
      </div>


      <div v-if="showCustomRssInput"
        class="animate-fade-in p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">RSS源链接 (URL)</label>

        <div class="flex flex-col gap-3">
          <div class="relative">
            <select v-model="customRssCategory"
              class="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all dark:text-white appearance-none cursor-pointer">
              <option v-for="cat in rssCategories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
              <i class="fas fa-chevron-down text-xs"></i>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <input v-model="customRssUrl" type="text"
              class="flex-1 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all dark:text-white"
              placeholder="https://example.com/rss.xml" />
            <button
              class="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/25 whitespace-nowrap"
              @click="addCustomRss()">
              确认添加
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Edit Profile Modal -->
  <div v-if="isEditProfileModalOpen"
    class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in"
    @click="isEditProfileModalOpen = false">
    <div class="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-8 relative shadow-2xl" @click.stop>
      <button
        class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        @click="isEditProfileModalOpen = false">
        <i class="fas fa-times text-2xl"></i>
      </button>

      <h2 class="text-2xl font-black text-slate-900 dark:text-white mb-2">修改个人信息</h2>
      <p class="text-slate-500 dark:text-slate-400 mb-8">更新您的个人资料</p>

      <div class="space-y-5">
        <div>
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">显示名称</label>
          <input v-model="editUserData.displayName" type="text"
            class="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all dark:text-white"
            placeholder="输入显示名称" />
        </div>
        <div>
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">电子邮箱</label>
          <input v-model="editUserData.email" type="email"
            class="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all dark:text-white"
            placeholder="输入电子邮箱" />
        </div>
        <div>
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">个人头像</label>
          <div
            class="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div class="relative group">
              <img v-if="editUserData.avatarUrl" :src="editUserData.avatarUrl"
                class="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-sm" />
              <div v-else
                class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border-2 border-white dark:border-slate-700 shadow-sm">
                {{ (editUserData.displayName || user?.username || 'U').charAt(0).toUpperCase() }}
              </div>
              <label
                class="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-2xl cursor-pointer transition-opacity">
                <i class="fas fa-camera text-xl"></i>
                <input type="file" class="hidden" accept="image/*" @change="handleAvatarUpload" />
              </label>
            </div>
            <div class="flex-1">
              <div class="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">更换头像</div>
              <p class="text-[10px] text-slate-500 dark:text-slate-400">支持 JPG, PNG, GIF，最大 2MB。头像将自动上传并存储。</p>
            </div>
          </div>
        </div>

        <button
          class="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/25 mt-4"
          @click="updateUserProfile">
          保存修改
        </button>
      </div>
    </div>

  </div>

  <!-- RSS Context Menu -->
  <div v-if="rssContextMenu.show"
    class="fixed z-[9999] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl min-w-[180px] p-1 overflow-hidden"
    :style="{ top: rssContextMenu.y + 'px', left: rssContextMenu.x + 'px' }">
    <div class="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">订阅源操作</div>
      <div class="text-xs font-bold text-slate-700 dark:text-slate-300 truncate mt-1">{{ rssContextMenu.source?.name }}
      </div>
    </div>

    <button @click="updateRssSourceFromMenu"
      class="flex items-center w-full p-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
      <RefreshCw class="mr-2.5 h-4 w-4 text-primary" />
      更新订阅源
    </button>

    <button @click="manageRssSourceFromMenu"
      class="flex items-center w-full p-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
      <Settings class="mr-2.5 h-4 w-4 text-primary" />
      管理订阅源
    </button>

    <div class="h-[1px] bg-slate-100 dark:bg-slate-800 my-1"></div>

    <button @click="copyRssUrlFromMenu"
      class="flex items-center w-full p-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
      <i class="far fa-copy mr-3 text-slate-400"></i>
      复制链接
    </button>
  </div>

  <!-- Backdrop to close context menu -->
  <div v-if="rssContextMenu.show" class="fixed inset-0 z-[9998] bg-black/10" @click="closeRssContextMenu"
    @contextmenu.prevent="closeRssContextMenu"></div>
  <!-- Edit RSS Dialog (Shared with Settings) -->
  <Dialog :open="isEditRssModalOpen" @update:open="isEditRssModalOpen = $event">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>编辑订阅源</DialogTitle>
        <DialogDescription>
          配置您的 RSS 订阅详细信息并验证。
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-6 py-4">
        <div class="space-y-2">
          <Label>订阅源名称</Label>
          <Input v-model="editRssForm.name" placeholder="例如：BBC News" />
        </div>
        <div class="space-y-2">
          <Label>订阅链接 (URL)</Label>
          <Input v-model="editRssForm.url" placeholder="https://example.com/rss.xml" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label>分类</Label>
            <Select v-model="editRssForm.category">
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="cat in rssCategories" :key="cat.id" :value="cat.id">
                  <div class="flex items-center gap-2">
                    <component :is="cat.icon" class="h-4 w-4" />
                    {{ cat.name }}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>标识颜色</Label>
            <div class="flex items-center gap-3">
              <Input type="color" v-model="editRssForm.color" class="w-12 h-10 p-1 rounded-md overflow-hidden" />
              <Input v-model="editRssForm.color" class="flex-1 font-mono text-xs" />
            </div>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="isEditRssModalOpen = false">取消</Button>
        <Button @click="handleSaveRssEdit" class="bg-indigo-600 hover:bg-indigo-700 text-white">
          保存更改
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Back to Top Button -->
  <transition enter-active-class="transition duration-300 ease-out" enter-from-class="translate-y-10 opacity-0"
    enter-to-class="translate-y-0 opacity-100" leave-active-class="transition duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100" leave-to-class="translate-y-10 opacity-0">
    <button v-if="showBackToTop" @click="scrollToTop"
      class="fixed bottom-8 right-8 z-[60] w-12 h-12 bg-white dark:bg-slate-800 text-primary rounded-full shadow-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-primary hover:text-white transition-all transform hover:scale-110 active:scale-95 group"
      title="返回顶部">
      <i class="fas fa-chevron-up text-lg group-hover:animate-bounce"></i>
    </button>
  </transition>

  <!-- News Detail Dialog -->
  <NewsDetail v-if="selectedNews" :news="selectedNews" v-model:open="isNewsDetailOpen" :key="selectedNews.id"
    @toggle-read="toggleReadStatus" @share="shareNews" />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

import { toast } from 'vue-sonner'
import NewsDetail from '~/components/NewsDetail.vue'
import { rssCategories } from '~/config/categories'
import { newsCategories } from '~/config/news-categories'
import { Sun, Moon, Settings, RefreshCw, ChevronRight, Clock } from 'lucide-vue-next'
import type { NewsItem, TrendingTopic } from '../types/news'
import { useAiConfig } from '../composables/useAiConfig'
import { useRssConfig } from '../composables/useRssConfig'
import { useProxyConfig } from '../composables/useProxyConfig'
import { useAuth, type User } from '../composables/useAuth'

const { user, logout } = useAuth()
const {
  aiSettings,
  summaryModel,
  translationModel,
  fetchSettings: fetchAiSettings
} = useAiConfig()

const {
  enabledRssSources,
  addRssSource,
  updateRssSource,
  fetchSources: fetchRssSources,
  validateRssUrl,
  getSourceById
} = useRssConfig()

const { proxyUrl, fetchSettings: fetchProxySettings } = useProxyConfig()


const windowHeight = ref(1000)
onMounted(() => {
  if (typeof window !== 'undefined') {
    windowHeight.value = window.innerHeight
    window.addEventListener('resize', () => {
      windowHeight.value = window.innerHeight
    })
  }
})


const rssContextMenu = reactive({
  show: false,
  x: 0,
  y: 0,
  source: null as any
})

const isSourceSectionCollapsed = ref(false)
const isAiFilterSectionCollapsed = ref(false)

const handleRssContextMenu = (e: MouseEvent, source: any) => {
  const x = e.clientX
  const y = e.clientY
  rssContextMenu.x = x
  rssContextMenu.y = y
  rssContextMenu.source = source
  rssContextMenu.show = true
}

const closeRssContextMenu = () => {
  rssContextMenu.show = false
}

const updateRssSourceFromMenu = async () => {
  if (!rssContextMenu.source) return
  const source = rssContextMenu.source
  closeRssContextMenu()

  const loadingToast = toast.loading(`正在从 ${source.name} 抓取最新新闻...`)
  try {
    const result = await $fetch<{ success: boolean, newItemsCount: number }>('/api/rss/refresh', {
      method: 'POST',
      params: { sourceId: source.id }
    })

    if (result.success) {
      toast.success(`${source.name} 更新成功，新增 ${result.newItemsCount} 条新闻`, { id: loadingToast })
      currentSource.value = source.id
      await refreshNews()
    } else {
      throw new Error('Refresh failed')
    }
  } catch (e) {
    console.error('RSS Refresh Error:', e)
    toast.error('抓取失败，请稍后重试', { id: loadingToast })
  }
}

const isEditRssModalOpen = ref(false)
const editRssForm = reactive({
  id: '',
  name: '',
  url: '',
  category: 'general',
  color: '#6366f1',
  icon: 'rss'
})

const expandedCategories = ref<Set<string>>(new Set())

watch(enabledRssSources, (sources) => {
  if (sources && sources.length > 0 && expandedCategories.value.size === 0) {
    const cats = new Set(sources.map(s => s.category || 'other'))
    expandedCategories.value = cats
  }
}, { immediate: true })

const toggleCategory = (categoryId: string) => {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId)
  } else {
    expandedCategories.value.add(categoryId)
  }
}

const groupedRssSources = computed(() => {
  if (!enabledRssSources.value) return []

  const sourceMap: Record<string, any[]> = {}
  enabledRssSources.value.forEach(source => {
    const cat = source.category || 'other'
    if (!sourceMap[cat]) sourceMap[cat] = []
    sourceMap[cat].push(source)
  })

  const result: any[] = []

  rssCategories.forEach(cat => {
    if (sourceMap[cat.id]?.length) {
      result.push({
        ...cat,
        sources: sourceMap[cat.id]
      })
    }
  })

  return result
})

const manageRssSourceFromMenu = () => {
  if (!rssContextMenu.source) return
  const source = rssContextMenu.source
  closeRssContextMenu()

  // Populate edit form
  editRssForm.id = source.id
  editRssForm.name = source.name
  editRssForm.url = source.url
  editRssForm.category = source.category || 'general'
  editRssForm.color = source.color || '#6366f1'
  editRssForm.icon = source.icon || 'rss'

  isEditRssModalOpen.value = true
}

const handleSaveRssEdit = async () => {
  if (!editRssForm.url || !editRssForm.name) {
    toast.error('请填写必要信息')
    return
  }

  const loadingToast = toast.loading('正在验证并保存...')
  try {
    const validation = await validateRssUrl(editRssForm.url)
    if (!validation.valid) {
      toast.error(`订阅源验证失败: ${validation.message}`, { id: loadingToast })
      return
    }

    await updateRssSource(editRssForm.id, { ...editRssForm })
    toast.success('订阅源已更新', { id: loadingToast })
    isEditRssModalOpen.value = false
    await fetchRssSources()
    await reloadNews()
  } catch (e) {
    toast.error('保存失败', { id: loadingToast })
  }
}

const copyRssUrlFromMenu = () => {
  if (!rssContextMenu.source) return
  const url = rssContextMenu.source.url
  closeRssContextMenu()

  navigator.clipboard.writeText(url)
  toast.success('链接已复制到剪贴板')
}

const fetchNewsData = async (sourceId?: string, pageNum: number = 1, isAiProcessed?: boolean, isAiHighlight?: boolean, isBookmarked?: boolean, publishedAfter?: string, limit?: number, category?: string) => {
  const params: any = { page: pageNum, limit: limit ?? 20 }
  if (sourceId && sourceId !== 'all') {
    params.sourceId = sourceId
  }
  if (category && category !== 'all') {
    params.aiCategory = category
  }
  if (isAiProcessed) {
    params.aiProcessed = 'true'
  }
  if (isAiHighlight) {
    params.aiHighlight = 'true'
  }
  if (isBookmarked) {
    params.bookmarked = 'true'
  }
  if (publishedAfter) {
    params.publishedAfter = publishedAfter
  }
  return await $fetch<{ items: NewsItem[], stats: any }>('/api/news', { params })
}

const fetchTrendingTopicsData = async () => {
  return await $fetch<TrendingTopic[]>('/api/news/trending')
}

const processAiSummary = async (newsId: number, summaryLength: number, modelName: string) => {
  return await $fetch<any>('/api/ai/process', {
    method: 'POST',
    body: { newsId, summaryLength, modelName }
  })
}

useHead({
  title: 'T-News',
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
const newsStats = ref({
  total: 0,
  globalTotal: 0,
  aiProcessedCount: 0,
  aiHighlightCount: 0,
  bookmarkedCount: 0,
  sourceCounts: {} as Record<string, number>
})

const currentSource = ref<string>('all')
const currentCategory = ref<string>('all')
const currentAiFilter = ref<'all' | 'ai-highlight' | 'ai-summary' | 'bookmarks'>('all')
const processingNewsIds = ref<Set<number>>(new Set())

const isUserMenuOpen = ref(false)
const isEditProfileModalOpen = ref(false)
const editUserData = ref({
  displayName: '',
  email: '',
  avatarUrl: ''
})

const updateUserProfile = async () => {
  try {
    const data = await $fetch<User>('/api/user/profile', {
      method: 'POST',
      body: editUserData.value
    })
    // Update local state
    user.value = data
    toast.success('个人信息更新成功')
    isEditProfileModalOpen.value = false
  } catch (error) {
    console.error('Failed to update user profile:', error)
    toast.error('个人信息更新失败')
  }
}

const handleAvatarUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const file = input.files[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    toast.error('文件大小不能超过 5MB')
    return
  }

  const formData = new FormData()
  formData.append('avatar', file)

  const loadingToast = toast.loading('正在上传头像...')
  try {
    const response = await $fetch<{ avatarUrl: string }>('/api/user/upload-avatar', {
      method: 'POST',
      body: formData
    })
    editUserData.value.avatarUrl = response.avatarUrl
    toast.success('头像上传成功', { id: loadingToast })
  } catch (error: any) {
    console.error('Failed to upload avatar:', error)
    toast.error(error.data?.statusMessage || '头像上传失败', { id: loadingToast })
  }
}

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

const closeUserMenu = () => {
  isUserMenuOpen.value = false
}

const openEditProfileModal = () => {
  if (!user.value) return
  editUserData.value = {
    displayName: user.value.displayName,
    email: user.value.email,
    avatarUrl: user.value.avatarUrl || ''
  }
  isEditProfileModalOpen.value = true
  closeUserMenu()
}

const isLoading = ref(false)
const isFetchingMore = ref(false)
const isGeneratingAll = ref(false)
const page = ref(1)
const hasMore = ref(true)
const displayedNews = ref<NewsItem[]>([])

const selectedNews = ref<NewsItem | null>(null)
const isNewsDetailOpen = ref(false)

const newNewsCount = ref(0)
const lastLatestDate = ref<string | undefined>(undefined)
let pollingInterval: NodeJS.Timeout | null = null


function stripHtml(html: string) {
  if (!html) return ''
  return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ')
}

function openNewsDetail(news: NewsItem) {
  selectedNews.value = news
  isNewsDetailOpen.value = true
}

const mainContentRef = ref<HTMLElement | null>(null)

async function checkNewItems() {
  if (!lastLatestDate.value) return
  
  try {
    const response = await fetchNewsData(
      currentSource.value,
      1,
      currentAiFilter.value === 'ai-summary',
      currentAiFilter.value === 'ai-highlight',
      currentAiFilter.value === 'bookmarks',
      lastLatestDate.value,
      0, // limit 0 to just get stats
      currentCategory.value
    )
    newNewsCount.value = response.stats.total
  } catch (e) {
    console.error('Polling failed', e)
  }
}

function handleNewItemsClick() {
  newNewsCount.value = 0
  reloadNews()
  scrollToTop()
}

async function loadMoreNews() {
  if (isFetchingMore.value || !hasMore.value) return

  isFetchingMore.value = true
  try {
    const nextPage = page.value + 1
    const response = await fetchNewsData(
      currentSource.value,
      nextPage,
      currentAiFilter.value === 'ai-summary',
      currentAiFilter.value === 'ai-highlight',
      currentAiFilter.value === 'bookmarks',
      undefined,
      undefined,
      currentCategory.value
    )
    const newNews = response.items

    if (newNews.length < 20) {
      hasMore.value = false
    }

    if (newNews.length > 0) {
      newsData.value = [...newsData.value, ...newNews]
      page.value = nextPage
      displayedNews.value = [...displayedNews.value, ...newNews]
      newsStats.value = response.stats
      autoGenerateSummaries(newNews)
    }
  } catch (error) {
    console.error('Failed to load more news:', error)
  } finally {
    isFetchingMore.value = false
  }
}

const showBackToTop = ref(false)

function scrollToTop() {
  const mainContent = document.querySelector('main')
  if (mainContent) {
    mainContent.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
}

function handleScroll(e: Event) {
  const target = e.target as HTMLElement
  showBackToTop.value = target.scrollTop > 400

  const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight
  if (scrollBottom < 100) {
    loadMoreNews()
  }
}

const isModalOpen = ref(false)
const showCustomRssInput = ref(false)
const rssUrlInput = ref('')
const customRssUrl = ref('')
const customRssCategory = ref('other')

const isDarkMode = ref(false)
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.classList.toggle('dark', isDarkMode.value)
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
}

const pageTitle = computed(() => {
  if (currentSource.value === 'all') return '全部新闻'
  const sourceName = getSourceById(currentSource.value)?.name ?? '未知源'
  return `${sourceName}`
})

const highlightCount = computed(() => newsStats.value.aiHighlightCount)
const summaryCount = computed(() => newsStats.value.aiProcessedCount)
const bookmarkedCount = computed(() => newsStats.value.bookmarkedCount)
const aiProcessedPercentage = computed(() => {
  if (newsStats.value.total === 0) return 0
  return Math.round((summaryCount.value / newsStats.value.total) * 100)
})

const filteredNews = computed(() => {
  let items = [...newsData.value]

  if (currentSource.value !== 'all') {
    items = items.filter((n) => n.sourceId === currentSource.value)
  }

  if (currentCategory.value !== 'all') {
    items = items.filter((n) => n.aiCategory === currentCategory.value)
  }

  if (currentAiFilter.value === 'ai-highlight') {
    items = items.filter((n) => n.aiHighlight)
  } else if (currentAiFilter.value === 'ai-summary') {
    items = items.filter((n) => n.aiProcessed)
  } else if (currentAiFilter.value === 'bookmarks') {
    items = items.filter((n) => n.bookmarked)
  }

  items = items.filter((n) => n.importance >= aiSettings.importanceThreshold)
  return items
})

async function reloadNews() {
  isLoading.value = true
  page.value = 1
  hasMore.value = true
  try {
    const response = await fetchNewsData(
      currentSource.value,
      1,
      currentAiFilter.value === 'ai-summary',
      currentAiFilter.value === 'ai-highlight',
      currentAiFilter.value === 'bookmarks',
      undefined,
      undefined,
      currentCategory.value
    )
    newsData.value = response.items
    newsStats.value = response.stats
    if (newsData.value.length > 0) {
      lastLatestDate.value = newsData.value[0]?.publishedAt
      newNewsCount.value = 0
    }
    displayedNews.value = filteredNews.value
    if (newsData.value.length < 20) {
      hasMore.value = false
    }

    autoGenerateSummaries(response.items)
  } catch (error) {
    console.error('Reload news error:', error)
  } finally {
    isLoading.value = false
  }
}

async function loadInitialData() {
  isLoading.value = true
  page.value = 1
  hasMore.value = true
  try {
    const [response, topics] = await Promise.all([
      fetchNewsData(
        currentSource.value,
        1,
        currentAiFilter.value === 'ai-summary',
        currentAiFilter.value === 'ai-highlight',
        currentAiFilter.value === 'bookmarks',
        undefined,
        undefined,
        currentCategory.value
      ),
      fetchTrendingTopicsData()
    ])
    newsData.value = response.items
    newsStats.value = response.stats
    if (newsData.value.length > 0) {
      lastLatestDate.value = newsData.value[0]?.publishedAt
      newNewsCount.value = 0
    }
    trendingTopics.value = topics
    displayedNews.value = filteredNews.value
    if (newsData.value.length < 20) {
      hasMore.value = false
    }
    autoGenerateSummaries(response.items)
  } catch (error) {
    console.error('Failed to load news:', error)
    toast.error('获取新闻数据失败，请检查网络或数据库连接')
  } finally {
    isLoading.value = false
  }
}

function selectSource(sourceId: string) {
  currentSource.value = sourceId
  reloadNews()
}

function selectCategory(categoryId: string) {
  currentCategory.value = categoryId
  reloadNews()
}

function applyAiFilter(filter: 'all' | 'ai-highlight' | 'ai-summary' | 'bookmarks') {
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

async function selectPresetSource(source: string) {
  if (source === 'custom') {
    showCustomRssInput.value = true
    return
  }

  const sourceName =
    source === 'bbc' ? 'BBC新闻' : source === 'reuters' ? '路透社' : source === 'techcrunch' ? 'TechCrunch' : '纽约时报'

  await addRssSource({ url: `http://preset-source/${source}`, name: sourceName })
  toast.success(`已添加 ${sourceName} RSS源`)
  closeModal()
}

async function addCustomRss() {
  const url = customRssUrl.value.trim()
  if (!url) {
    toast.error('请输入有效的RSS URL')
    return
  }

  await addRssSource({ url, category: customRssCategory.value })
  toast.success(`已添加自定义RSS源: ${url}`)
  customRssUrl.value = ''
  customRssCategory.value = 'other'
  closeModal()
}

async function generateAllSummaries() {
  if (isGeneratingAll.value) return

  const toProcess = displayedNews.value.filter(n => !n.aiProcessed)
  if (toProcess.length === 0) {
    toast.info('当前展示的新闻已全部生成过摘要')
    return
  }

  isGeneratingAll.value = true
  const modelName = summaryModel.value?.name || '默认模型'
  const loadingToast = toast.loading(`正在为 ${toProcess.length} 条新闻生成AI摘要...`)

  try {
    let successCount = 0
    for (const news of toProcess) {
      if (processingNewsIds.value.has(news.id)) continue

      try {
        processingNewsIds.value.add(news.id)
        const updates = await processAiSummary(news.id, aiSettings.summaryLength, modelName)
        Object.assign(news, updates)
        if (updates.aiProcessed) {
          newsStats.value.aiProcessedCount++
        }
        successCount++
      } catch (err) {
        console.error(`Failed to process news ${news.id}:`, err)
      } finally {
        processingNewsIds.value.delete(news.id)
      }
    }

    toast.success(`AI摘要处理完成！成功: ${successCount}/${toProcess.length}`, { id: loadingToast })
  } catch (error) {
    console.error('Failed to generate summaries:', error)
    toast.error('AI摘要生成过程中出现错误', { id: loadingToast })
  } finally {
    isGeneratingAll.value = false
  }
}

async function refreshNews() {
  isLoading.value = true
  const sourceName = currentSource.value === 'all' ? '全部' : (enabledRssSources.value.find(s => s.id === currentSource.value)?.name || '当前源')
  const loadingToast = toast.loading(`正在同步 ${sourceName} 的最新内容...`)

  try {
    if (currentSource.value !== 'all') {
      await $fetch('/api/rss/refresh', {
        method: 'POST',
        params: { sourceId: currentSource.value }
      })
    } else {
      const sourcesToRefresh = enabledRssSources.value.slice(0, 5)
      await Promise.allSettled(sourcesToRefresh.map(s =>
        $fetch('/api/rss/refresh', {
          method: 'POST',
          params: { sourceId: s.id }
        })
      ))
    }

    toast.success('同步成功！', { id: loadingToast })
    await reloadNews()
  } catch (error) {
    console.error('Failed to refresh news:', error)
    toast.error('同步失败，已显示本地缓存', { id: loadingToast })
    const response = await fetchNewsData(
      currentSource.value,
      1,
      currentAiFilter.value === 'ai-summary',
      currentAiFilter.value === 'ai-highlight',
      currentAiFilter.value === 'bookmarks',
      undefined,
      undefined,
      currentCategory.value
    )
    newsData.value = response.items
    newsStats.value = response.stats
    autoGenerateSummaries(response.items)
  } finally {
    isLoading.value = false
  }
}

async function toggleReadStatus(newsId: number) {
  const target = newsData.value.find((n) => n.id === newsId)
  if (!target) return
  
  const originalState = target.bookmarked
  const newState = !originalState
  
  // Optimistic update
  target.bookmarked = newState
  if (newState) {
    newsStats.value.bookmarkedCount++
  } else {
    newsStats.value.bookmarkedCount--
  }

  try {
    const method = newState ? 'POST' : 'DELETE'
    
    await $fetch('/api/news/bookmarks', {
      method,
      body: { newsId }
    })
    
    toast.success(`已${newState ? '添加' : '移除'}稍后阅读: "${target.title}"`)
  } catch (error) {
    // Revert on failure
    target.bookmarked = originalState
    if (newState) {
      newsStats.value.bookmarkedCount--
    } else {
      newsStats.value.bookmarkedCount++
    }
    toast.error(`操作失败: ${newState ? '添加' : '移除'}稍后阅读`)
    console.error('Toggle bookmark failed:', error)
  }
}

async function generateSummaryForNews(newsId: number) {
  const target = newsData.value.find((n) => n.id === newsId)
  if (!target || processingNewsIds.value.has(newsId)) return

  processingNewsIds.value.add(newsId)
  const modelName = summaryModel.value?.name || '默认模型'
  try {
    const updates = await processAiSummary(newsId, aiSettings.summaryLength, modelName)
    Object.assign(target, updates)
    if (updates.aiProcessed) {
      newsStats.value.aiProcessedCount++
    }
    toast.success(`"${target.title}"生成AI摘要成功`)
  } catch (error) {
    toast.error('AI摘要生成失败')
  } finally {
    processingNewsIds.value.delete(newsId)
  }
}

async function autoGenerateSummaries(items: NewsItem[]) {
  const toProcess = items.filter(n => !n.aiProcessed && !processingNewsIds.value.has(n.id))
  if (toProcess.length === 0) return

  const modelName = summaryModel.value?.name || '默认模型'
  for (const news of toProcess) {
    if (processingNewsIds.value.has(news.id) || news.aiProcessed) continue

    processingNewsIds.value.add(news.id)
    try {
      const updates = await processAiSummary(news.id, aiSettings.summaryLength, modelName)
      Object.assign(news, updates)
      if (updates.aiProcessed) {
        newsStats.value.aiProcessedCount++
      }
    } catch (err) {
      console.error(`Auto summary failed for news ${news.id}:`, err)
    } finally {
      processingNewsIds.value.delete(news.id)
    }
  }
}

function shareNews(newsId: number) {
  const target = newsData.value.find((n) => n.id === newsId)
  if (!target) return

  const contentPreview = stripHtml(target.aiSummary ?? target.contentSnippet ?? target.originalContent).substring(0, 100)
  const shareText = `分享新闻: ${target.title}\n${contentPreview}...`

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
  return newsStats.value.sourceCounts[sourceId] || 0
}

function categoryLabel(category: string) {
  return rssCategories.find(c => c.id === category)?.name || '其他'
}

function aiCategoryLabel(category: string) {
  return newsCategories.find(c => c.id === category)?.name || ''
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

onMounted(async () => {
  await Promise.all([
    fetchAiSettings(),
    fetchProxySettings(),
    fetchRssSources()
  ])

  loadInitialData()
  const savedTheme = localStorage.getItem('theme')
  isDarkMode.value = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDarkMode.value)

  pollingInterval = setInterval(checkNewItems, 30000)
})

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval)
})
</script>

<style>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155;
}

.news-content {
  line-height: 1.8;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
}

.news-content p {
  margin-bottom: 1.5rem;
}

.news-content pre,
.news-content code {
  white-space: pre-wrap;
  word-break: break-all;
}

.news-content img {
  max-width: 100%;
  height: auto;
  border-radius: 1rem;
  margin: 1.5rem 0;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.news-content video {
  max-width: 100%;
  border-radius: 1rem;
  margin: 1.5rem 0;
}

.news-content iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 1rem;
  margin: 1.5rem 0;
  border: none;
}

.news-content h1,
.news-content h2,
.news-content h3 {
  font-weight: 800;
  color: inherit;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.news-content h1 {
  font-size: 1.5rem;
}

.news-content h2 {
  font-size: 1.25rem;
}

.news-content h3 {
  font-size: 1.125rem;
}

.news-content ul,
.news-content ol {
  margin-bottom: 1.5rem;
  padding-left: 1.5rem;
}

.news-content ul {
  list-style-type: disc;
}

.news-content ol {
  list-style-type: decimal;
}

.news-content li {
  margin-bottom: 0.5rem;
}

.news-content blockquote {
  border-left: 4px solid #6366f1;
  padding-left: 1rem;
  font-style: italic;
  margin: 1.5rem 0;
  color: #64748b;
}

.dark .news-content blockquote {
  color: #94a3b8;
}
</style>
