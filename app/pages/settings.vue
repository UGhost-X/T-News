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
       <TabsList class="grid w-full grid-cols-2 mb-10 h-auto p-1.5 bg-muted/20 rounded-2xl border border-muted/20">
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
          <!-- Active Model Selection -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Brain class="h-5 w-5 text-primary" />
                当前激活模型
              </CardTitle>
              <CardDescription>选择您希望在系统中默认使用的 AI 模型</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  v-for="model in aiSettings.models" 
                  :key="model.id"
                  @click="aiSettings.activeModelId = model.id"
                  class="p-4 rounded-xl border-2 cursor-pointer transition-all relative group"
                  :class="aiSettings.activeModelId === model.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted hover:border-accent bg-card'"
                >
                  <div class="flex items-center mb-2">
                    <div class="w-8 h-8 rounded-lg bg-background flex items-center justify-center mr-3 shadow-sm border">
                      <component :is="getProviderLucideIcon(model.provider)" class="h-4 w-4 text-primary" />
                    </div>
                    <div class="font-bold">{{ model.name }}</div>
                  </div>
                  <div class="text-xs text-muted-foreground uppercase">{{ model.provider }} - {{ model.modelName }}</div>
                  <div v-if="aiSettings.activeModelId === model.id" class="absolute top-3 right-3 text-primary">
                    <CheckCircle2 class="h-4 w-4" />
                  </div>
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
                  <Input v-model="proxySettings.username" placeholder="用户名" :disabled="!proxySettings.enabled" />
                </div>
                <div class="space-y-2">
                  <Label>密码 (可选)</Label>
                  <Input v-model="proxySettings.password" type="password" placeholder="密码" :disabled="!proxySettings.enabled" />
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
            <Input v-model="modelForm.baseUrl" :placeholder="baseUrlPlaceholder" />
          </div>

          <div class="space-y-2">
            <Label>模型名称 (Model Name)</Label>
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

          <div v-if="modelForm.provider !== 'ollama'" class="space-y-2">
            <Label>API 密钥 (API Key)</Label>
            <Input v-model="modelForm.apiKey" type="password" placeholder="sk-xxxxxxxxx" />
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
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'
import { useAiConfig } from '~/composables/useAiConfig'
import { useProxyConfig } from '~/composables/useProxyConfig'
import type { AiProvider, AiModelConfig } from '~/types/news'
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
  Search,
  Server,
  Feather,
  Cpu,
  Sun,
  Moon,
  Sparkles,
  Zap,
  ShieldCheck
} from 'lucide-vue-next'

const { 
  aiSettings, 
  addModel, 
  removeModel, 
  fetchAvailableModels, 
  validateModel,
  summaryLengthText,
  sentimentSensitivityText,
  importanceThresholdText
} = useAiConfig()
const { proxySettings, proxyUrl } = useProxyConfig()

const activeTab = ref('ai')
const tabs = [
  { id: 'ai', name: 'AI 模型', icon: Brain },
  { id: 'proxy', name: '网络代理', icon: Network }
]

const providers = [
  { id: 'openai' as AiProvider, name: 'OpenAI', icon: Bolt },
  { id: 'deepseek' as AiProvider, name: 'DeepSeek', icon: Search },
  { id: 'ollama' as AiProvider, name: 'Ollama', icon: Server },
  { id: 'anthropic' as AiProvider, name: 'Anthropic', icon: Feather },
  { id: 'custom' as AiProvider, name: 'Custom', icon: Cpu }
]

const getProviderLucideIcon = (provider: AiProvider) => {
  return providers.find(p => p.id === provider)?.icon || Brain
}

// Theme Logic
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

onMounted(() => {
  if (import.meta.client) {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      isDarkMode.value = true
      document.documentElement.classList.add('dark')
    } else {
      isDarkMode.value = false
      document.documentElement.classList.remove('dark')
    }
    toast.info('配置页面已加载')
  }
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
      saveModel()
      toast.success('验证成功，配置已保存')
    } else {
      toast.error(`验证失败: ${result.message}`)
    }
  } finally {
    isValidating.value = false
  }
}

const saveModel = () => {
  if (editingModel.value) {
    const index = aiSettings.models.findIndex(m => m.id === editingModel.value)
    if (index !== -1) {
      aiSettings.models[index] = { ...modelForm, id: editingModel.value } as AiModelConfig
    }
  } else {
    addModel({ ...modelForm })
  }
  closeModelModal()
}

useHead({
  title: '系统设置 - 智能新闻聚合'
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
