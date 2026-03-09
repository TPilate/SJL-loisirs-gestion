import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return

  const auth = useAuthStore()
  if (!auth.isAdmin) {
    await auth.fetchMe()
    if (!auth.isAdmin) {
      return navigateTo('/login')
    }
  }
})
