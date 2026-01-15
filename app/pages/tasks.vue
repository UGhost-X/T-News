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
          <h1 class="text-3xl font-extrabold tracking-tight">定时任务管理</h1>
          <p class="text-muted-foreground text-sm mt-1">管理系统的自动化任务，包括 RSS 更新、AI 摘要生成等</p>
        </div>
        <div class="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
          <Clock class="h-6 w-6 text-primary animate-pulse" />
        </div>
      </div>

      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold flex items-center gap-2">
            <ListTodo class="h-5 w-5 text-primary" />
            任务列表
          </h2>
          <Button @click="openAddTaskModal">
            <Plus class="mr-2 h-4 w-4" />
            新增任务
          </Button>
        </div>

        <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-3xl border border-dashed">
          <RefreshCw class="h-8 w-8 text-primary animate-spin mb-4" />
          <p class="text-muted-foreground font-medium">加载中...</p>
        </div>

        <div v-else-if="tasks.length === 0" class="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-3xl border border-dashed">
          <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <CalendarX class="h-8 w-8 text-muted-foreground" />
          </div>
          <p class="text-muted-foreground font-medium">暂无定时任务</p>
        </div>

        <div v-else class="grid gap-4">
          <Card v-for="task in tasks" :key="task.id" class="overflow-hidden">
            <CardContent class="p-0">
              <div class="flex items-center p-6 gap-6">
                <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" :class="getTaskTypeBg(task.task_type)">
                  <component :is="getTaskTypeIcon(task.task_type)" class="h-6 w-6" :class="getTaskTypeColor(task.task_type)" />
                </div>
                
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-3 mb-1">
                    <h3 class="font-bold text-lg truncate">{{ task.name }}</h3>
                    <span 
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      :class="task.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'"
                    >
                      {{ task.enabled ? '已启用' : '已禁用' }}
                    </span>
                  </div>
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <div class="flex items-center gap-1.5">
                      <Timer class="h-3.5 w-3.5" />
                      Cron: <code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{{ task.cron_expression }}</code>
                    </div>
                    <div v-if="task.last_run_at" class="flex items-center gap-1.5">
                      <History class="h-3.5 w-3.5" />
                      上次运行: {{ formatTime(task.last_run_at) }}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <Button variant="outline" size="sm" @click="runTaskNow(task.id)" :disabled="runningTaskId === task.id">
                    <RefreshCw v-if="runningTaskId === task.id" class="mr-2 h-4 w-4 animate-spin" />
                    <Play v-else class="mr-2 h-4 w-4" />
                    立即运行
                  </Button>
                  
                  <div class="flex items-center border rounded-lg overflow-hidden">
                    <Button variant="ghost" size="icon" @click="editTask(task)" class="h-9 w-9 rounded-none border-r">
                      <Pencil class="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" @click="toggleTaskStatus(task)" class="h-9 w-9 rounded-none border-r">
                      <component :is="task.enabled ? EyeOff : Eye" class="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" @click="deleteTask(task.id)" class="h-9 w-9 rounded-none text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div v-if="task.last_status === 'error'" class="px-6 py-2 bg-destructive/10 border-t border-destructive/20 flex items-center gap-2 text-xs text-destructive">
                <AlertCircle class="h-3.5 w-3.5" />
                <span>错误: {{ task.last_error }}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <!-- Add/Edit Task Dialog -->
    <Dialog :open="isTaskModalOpen" @update:open="isTaskModalOpen = $event">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{{ editingTask ? '编辑定时任务' : '新增定时任务' }}</DialogTitle>
          <DialogDescription>
            配置定时任务的执行频率和任务类型。
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>任务名称</Label>
            <Input v-model="taskForm.name" placeholder="例如: 每小时更新 RSS" />
          </div>

          <div class="space-y-2">
            <Label>任务类型</Label>
            <Select v-model="taskForm.task_type">
              <SelectTrigger>
                <SelectValue placeholder="选择任务类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rss_update">RSS 订阅更新</SelectItem>
                <SelectItem value="ai_summary">AI 智能摘要生成</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <Label>执行频率</Label>
              <a href="https://crontab.guru/" target="_blank" class="text-xs text-primary hover:underline flex items-center">
                <ExternalLink class="h-3 w-3 mr-1" />
                Cron 帮助
              </a>
            </div>

            <!-- Preset Buttons -->
            <div class="grid grid-cols-2 gap-2">
              <Button 
                v-for="preset in cronPresets" 
                :key="preset.value"
                variant="outline" 
                size="sm"
                class="text-xs justify-start h-8"
                :class="{ 'border-primary bg-primary/5 text-primary': taskForm.cron_expression === preset.value }"
                @click="taskForm.cron_expression = preset.value"
              >
                <Clock class="mr-2 h-3 w-3" />
                {{ preset.label }}
              </Button>
            </div>

            <div class="relative">
              <Input v-model="taskForm.cron_expression" placeholder="例如: 0 */2 * * *" class="pr-20" />
              <div class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                CRON
              </div>
            </div>
            
            <div v-if="cronDescription" class="flex items-start gap-2 p-2.5 bg-primary/5 rounded-lg border border-primary/10">
              <Info class="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <div class="text-[11px] text-primary/80 leading-relaxed">
                <span class="font-bold">下次运行预览：</span>
                {{ cronDescription }}
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-2 pt-2">
            <Switch id="task-enabled" v-model="taskForm.enabled" />
            <Label for="task-enabled">启用此任务</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isTaskModalOpen = false">取消</Button>
          <Button @click="saveTask" :disabled="isSaving">
            <RefreshCw v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
            {{ editingTask ? '保存更改' : '创建任务' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { 
  ArrowLeft, Clock, Plus, ListTodo, RefreshCw, Play, 
  MoreVertical, Pencil, Trash2, Eye, EyeOff, AlertCircle,
  Timer, History, Rss, Brain, ExternalLink, CalendarX, Info
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { CronExpressionParser } from 'cron-parser'

definePageMeta({
  middleware: 'auth'
})

interface Task {
  id: string
  name: string
  task_type: 'rss_update' | 'ai_summary'
  cron_expression: string
  enabled: boolean
  last_run_at: string | null
  last_status: 'success' | 'error' | 'running' | null
  last_error: string | null
}

const cronPresets = [
  { label: '每 30 分钟', value: '*/30 * * * *' },
  { label: '每小时', value: '0 * * * *' },
  { label: '每 2 小时', value: '0 */2 * * *' },
  { label: '每天凌晨 2 点', value: '0 2 * * *' },
  { label: '每周一凌晨', value: '0 0 * * 1' },
  { label: '每月 1 号凌晨', value: '0 0 1 * *' },
]

const cronDescription = ref('')

const tasks = ref<Task[]>([])
const isLoading = ref(true)
const isSaving = ref(false)
const runningTaskId = ref<string | null>(null)

const isTaskModalOpen = ref(false)
const editingTask = ref<Task | null>(null)
const taskForm = reactive({
  name: '',
  task_type: 'rss_update' as Task['task_type'],
  cron_expression: '0 */2 * * *',
  enabled: true
})

// 解析 Cron 表达式并显示人类可读的时间
watch(() => taskForm.cron_expression, (val) => {
  if (!val) {
    cronDescription.value = ''
    return
  }
  try {
    const interval = CronExpressionParser.parse(val)
    const next = interval.next().toDate()
    cronDescription.value = next.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long'
    })
  } catch (e) {
    cronDescription.value = '无效的表达式'
  }
}, { immediate: true })

const fetchTasks = async () => {
  isLoading.value = true
  try {
    const data = await $fetch<Task[]>('/api/settings/tasks')
    tasks.value = data
  } catch (error: any) {
    toast.error('获取任务列表失败')
  } finally {
    isLoading.value = false
  }
}

const openAddTaskModal = () => {
  editingTask.value = null
  taskForm.name = ''
  taskForm.task_type = 'rss_update'
  taskForm.cron_expression = '0 */2 * * *'
  taskForm.enabled = true
  isTaskModalOpen.value = true
}

const editTask = (task: Task) => {
  editingTask.value = task
  taskForm.name = task.name
  taskForm.task_type = task.task_type
  taskForm.cron_expression = task.cron_expression
  taskForm.enabled = task.enabled
  isTaskModalOpen.value = true
}

const saveTask = async () => {
  if (!taskForm.name || !taskForm.cron_expression) {
    toast.error('请填写完整信息')
    return
  }

  isSaving.value = true
  try {
    if (editingTask.value) {
      await $fetch(`/api/settings/tasks/${editingTask.value.id}`, {
        method: 'PUT',
        body: taskForm
      })
      toast.success('任务已更新')
    } else {
      await $fetch('/api/settings/tasks', {
        method: 'POST',
        body: taskForm
      })
      toast.success('任务已创建')
    }
    isTaskModalOpen.value = false
    fetchTasks()
  } catch (error: any) {
    toast.error('保存失败')
  } finally {
    isSaving.value = false
  }
}

const deleteTask = async (id: string) => {
  if (!confirm('确定要删除此任务吗？')) return
  try {
    await $fetch(`/api/settings/tasks/${id}`, {
      method: 'DELETE'
    })
    toast.success('任务已删除')
    fetchTasks()
  } catch (error: any) {
    toast.error('删除失败')
  }
}

const toggleTaskStatus = async (task: Task) => {
  try {
    await $fetch(`/api/settings/tasks/${task.id}`, {
      method: 'PUT',
      body: {
        ...task,
        enabled: !task.enabled
      }
    })
    toast.success(task.enabled ? '已禁用' : '已启用')
    fetchTasks()
  } catch (error: any) {
    toast.error('操作失败')
  }
}

const runTaskNow = async (id: string) => {
  runningTaskId.value = id
  try {
    const res = await $fetch<{ success?: boolean; error?: string }>(`/api/settings/tasks/${id}/run`, {
      method: 'POST'
    })
    if (res.error) {
      toast.error(`执行失败: ${res.error}`)
    } else {
      toast.success('任务已开始运行')
    }
    fetchTasks()
  } catch (error: any) {
    toast.error('执行失败')
  } finally {
    runningTaskId.value = null
  }
}

const getTaskTypeIcon = (type: Task['task_type']) => {
  switch (type) {
    case 'rss_update': return Rss
    case 'ai_summary': return Brain
  }
}

const getTaskTypeBg = (type: Task['task_type']) => {
  switch (type) {
    case 'rss_update': return 'bg-blue-100 dark:bg-blue-900/30'
    case 'ai_summary': return 'bg-purple-100 dark:bg-purple-900/30'
  }
}

const getTaskTypeColor = (type: Task['task_type']) => {
  switch (type) {
    case 'rss_update': return 'text-blue-600 dark:text-blue-400'
    case 'ai_summary': return 'text-purple-600 dark:text-purple-400'
  }
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const isDarkMode = ref(false)
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.classList.toggle('dark')
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
}

onMounted(() => {
  fetchTasks()
  isDarkMode.value = document.documentElement.classList.contains('dark')
})
</script>
