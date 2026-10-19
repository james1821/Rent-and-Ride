<script setup lang="ts">
defineProps<{ count?: number }>()
</script>

<template>
  <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
    <div v-for="i in (count ?? 4)" :key="i" class="rounded border border-line bg-surface p-5">
      <div class="flex items-center justify-between">
        <div class="skeleton h-3 w-24" />
        <div class="skeleton h-5 w-5 rounded-full" />
      </div>
      <div class="skeleton mt-3 h-7 w-16" />
    </div>
  </div>
</template>
