import { defineStore } from 'pinia'
import type { IAuthState } from '~/types/auth'

export const useAuthStore = defineStore('auth', {
  state: (): IAuthState => ({
    isAdmin: false,
    username: null,
  }),

  actions: {
    async fetchMe() {
      try {
        const data = await $fetch<IAuthState>('/api/auth/me')
        this.isAdmin = data.isAdmin
        this.username = data.username
      } catch {
        this.isAdmin = false
        this.username = null
      }
    },

    async login(username: string, password: string) {
      const data = await $fetch<{ ok: boolean; username: string }>('/api/auth/login', {
        method: 'POST',
        body: { username, password },
      })
      this.isAdmin = true
      this.username = data.username
    },

    async logout() {
      await $fetch('/api/auth/logout', { method: 'POST' })
      this.isAdmin = false
      this.username = null
    },
  },
})
