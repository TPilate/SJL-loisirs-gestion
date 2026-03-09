import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/login') return

  const auth = useAuthStore()
  if (!auth.isAdmin) {
    return navigateTo('/login')
  }
})
