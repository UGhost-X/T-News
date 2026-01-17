<template>
  <div class="min-h-screen bg-background text-foreground transition-colors duration-300">
    <div class="max-w-4xl mx-auto p-6 md:p-10">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <NuxtLink to="/" class="text-primary hover:underline flex items-center mb-2 transition-all group font-medium">
            <ArrowLeft class="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            返回首页
          </NuxtLink>
          <h1 class="text-3xl font-extrabold tracking-tight">系统配置</h1>
          <p class="text-muted-foreground text-sm mt-1">管理您的 AI 模型和全局网络设置</p>
        </div>
        <div class="flex items-center gap-3">
          <div 
            class="flex items-center bg-muted/50 p-1 rounded-full border border-muted-foreground/10 cursor-pointer transition-all hover:bg-muted"
            @click="toggleTheme"
          >
            <div 
              class="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300"
              :class="!isDarkMode ? 'bg-background shadow-sm text-amber-500 scale-110' : 'text-muted-foreground'"
            >
              <Sun class="h-5 w-5" />
            </div>
            <div 
              class="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300"
              :class="isDarkMode ? 'bg-background shadow-sm text-indigo-400 scale-110' : 'text-muted-foreground'"
            >
              <Moon class="h-5 w-5" />
            </div>
          </div>
          <div class="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
            <Settings class="h-6 w-6 text-primary animate-spin-slow" />
          </div>
        </div>
      </div>

      <Tabs v-model="activeTab" class="w-full">
       <TabsList class="grid w-full grid-cols-3 mb-10 h-auto p-1.5 bg-muted/20 rounded-2xl border border-muted/20">
          <TabsTrigger 
            v-for="tab in tabs" 
            :key="tab.id" 
            :value="tab.id" 
            class="h-auto px-6 py-4 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary transition-all duration-300"
          >
            <div class="flex flex-row items-center justify-center gap-3 w-full">
              <div class="shrink-0 w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center group-data-[state=active]:bg-primary/10">
                <component :is="tab.icon" class="h-5 w-5" />
              </div>
              <span class="font-bold tracking-wide text-base whitespace-nowrap">
                {{ tab.name }}
              </span>
              
            </div>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="ai" class="space-y-6 animate-in fade-in duration-500">
          <!-- Functional Model Configuration -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Workflow class="h-5 w-5 text-primary" />
                功能模型配置
              </CardTitle>
              <CardDescription>为不同的功能指定特定的 AI 模型</CardDescription>
            </CardHeader>
            <CardContent class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Summary Model -->
                <div class="space-y-3">
                  <Label class="flex items-center gap-2">
                    <FileText class="h-4 w-4 text-muted-foreground" />
                    摘要生成模型
                  </Label>
                  <Select v-model="aiSettings.summaryModelId">
                    <SelectTrigger>
                      <SelectValue placeholder="选择模型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem 
                        v-for="model in aiSettings.models" 
                        :key="model.id" 
                        :value="model.id"
                      >
                        {{ model.name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p class="text-xs text-muted-foreground">用于生成新闻摘要、提取关键词和情感分析</p>
                </div>

                <!-- Translation Model -->
                <div class="space-y-3">
                  <Label class="flex items-center gap-2">
                    <Languages class="h-4 w-4 text-muted-foreground" />
                    翻译模型
                  </Label>
                  <Select v-model="aiSettings.translationModelId">
                    <SelectTrigger>
                      <SelectValue placeholder="选择模型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem 
                        v-for="model in aiSettings.models" 
                        :key="model.id" 
                        :value="model.id"
                      >
                        {{ model.name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p class="text-xs text-muted-foreground">用于全文翻译和段落对照翻译</p>
                </div>

                <!-- Comment Model -->
                <div class="space-y-3">
                  <Label class="flex items-center gap-2">
                    <MessageSquare class="h-4 w-4 text-muted-foreground" />
                    评论模型
                  </Label>
                  <Select v-model="aiSettings.commentModelId">
                    <SelectTrigger>
                      <SelectValue placeholder="选择模型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem 
                        v-for="model in aiSettings.models" 
                        :key="model.id" 
                        :value="model.id"
                      >
                        {{ model.name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p class="text-xs text-muted-foreground">用于生成新闻评论和观点分析</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Model Management -->
          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle class="flex items-center gap-2">
                  <ListOrdered class="h-5 w-5 text-primary" />
                  模型管理
                </CardTitle>
                <CardDescription>添加、编辑或删除您的 AI 模型配置</CardDescription>
              </div>
              <Button @click="openAddModelModal" size="sm">
                <Plus class="mr-2 h-4 w-4" />
                添加模型
              </Button>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <div 
                  v-for="model in aiSettings.models" 
                  :key="model.id"
                  class="flex items-center justify-between p-4 bg-muted/50 rounded-xl border"
                >
                  <div class="flex items-center overflow-hidden">
                    <div class="w-10 h-10 rounded-xl bg-background flex items-center justify-center mr-4 shadow-sm border shrink-0">
                      <component :is="getProviderLucideIcon(model.provider)" class="h-5 w-5 text-primary" />
                    </div>
                    <div class="overflow-hidden">
                      <div class="font-bold truncate">{{ model.name }}</div>
                      <div class="text-xs text-muted-foreground truncate">
                        {{ model.baseUrl || '官方 API' }} | {{ model.modelName }}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-1 shrink-0 ml-2">
                    <Button variant="ghost" size="icon" @click="editModel(model)" class="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Pencil class="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      @click="removeModel(model.id)" 
                      v-if="aiSettings.models.length > 1"
                      class="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- AI Preferences -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Sparkles class="h-5 w-5 text-primary" />
                AI 摘要偏好
              </CardTitle>
              <CardDescription>自定义 AI 生成摘要时的行为和过滤标准</CardDescription>
            </CardHeader>
            <CardContent class="space-y-8">
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <div class="space-y-0.5">
                    <Label class="text-base flex items-center gap-2">
                      <Zap class="h-4 w-4 text-amber-500" />
                      摘要长度
                    </Label>
                    <p class="text-sm text-muted-foreground">控制生成摘要的详细程度</p>
                  </div>
                  <span class="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                    {{ summaryLengthText }} ({{ aiSettings.summaryLength }})
                  </span>
                </div>
                <Slider 
                  :model-value="[aiSettings.summaryLength]" 
                  @update:model-value="(val) => { if (val && typeof val[0] === 'number') aiSettings.summaryLength = val[0] }"
                  :min="1"
                  :max="10" 
                  :step="1" 
                />
              </div>

              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <div class="space-y-0.5">
                    <Label class="text-base flex items-center gap-2">
                      <Brain class="h-4 w-4 text-purple-500" />
                      情感分析敏感度
                    </Label>
                    <p class="text-sm text-muted-foreground">影响对新闻情感倾向的判断强度</p>
                  </div>
                  <span class="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                    {{ sentimentSensitivityText }} ({{ aiSettings.sentimentSensitivity }})
                  </span>
                </div>
                <Slider 
                  :model-value="[aiSettings.sentimentSensitivity]" 
                  @update:model-value="(val) => { if (val && typeof val[0] === 'number') aiSettings.sentimentSensitivity = val[0] }"
                  :min="1"
                  :max="10" 
                  :step="1" 
                />
              </div>

              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <div class="space-y-0.5">
                    <Label class="text-base flex items-center gap-2">
                      <ShieldCheck class="h-4 w-4 text-emerald-500" />
                      新闻重要性阈值
                    </Label>
                    <p class="text-sm text-muted-foreground">低于此分值的新闻将不会被显示</p>
                  </div>
                  <span class="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                    {{ importanceThresholdText }} ({{ aiSettings.importanceThreshold }})
                  </span>
                </div>
                <Slider 
                  :model-value="[aiSettings.importanceThreshold]" 
                  @update:model-value="(val) => { if (val && typeof val[0] === 'number') aiSettings.importanceThreshold = val[0] }"
                  :min="1"
                  :max="10" 
                  :step="1" 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rss" class="space-y-6 animate-in fade-in duration-500">
          <div class="flex items-center justify-between mb-2">
            <div>
              <h2 class="text-2xl font-black tracking-tight flex items-center gap-3">
                <Rss class="h-7 w-7 text-indigo-500" />
                RSS 订阅管理
              </h2>
            </div>
            <Button @click="openAddRssModal" class="rounded-xl px-6 font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">
              <Plus class="h-5 w-5 mr-2" />
              添加新源
            </Button>
          </div>

          <div v-if="Object.keys(groupedRssSources).length === 0" class="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
            <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Rss class="h-8 w-8 text-muted-foreground" />
            </div>
            <p class="text-muted-foreground font-medium">暂无订阅源，快去添加一个吧</p>
          </div>

          <div v-for="(sources, categoryId) in groupedRssSources" :key="categoryId" class="space-y-4">
            <div class="flex items-center gap-2 px-1">
              <component :is="getCategoryIcon(String(categoryId))" class="h-4 w-4 text-slate-400" />
              <h3 class="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">
                {{ getCategoryName(String(categoryId)) }} ({{ (sources as any[]).length }})
              </h3>
              <div class="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800 ml-2"></div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                v-for="source in (sources as any[])" 
                :key="source.id"
                class="group relative flex items-center p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md bg-card"
                :class="source.enabled 
                  ? 'border-slate-100 dark:border-slate-800' 
                  : 'border-slate-50 dark:border-slate-900/50 opacity-60 grayscale-[0.5]'"
              >
                <div 
                  class="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0"
                  :style="{ backgroundColor: source.color }"
                >
                  <component :is="source.icon === 'globe-europe' ? Globe : source.icon === 'newspaper' ? ListOrdered : source.icon === 'microchip' ? Cpu : Rss" class="h-5 w-5" />
                </div>
                
                <div class="ml-4 flex-1 overflow-hidden">
                  <div class="flex items-center gap-2">
                    <h4 class="font-bold text-slate-900 dark:text-white truncate">{{ source.name }}</h4>
                    <span v-if="!source.enabled" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      已禁用
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ source.url }}</p>
                </div>

                <div class="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    @click="toggleRssSource(source.id)"
                    class="h-8 w-8 rounded-full"
                    :title="source.enabled ? '禁用' : '启用'"
                  >
                    <component :is="source.enabled ? Eye : EyeOff" class="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    @click="editRssSource(source)"
                    class="h-8 w-8 rounded-full"
                  >
                    <Pencil class="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    @click="handleRemoveRss(source.id)"
                    class="h-8 w-8 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="proxy" class="animate-in fade-in duration-500">
          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-6">
              <div>
                <CardTitle class="flex items-center gap-2">
                  <Network class="h-5 w-5 text-primary" />
                  全局网络代理
                </CardTitle>
                <CardDescription>配置通过代理服务器进行的网络请求</CardDescription>
              </div>
              <div class="flex items-center space-x-2">
                <Label for="proxy-enabled" class="text-sm font-medium">{{ proxySettings.enabled ? '已开启' : '已关闭' }}</Label>
                <Switch id="proxy-enabled" v-model="proxySettings.enabled" />
              </div>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6" :class="{ 'opacity-50': !proxySettings.enabled }">
                <div class="space-y-2">
                  <Label>代理协议</Label>
                  <Select v-model="proxySettings.protocol" :disabled="!proxySettings.enabled">
                    <SelectTrigger>
                      <SelectValue placeholder="选择协议" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="http">HTTP</SelectItem>
                      <SelectItem value="https">HTTPS</SelectItem>
                      <SelectItem value="socks5">SOCKS5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="space-y-2">
                  <Label>主机地址</Label>
                  <Input v-model="proxySettings.host" placeholder="127.0.0.1" :disabled="!proxySettings.enabled" />
                </div>
                <div class="space-y-2">
                  <Label>端口</Label>
                  <Input v-model.number="proxySettings.port" type="number" placeholder="7890" :disabled="!proxySettings.enabled" />
                </div>
                <div class="space-y-2">
                  <Label>用户名 (可选)</Label>
                  <Input 
                    v-model="proxySettings.username" 
                    placeholder="用户名" 
                    :disabled="!proxySettings.enabled" 
                    autocomplete="off"
                  />
                </div>
                <div class="space-y-2">
                  <Label>密码 (可选)</Label>
                  <Input 
                    v-model="proxySettings.password" 
                    type="password" 
                    placeholder="密码" 
                    :disabled="!proxySettings.enabled" 
                    autocomplete="new-password"
                  />
                </div>
              </div>

              <div class="mt-8 p-4 bg-primary/5 border rounded-xl flex items-start gap-3">
                <Info class="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p class="text-sm text-muted-foreground leading-relaxed">
                  开启全局代理后，所有的 AI 模型调用以及 RSS 新闻抓取请求都将通过该代理服务器转发。请确保代理服务器可用。
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>

    <!-- Add/Edit Model Dialog -->
    <Dialog :open="isModelModalOpen" @update:open="isModelModalOpen = $event">
      <DialogContent class="sm:max-w-[550px] max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>{{ editingModel ? '编辑模型' : '添加 AI 模型' }}</DialogTitle>
          <DialogDescription>
            配置您的 AI 提供商信息，支持 OpenAI、DeepSeek、Ollama 等。
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-6 py-4">
          <div class="space-y-3">
            <Label>提供商</Label>
            <div class="grid grid-cols-3 gap-3">
              <div 
                v-for="provider in providers" 
                :key="provider.id"
                @click="modelForm.provider = provider.id"
                class="flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all"
                :class="modelForm.provider === provider.id 
                  ? 'border-primary bg-primary/5 text-primary' 
                  : 'border-muted text-muted-foreground hover:border-accent'"
              >
                <component :is="provider.icon" class="h-6 w-6 mb-1" />
                <span class="text-xs font-bold">{{ provider.name }}</span>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <Label>显示名称</Label>
            <Input v-model="modelForm.name" placeholder="例如: 我的 DeepSeek" />
          </div>

          <div class="space-y-2">
            <Label>API 基础地址</Label>
            <Input v-model="modelForm.baseUrl" :placeholder="baseUrlPlaceholder" autocomplete="off"/>
          </div>
          <div v-if="modelForm.provider !== 'ollama'" class="space-y-2">
            <Label>API 密钥</Label>
            <Input v-model="modelForm.apiKey" type="password" placeholder="sk-xxxxxxxxx" autocomplete="off"/>
          </div>
          <div class="space-y-2">
            <Label>模型名称</Label>
            <div class="flex items-center gap-2">
              <div class="relative flex-1">
                <template v-if="fetchedModels.length > 0">
                  <Select v-model="modelForm.modelName">
                    <SelectTrigger class="w-full">
                      <SelectValue placeholder="请选择模型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="m in fetchedModels" :key="m" :value="m">
                        {{ m }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    @click="fetchedModels = []"
                    class="absolute -right-2 -top-2 h-6 w-6 rounded-full shadow-sm z-10 bg-background"
                  >
                    <Keyboard class="h-3 w-3" />
                  </Button>
                </template>
                <Input v-else v-model="modelForm.modelName" />
              </div>
              
              <Button 
                variant="secondary"
                @click="fetchModels"
                :disabled="isFetchingModels"
                class="shrink-0"
              >
                <Loader2 v-if="isFetchingModels" class="mr-2 h-4 w-4 animate-spin" />
                <RefreshCw v-else class="mr-2 h-4 w-4" />
                获取列表
              </Button>
            </div>
          </div>



          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <Label>温度 (Temperature)</Label>
              <span class="text-xs font-bold text-primary">{{ modelForm.temperature }}</span>
            </div>
            <Slider 
              :model-value="[modelForm.temperature]" 
              @update:model-value="(val) => { if (val && typeof val[0] === 'number') modelForm.temperature = val[0] }"
              :max="2" 
              :step="0.1" 
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="closeModelModal">取消</Button>
          <Button @click="validateAndSave" :disabled="isValidating">
            <Loader2 v-if="isValidating" class="mr-2 h-4 w-4 animate-spin" />
            {{ isValidating ? '验证中...' : '验证并保存' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- RSS Management Dialog -->
    <Dialog :open="isRssModalOpen" @update:open="isRssModalOpen = $event">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{{ editingRssId ? '配置订阅源' : '添加订阅源' }}</DialogTitle>
          <DialogDescription>
            模仿 FreshRSS 风格，配置您的 RSS 订阅详细信息。
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-6 py-4">
          <div class="space-y-2">
            <Label>订阅源名称</Label>
            <Input v-model="rssForm.name" placeholder="例如：BBC News" />
          </div>
          <div class="space-y-2">
            <Label>订阅链接 (URL)</Label>
            <Input v-model="rssForm.url" placeholder="https://example.com/rss.xml" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>分类</Label>
              <Select v-model="rssForm.category">
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
                <Input type="color" v-model="rssForm.color" class="w-12 h-10 p-1 rounded-md overflow-hidden" />
                <Input v-model="rssForm.color" class="flex-1 font-mono text-xs" />
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-dashed">
            <div class="space-y-0.5">
              <Label class="text-base">启用此源</Label>
              <p class="text-xs text-muted-foreground">禁用后将不再抓取此源的新闻</p>
            </div>
            <Switch :model-value="rssForm.enabled" @update:model-value="rssForm.enabled = $event" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isRssModalOpen = false">取消</Button>
          <Button @click="handleSaveRss" class="bg-indigo-600 hover:bg-indigo-700 text-white">
            {{ editingRssId ? '更新配置' : '立即订阅' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <!-- RSS 删除确认对话框 -->
    <Dialog :open="isDeleteRssConfirmOpen" @update:open="isDeleteRssConfirmOpen = $event">
      <DialogContent class="sm:max-w-[400px] rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
        <div class="bg-red-50 dark:bg-red-900/20 p-6 flex flex-col items-center justify-center text-center">
          <div class="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-4">
            <Trash2 class="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <DialogHeader class="mb-2">
            <DialogTitle class="text-xl font-black text-red-600 dark:text-red-400">确认删除？</DialogTitle>
            <DialogDescription class="text-center text-slate-600 dark:text-slate-300">
              此操作无法撤销，确定要删除该 RSS 订阅源吗？
            </DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter class="p-4 bg-white dark:bg-slate-950 flex gap-3 justify-center border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" @click="isDeleteRssConfirmOpen = false" class="flex-1 rounded-xl font-bold">取消</Button>
          <Button @click="confirmRemoveRss" class="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-600/20">
            确认删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

import { toast } from 'vue-sonner'
import { useAiConfig } from '~/composables/useAiConfig'
import { useProxyConfig } from '~/composables/useProxyConfig'
import { useRssConfig } from '~/composables/useRssConfig'
import type { AiProvider, AiModelConfig } from '~/types/news'
import { rssCategories } from '~/config/categories'
import { 
  ArrowLeft, 
  Settings, 
  Brain, 
  CheckCircle2, 
  ListOrdered, 
  Plus, 
  Pencil, 
  Trash2, 
  Network, 
  Info, 
  Keyboard, 
  Loader2, 
  RefreshCw,
  Bolt,
  Workflow,
  FileText,
  Languages,
  MessageSquare,
  Search,
  Server,
  Feather,
  Cpu,
  Sun,
  Moon,
  Sparkles,
  Zap,
  ShieldCheck,
  Rss,
  Globe,
  Palette,
  Eye,
  EyeOff,
  Folder,
  Gamepad2,
  Coins,
  Activity,
  Tag,
  MessageCircle, 
  Smartphone, 
  Newspaper, 
  MessagesSquare, 
  PenTool, 
  Laptop, 
  Video, 
  Speaker, 
  Image, 
  GraduationCap, 
  AlertTriangle, 
  Plane, 
  ShoppingBag, 
  BookOpen, 
  Megaphone, 
  Book, 
  Microscope
} from 'lucide-vue-next'

const { 
  aiSettings, 
  addModel, 
  updateModel,
  removeModel, 
  fetchAvailableModels, 
  validateModel,
  fetchSettings: fetchAiSettings
} = useAiConfig()
const { proxySettings, proxyUrl, fetchSettings: fetchProxySettings } = useProxyConfig()
const { 
  rssSources, 
  addRssSource, 
  updateRssSource,
  removeRssSource,
  fetchSources: fetchRssSources,
  validateRssUrl
} = useRssConfig()

const activeTab = ref('ai')
const tabs = [
  { id: 'ai', name: 'AI 模型', icon: Brain },
  { id: 'rss', name: 'RSS 管理', icon: Rss },
  { id: 'proxy', name: '网络代理', icon: Network }
]

const providers = [
  { id: 'openai' as AiProvider, name: 'OpenAI', icon: Bolt },
  { id: 'deepseek' as AiProvider, name: 'DeepSeek', icon: Search },
  { id: 'ollama' as AiProvider, name: 'Ollama', icon: Server },
  { id: 'anthropic' as AiProvider, name: 'Anthropic', icon: Feather },
  { id: 'google' as AiProvider, name: 'Google', icon: Globe },
  { id: 'custom' as AiProvider, name: 'Custom', icon: Cpu }
]

const getProviderLucideIcon = (provider: AiProvider) => {
  return providers.find(p => p.id === provider)?.icon || Brain
}

const summaryLengthText = computed(() => {
  const val = aiSettings.summaryLength
  if (val <= 3) return '简短'
  if (val <= 7) return '适中'
  return '详细'
})

const sentimentSensitivityText = computed(() => {
  const val = aiSettings.sentimentSensitivity
  if (val <= 3) return '低'
  if (val <= 7) return '中'
  return '高'
})

const importanceThresholdText = computed(() => {
  const val = aiSettings.importanceThreshold
  if (val <= 3) return '宽松'
  if (val <= 7) return '严格'
  return '极高'
})

// Theme Logic
const isDarkMode = ref(false)
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.classList.toggle('dark', isDarkMode.value)
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
}

onMounted(async () => {
  // Theme initialization
  if (import.meta.client) {
    const savedTheme = localStorage.getItem('theme')
    isDarkMode.value = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDarkMode.value)
  }

  // Fetch settings from DB
  await Promise.all([
    fetchAiSettings(),
    fetchProxySettings(),
    fetchRssSources()
  ])
})

// Model Modal Logic
const isModelModalOpen = ref(false)
const editingModel = ref<string | null>(null)
const isFetchingModels = ref(false)
const isValidating = ref(false)
const fetchedModels = ref<string[]>([])

const baseUrlPlaceholder = computed(() => {
  switch (modelForm.provider) {
    case 'openai':
      return 'https://api.openai.com/v1'
    case 'deepseek':
      return 'https://api.deepseek.com'
    case 'ollama':
      return 'http://localhost:11434'
    case 'anthropic':
      return 'https://api.anthropic.com'
    case 'custom':
      return 'https://your-openai-compatible-host/v1'
    default:
      return ''
  }
})

const modelForm = reactive({
  name: '',
  provider: 'openai' as AiProvider,
  baseUrl: '',
  modelName: '',
  apiKey: '',
  temperature: 0.7,
  enabled: true
})


watch(() => modelForm.provider, () => {
  fetchedModels.value = []
})

const openAddModelModal = () => {
  editingModel.value = null
  fetchedModels.value = []
  Object.assign(modelForm, {
    name: '',
    provider: 'openai',
    baseUrl: '',
    modelName: '',
    apiKey: '',
    temperature: 0.7,
    enabled: true
  })
  isModelModalOpen.value = true
}

const editModel = (model: AiModelConfig) => {
  editingModel.value = model.id
  fetchedModels.value = []
  Object.assign(modelForm, {
    ...model,
    baseUrl: model.baseUrl ?? '',
    apiKey: model.apiKey ?? '',
    modelName: model.modelName ?? '',
    temperature: model.temperature ?? 0.7,
    enabled: model.enabled ?? true
  })
  isModelModalOpen.value = true
}

const closeModelModal = () => {
  isModelModalOpen.value = false
}

const fetchModels = async () => {
  if (modelForm.provider !== 'ollama' && !modelForm.apiKey) {
    toast.error('请先填写 API 密钥')
    return
  }

  if (isFetchingModels.value) return
  isFetchingModels.value = true
  try {
    const models = await fetchAvailableModels(modelForm.provider, modelForm.apiKey, modelForm.baseUrl || undefined, proxyUrl.value)
    if (models.length === 0) {
      toast.warning('未获取到模型列表，请检查配置或网络')
    }
    fetchedModels.value = models
    if (models.length > 0 && !modelForm.modelName) {
      modelForm.modelName = models[0]
    }
  } catch (e: any) {
    toast.error(`获取模型列表失败`, {
      description: '请检查您的 API Key 是否正确，或网络是否通畅'
    })
  } finally {
    isFetchingModels.value = false
  }
}

const validateAndSave = async () => {
  isValidating.value = true
  try {
    const result = await validateModel({ ...modelForm, id: editingModel.value || '' }, proxyUrl.value)
    if (result.success) {
      await saveModel()
      toast.success('验证成功，配置已保存')
    } else {
      toast.error(`验证失败: ${result.message}`)
    }
  } finally {
    isValidating.value = false
  }
}

const saveModel = async () => {
  if (editingModel.value) {
    const modelToUpdate = { ...modelForm, id: editingModel.value } as AiModelConfig
    await updateModel(modelToUpdate)
  } else {
    await addModel({ ...modelForm })
  }
  closeModelModal()
}

// RSS 管理逻辑
const isRssModalOpen = ref(false)
const editingRssId = ref<string | null>(null)
const rssForm = reactive({
  name: '',
  url: '',
  category: 'general',
  color: '#6366f1',
  icon: 'rss',
  enabled: true
})

const groupedRssSources = computed(() => {
  const groups: Record<string, any[]> = {}
  if (!rssSources.value) return groups
  rssSources.value.forEach(source => {
    if (source && source.category) {
      if (!groups[source.category]) {
        groups[source.category] = []
      }
      groups[source.category]?.push(source)
    }
  })
  return groups
})

const getCategoryName = (id: string) => {
  return rssCategories.find(c => c.id === id)?.name || id
}

const getCategoryIcon = (id: string) => {
  return rssCategories.find(c => c.id === id)?.icon || Folder
}

const openAddRssModal = () => {
  editingRssId.value = null
  Object.assign(rssForm, {
    name: '',
    url: '',
    category: 'general',
    color: '#6366f1',
    icon: 'rss',
    enabled: true
  })
  isRssModalOpen.value = true
}

const editRssSource = (source: any) => {
  editingRssId.value = source.id
  Object.assign(rssForm, {
    ...source
  })
  isRssModalOpen.value = true
}

const handleSaveRss = async () => {
  if (!rssForm.url || !rssForm.name) {
    toast.error('请填写必要信息')
    return
  }

  const loadingToast = toast.loading(editingRssId.value ? '正在更新...' : '正在验证订阅源...')
  
  try {
    // 验证订阅源
    const validation = await validateRssUrl(rssForm.url)
    if (!validation.valid) {
      toast.error(`订阅源验证失败: ${validation.message}`, { id: loadingToast })
      return
    }

    if (editingRssId.value) {
      await updateRssSource(editingRssId.value, { ...rssForm })
      toast.success('RSS 源已更新', { id: loadingToast })
    } else {
      await addRssSource({ ...rssForm })
      toast.success('RSS 源已添加', { id: loadingToast })
    }
    isRssModalOpen.value = false
  } catch (error) {
    toast.error('保存失败', { id: loadingToast })
  }
}

const toggleRssSource = async (id: string) => {
  const source = rssSources.value.find(s => s.id === id)
  if (source) {
    try {
      await updateRssSource(id, { enabled: !source.enabled })
      toast.success(`${source.name} 已${!source.enabled ? '启用' : '禁用'}`)
    } catch (e) {
      toast.error('切换状态失败')
    }
  }
}

const isDeleteRssConfirmOpen = ref(false)
const deletingRssId = ref<string | null>(null)

const handleRemoveRss = (id: string) => {
  deletingRssId.value = id
  isDeleteRssConfirmOpen.value = true
}

const confirmRemoveRss = async () => {
  if (!deletingRssId.value) return
  
  try {
    const source = await removeRssSource(deletingRssId.value)
    if (source) {
      toast.success(`${source.name} 已移除`)
    }
  } catch (e) {
    toast.error('移除失败')
  } finally {
    isDeleteRssConfirmOpen.value = false
    deletingRssId.value = null
  }
}

useHead({
  title: '系统设置'
})
</script>

<style scoped>
.animate-spin-slow {
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
</style>
