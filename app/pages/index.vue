<template>
  <div class="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
    <h1 class="text-3xl font-bold">
      SJL Loisirs Gestion
    </h1>

    <UCard class="w-full max-w-sm">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-calculator" class="size-5" />
          <span class="font-semibold">Compteur</span>
        </div>
      </template>

      <div class="flex flex-col items-center gap-4">
        <p class="text-4xl font-mono font-bold">
          {{ counter.count }}
        </p>
        <div class="flex gap-2">
          <UButton
            icon="i-heroicons-minus"
            color="neutral"
            variant="outline"
            @click="counter.decrement()"
          />
          <UButton
            icon="i-heroicons-plus"
            @click="counter.increment()"
          />
          <UButton
            icon="i-heroicons-arrow-path"
            color="neutral"
            variant="ghost"
            @click="counter.reset()"
          />
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { useCounterStore } from '~/stores/counter'

const counter = useCounterStore()
</script>
