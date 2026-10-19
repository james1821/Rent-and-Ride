<script setup lang="ts">
defineProps<{ rows?: number }>()
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="i in (rows ?? 5)" :key="i"
      class="flex items-center justify-between gap-4 rounded border border-line bg-surface p-4"
    >
      <div class="space-y-2">
        <div class="skeleton h-4 w-40" />
        <div class="skeleton h-3 w-56 max-w-full" />
      </div>
      <div class="space-y-2">
        <div class="skeleton ml-auto h-4 w-20" />
        <div class="skeleton ml-auto h-3 w-14" />
      </div>
    </div>
  </div>
</template>
