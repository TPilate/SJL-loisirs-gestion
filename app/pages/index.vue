<script setup lang="ts">
// Landing page — no redirect
</script>

<template>
  <div class="landing-root">
    <!-- Background glow -->
    <div class="landing-bg-glow" />

    <!-- Nav bar -->
    <header class="landing-header">
      <div class="landing-header-inner">
        <div class="landing-header-logo font-condensed">
          SJL <span style="color:#ef4444">LOISIRS</span>
        </div>
        <NuxtLink to="/login" class="btn-add" style="height:36px;padding:0 16px;font-size:13px;text-decoration:none">
          <UIcon name="i-lucide-log-in" style="width:15px;height:15px" />
          Connexion admin
        </NuxtLink>
      </div>
    </header>

    <!-- Hero -->
    <main class="landing-hero">
      <div class="landing-pill">🏐 Club de volleyball — Lille</div>

      <h1 class="landing-title font-condensed">
        <span style="color:#ef4444">SPORT</span>
        <span style="color:#fff">JOIE</span>
        <span style="color:#6b7280">LILLE</span>
      </h1>

      <p class="landing-tagline">
        Ensemble sur le terrain, ensemble dans la victoire.<br>
        Le volleyball est notre passion, Lille est notre maison.
      </p>

      <div class="landing-actions">
        <NuxtLink to="/login" class="btn-add"
          style="height:52px;padding:0 32px;font-size:16px;gap:10px;text-decoration:none">
          <UIcon name="i-lucide-layout-dashboard" style="width:20px;height:20px" />
          Accéder à la gestion
        </NuxtLink>
      </div>

      <!-- Stats row -->
      <div class="landing-stats">
        <div class="landing-stat">
          <span class="landing-stat-num">SJL</span>
          <span class="landing-stat-label">Sport Joie Lille</span>
        </div>
        <div class="landing-stat-sep" />
        <div class="landing-stat">
          <span class="landing-stat-num">Lille</span>
          <span class="landing-stat-label">Nord, France</span>
        </div>
        <div class="landing-stat-sep" />
        <div class="landing-stat">
          <span class="landing-stat-num">🏐</span>
          <span class="landing-stat-label">Volleyball</span>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="landing-footer">
      SJL Loisirs — Sport Joie Lille · Gestion interne v1.0
    </footer>
  </div>
</template>
