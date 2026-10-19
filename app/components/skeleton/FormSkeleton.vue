<script setup lang="ts">
defineProps<{ rows?: number }>()
</script>

<template>
  <div class="space-y-5">
    <div v-for="i in (rows ?? 5)" :key="i">
      <div class="skeleton h-3 w-28" />
      <div class="skeleton mt-2 h-10 w-full rounded" />
    </div>
  </div>
</template>
