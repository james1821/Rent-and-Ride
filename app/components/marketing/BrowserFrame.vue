<script setup lang="ts">
// A neutral browser-chrome wrapper used to present UI previews on the landing
// page. Purely presentational, no assets required.
defineProps<{ url?: string }>()
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
    <div class="flex items-center gap-2 border-b border-line bg-sunken px-4 py-2.5">
      <span class="h-2.5 w-2.5 rounded-full bg-ink/15" />
      <span class="h-2.5 w-2.5 rounded-full bg-ink/15" />
      <span class="h-2.5 w-2.5 rounded-full bg-ink/15" />
      <span class="ml-3 truncate rounded-full bg-white px-3 py-1 font-mono text-[10px] text-ink-muted">{{ url }}</span>
    </div>
    <slot />
  </div>
</template>
