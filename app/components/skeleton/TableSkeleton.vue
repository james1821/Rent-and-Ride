<script setup lang="ts">
defineProps<{ rows?: number; cols?: number; colsClass?: string }>()
</script>

<template>
  <div class="overflow-hidden rounded border border-line bg-surface">
    <div class="flex items-center gap-4 border-b border-line bg-sunken/60 px-4 py-3">
      <div
        v-for="c in (cols ?? 4)" :key="c"
        class="skeleton h-3" :class="c === (cols ?? 4) ? 'ml-auto w-16' : 'w-24'"
      />
    </div>
    <div
      v-for="r in (rows ?? 6)" :key="r"
      class="flex items-center gap-4 border-b border-line px-4 py-4 last:border-0"
    >
      <div
        v-for="c in (cols ?? 4)" :key="c"
        class="skeleton h-4"
        :class="c === (cols ?? 4) ? 'ml-auto w-16' : c === 1 ? 'w-32' : 'w-40 flex-1'"
      />
    </div>
  </div>
</template>
