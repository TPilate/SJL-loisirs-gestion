<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const auth = useAuthStore()

if (auth.isAdmin) {
  await navigateTo('/players')
}

const form = reactive({ username: '', password: '' })
const isLoading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!form.username || !form.password) {
    error.value = 'Veuillez remplir tous les champs.'
    return
  }
  error.value = ''
  isLoading.value = true
  try {
    await auth.login(form.username, form.password)
    await navigateTo('/players?welcome=1')
  } catch {
    error.value = 'Identifiants invalides. Veuillez réessayer.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="login-root">
    <div class="blob blob-1" />
    <div class="blob blob-2" />

    <div class="login-box">
      <!-- Logo -->
      <div class="login-heading">
        <div class="login-logo-icon">
          <UIcon name="i-lucide-volleyball" style="width:32px;height:32px;color:#fff" />
        </div>
        <div class="login-club-name font-condensed">SJL <span style="color:#ef4444">LOISIRS</span></div>
        <p class="login-subtitle">Espace administration</p>
      </div>

      <!-- Error -->
      <div v-if="error" class="login-error">
        <UIcon name="i-lucide-alert-circle" style="width:14px;height:14px;flex-shrink:0" />
        {{ error }}
      </div>

      <!-- Form -->
      <div class="login-form">
        <div class="login-field">
          <label class="login-label" for="login-username">Identifiant</label>
          <div class="login-input-wrap">
            <UIcon name="i-lucide-user" class="login-input-icon" />
            <input id="login-username" v-model="form.username" class="login-input" placeholder="admin"
              autocomplete="username" @keyup.enter="handleLogin" />
          </div>
        </div>
        <div class="login-field">
          <label class="login-label" for="login-password">Mot de passe</label>
          <div class="login-input-wrap">
            <UIcon name="i-lucide-lock" class="login-input-icon" />
            <input id="login-password" v-model="form.password" class="login-input" type="password"
              placeholder="••••••••" autocomplete="current-password" @keyup.enter="handleLogin" />
          </div>
        </div>
        <button class="btn-login" :disabled="isLoading" @click="handleLogin">
          <UIcon v-if="isLoading" name="i-lucide-loader-circle"
            style="width:18px;height:18px;animation:spin 1s linear infinite" />
          <UIcon v-else name="i-lucide-log-in" style="width:18px;height:18px" />
          Se connecter
        </button>
      </div>

      <p class="login-footer-text">SJL Loisirs — Gestion interne v1.0</p>
    </div>
  </div>
</template>
