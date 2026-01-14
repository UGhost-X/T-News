import { ref, computed } from 'vue'

export interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl?: string
  isAdmin: boolean
}

export const useAuth = () => {
  const user = useState<User | null>('auth-user', () => null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)

  const fetchUser = async () => {
    loading.value = true
    try {
      const fetch = useRequestFetch()
      const data = await fetch<{ user: User | null }>('/api/auth/me')
      user.value = data.user
    } catch (error) {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      user.value = null
      navigateTo('/auth/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return {
    user,
    loading,
    isAuthenticated,
    fetchUser,
    logout
  }
}
