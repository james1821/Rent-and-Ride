<script setup lang="ts">
defineProps<{ name: string; imageUrl?: string; href: string }>()
const broken = ref(false)
</script>

<template>
  <NuxtLink :to="href" class="on-dark card-lift group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-xl border border-ink bg-ink p-5 text-white sm:aspect-square">
    <img
      v-if="imageUrl && !broken" :src="imageUrl" :alt="name" loading="lazy"
      class="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-700 group-hover:scale-110 group-hover:opacity-90"
      @error="broken = true"
    >
    <div v-else class="speed-lines absolute inset-0" />
    <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
    <div class="relative flex items-end justify-between gap-2">
      <span class="font-display text-2xl font-extrabold leading-none tracking-tight">{{ name }}</span>
      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-ink transition group-hover:bg-volt">
        <UIcon name="i-heroicons-arrow-up-right" class="h-4 w-4" />
      </span>
    </div>
  </NuxtLink>
</template>
