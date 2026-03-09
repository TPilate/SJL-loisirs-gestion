<script setup lang="ts">
const auth = useAuthStore()
</script>

<template>
  <div class="page-root">

    <!-- Mobile top bar (hidden on desktop) -->
    <div class="mobile-topbar">
      <NuxtLink to="/" class="logo-link">
        <div class="logo-icon">
          <UIcon name="i-lucide-volleyball" style="width:18px;height:18px;color:#fff" />
        </div>
        <span class="logo-text">SJL <span style="color:#ef4444">LOISIRS</span></span>
      </NuxtLink>
      <div style="display:flex;align-items:center;gap:8px">
        <div class="admin-avatar" style="width:32px;height:32px;font-size:13px">
          {{ auth.username?.[0]?.toUpperCase() }}
        </div>
        <button class="btn-logout" title="Se déconnecter"
          @click="async () => { await auth.logout(); await navigateTo('/login') }">
          <UIcon name="i-lucide-log-out" style="width:14px;height:14px" />
        </button>
      </div>
    </div>

    <!-- Desktop sidebar (hidden on mobile) -->
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

    <!-- Mobile bottom navigation (hidden on desktop) -->
    <nav class="mobile-nav">
      <NuxtLink to="/players" class="mobile-nav-item" active-class="mobile-nav-item--active">
        <UIcon name="i-lucide-users" style="width:22px;height:22px" />
        <span>Joueurs</span>
      </NuxtLink>
      <NuxtLink to="/tournaments" class="mobile-nav-item" active-class="mobile-nav-item--active">
        <UIcon name="i-lucide-trophy" style="width:22px;height:22px" />
        <span>Tournois</span>
      </NuxtLink>
    </nav>

  </div>
</template>
