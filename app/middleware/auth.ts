export default defineNuxtRouteMiddleware(async (to, from) => {
  const { user, fetchUser } = useAuth()
  
  // Skip if we are on client side and already have user
  if (import.meta.client && user.value) return

  // Try to fetch user if not available
  await fetchUser()

  if (!user.value) {
    // If we are not on auth pages, redirect to login
    if (!to.path.startsWith('/auth')) {
      return navigateTo('/auth/login')
    }
  } else {
    // If already logged in and trying to access auth pages, redirect to home
    if (to.path.startsWith('/auth')) {
      return navigateTo('/')
    }
  }
})
