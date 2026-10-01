<script setup lang="ts">
const { currentUser, logout } = useAuth()
</script>

<template>
  <header class="flex h-16 items-center justify-between border-b border-line bg-canvas px-6">
    <slot name="title" />
    <div class="flex items-center gap-4">
      <span class="text-sm text-ink-muted">{{ currentUser?.email }}</span>
      <button class="text-sm font-medium text-ink-muted hover:text-ink" @click="logout">Sign Out</button>
    </div>
  </header>
</template>
