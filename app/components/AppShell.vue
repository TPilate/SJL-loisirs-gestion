<script setup lang="ts">
const auth = useAuthStore()
</script>

<template>
  <div class="page-root">
    <aside class="sidebar">
      <div class="sidebar-logo">
        <NuxtLink to="/" class="logo-link">
          <div class="logo-icon">
            <UIcon name="i-lucide-volleyball" style="width:20px;height:20px;color:#fff" />
          </div>
          <span class="logo-text">SJL <span style="color:#ef4444">LOISIRS</span></span>
        </NuxtLink>
      </div>

      <nav class="sidebar-nav">
        <NuxtLink to="/players" class="nav-item" active-class="nav-item--active">
          <UIcon name="i-lucide-users" style="width:16px;height:16px" />
          Joueurs
        </NuxtLink>
        <NuxtLink to="/tournaments" class="nav-item" active-class="nav-item--active">
          <UIcon name="i-lucide-trophy" style="width:16px;height:16px" />
          Tournois
        </NuxtLink>
      </nav>

      <div class="sidebar-footer">
        <div class="admin-badge">
          <div class="admin-avatar">{{ auth.username?.[0]?.toUpperCase() }}</div>
          <div class="admin-info">
            <span class="admin-name">{{ auth.username }}</span>
            <span class="admin-role">Administrateur</span>
          </div>
        </div>
        <button class="btn-logout" title="Se déconnecter"
          @click="async () => { await auth.logout(); await navigateTo('/login') }">
          <UIcon name="i-lucide-log-out" style="width:14px;height:14px" />
        </button>
      </div>
    </aside>

    <main class="main-content">
      <slot />
    </main>
  </div>
</template>
