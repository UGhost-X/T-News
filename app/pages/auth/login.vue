<script setup lang="ts">
definePageMeta({
  layout: false
})

import { useAuth, type User } from '../../composables/useAuth'
import { User as UserIcon, Lock, Loader2, AlertCircle } from 'lucide-vue-next'

const { user } = useAuth()
const identifier = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (!identifier.value || !password.value) {
    error.value = '请输入账号和密码'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await $fetch<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: identifier.value,
        password: password.value
      }
    })
    
    user.value = response.user
    navigateTo('/')
  } catch (err: any) {
    error.value = err.data?.statusMessage || '登录失败，请检查账号密码'
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
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl">
          <img src="/logo.png" alt="T-News Logo" class="w-full h-full object-contain p-2" />
        </div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">欢迎回来 T-News</h1>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div v-if="error" class="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center">
            <AlertCircle class="w-4 h-4 mr-2" />
            {{ error }}
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">用户名或邮箱</label>
            <div class="relative group">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                <UserIcon class="w-4 h-4" />
              </span>
              <input 
                v-model="identifier"
                type="text" 
                placeholder="请输入用户名或邮箱"
                class="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white"
                required
              />
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between items-center ml-1">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">密码</label>
              <a href="#" class="text-xs text-primary hover:underline">忘记密码？</a>
            </div>
            <div class="relative group">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                <Lock class="w-4 h-4" />
              </span>
              <input 
                v-model="password"
                type="password" 
                placeholder="请输入密码"
                class="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            :disabled="loading"
            class="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
            <span>{{ loading ? '登录中...' : '立即登录' }}</span>
          </button>
        </form>

        <div class="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <p class="text-sm text-slate-500 dark:text-slate-400">
            还没有账号？
            <NuxtLink to="/auth/register" class="text-primary font-bold hover:underline ml-1">立即注册</NuxtLink>
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-8">
        <p class="text-xs text-slate-400 dark:text-slate-500">
          &copy; 2026 T-News. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</template>
