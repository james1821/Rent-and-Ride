<script setup lang="ts">
defineProps<{ count?: number }>()
</script>

<template>
  <div class="grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    <div v-for="i in (count ?? 8)" :key="i" class="overflow-hidden rounded-xl border border-line bg-surface">
      <div class="skeleton aspect-[4/3] w-full !rounded-none" />
      <div class="space-y-2 p-4">
        <div class="skeleton h-3 w-1/3" />
        <div class="skeleton h-5 w-2/3" />
        <div class="skeleton h-7 w-1/2" />
      </div>
    </div>
  </div>
</template>
