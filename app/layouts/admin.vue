<script setup lang="ts">
const route = useRoute()
const menuOpen = ref(false)
const siteName = useRuntimeConfig().public.siteName

// Close the mobile menu whenever the route changes.
watch(() => route.fullPath, () => { menuOpen.value = false })
</script>

<template>
  <div class="flex min-h-screen bg-canvas">
    <!-- Desktop sidebar -->
    <AdminSidebar />

    <!-- Mobile menu bar + slide-over (the desktop sidebar is hidden below lg) -->
    <div class="fixed inset-x-0 top-0 z-30 flex h-12 items-center gap-3 border-b border-line bg-surface px-4 lg:hidden">
      <button class="text-ink" aria-label="Open admin menu" @click="menuOpen = true">
        <UIcon name="i-heroicons-bars-3" class="h-6 w-6" />
      </button>
      <span class="font-display text-sm font-extrabold text-ink">{{ siteName }} Admin</span>
    </div>

    <div v-if="menuOpen" class="fixed inset-0 z-40 flex lg:hidden">
      <AdminSidebar mobile @navigate="menuOpen = false" />
      <button class="flex-1 bg-black/70" aria-label="Close admin menu" @click="menuOpen = false" />
    </div>

    <div class="min-w-0 flex-1 pt-12 lg:pt-0">
      <slot />
    </div>
  </div>
</template>
