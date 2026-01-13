<script setup lang="ts">
definePageMeta({
  layout: false
})

import { useAuth, type User } from '../../composables/useAuth'
import { User as UserIcon, Lock, Mail, IdCard, CheckCircle2, Loader2, AlertCircle } from 'lucide-vue-next'

const { user } = useAuth()
const email = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const displayName = ref('')
const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  if (!email.value || !username.value || !password.value) {
    error.value = '请填写所有必填项'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await $fetch<{ user: User }>('/api/auth/register', {
      method: 'POST',
      body: {
        email: email.value,
        username: username.value,
        password: password.value,
        displayName: displayName.value || username.value
      }
    })
    
    user.value = response.user
    navigateTo('/')
  } catch (err: any) {
    error.value = err.data?.statusMessage || '注册失败，该用户名或邮箱可能已被占用'
  } finally {
    loading.value = false
  }
}

// If already logged in, redirect to home
onMounted(() => {
  if (user.value) {
    navigateTo('/')
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
    <div class="w-full max-w-md">
      <!-- Logo/Brand -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 mb-4 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
          <img src="/logo.png" alt="T-News Logo" class="w-full h-full object-contain p-2" />
        </div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">创建新账号</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-2">加入 T-News，获取最新的 AI 驱动资讯</p>
      </div>

      <!-- Register Card -->
      <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8">
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div v-if="error" class="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center">
            <AlertCircle class="w-4 h-4 mr-2" />
            {{ error }}
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">用户名*</label>
              <div class="relative group">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <UserIcon class="w-4 h-4" />
                </span>
                <input 
                  v-model="username"
                  type="text" 
                  placeholder="必填"
                  class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white text-sm"
                  required
                />
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">显示名称</label>
              <div class="relative group">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <IdCard class="w-4 h-4" />
                </span>
                <input 
                  v-model="displayName"
                  type="text" 
                  placeholder="可选"
                  class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white text-sm"
                />
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">电子邮箱*</label>
            <div class="relative group">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                <Mail class="w-4 h-4" />
              </span>
              <input 
                v-model="email"
                type="email" 
                placeholder="example@mail.com"
                class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white text-sm"
                required
              />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">登录密码*</label>
            <div class="relative group">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                <Lock class="w-4 h-4" />
              </span>
              <input 
                v-model="password"
                type="password" 
                placeholder="请输入密码"
                class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white text-sm"
                required
              />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">确认密码*</label>
            <div class="relative group">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                <CheckCircle2 class="w-4 h-4" />
              </span>
              <input 
                v-model="confirmPassword"
                type="password" 
                placeholder="请再次输入密码"
                class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white text-sm"
                required
              />
            </div>
          </div>

          <div class="pt-2">
            <button 
              type="submit"
              :disabled="loading"
              class="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
              <span>{{ loading ? '注册中...' : '立即注册' }}</span>
            </button>
          </div>
        </form>

        <div class="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <p class="text-sm text-slate-500 dark:text-slate-400">
            已有账号？
            <NuxtLink to="/auth/login" class="text-primary font-bold hover:underline ml-1">返回登录</NuxtLink>
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-8">
        <p class="text-xs text-slate-400 dark:text-slate-500">
          注册即代表您同意我们的 <a href="#" class="hover:underline">服务条款</a> 和 <a href="#" class="hover:underline">隐私政策</a>
        </p>
      </div>
    </div>
  </div>
</template>
