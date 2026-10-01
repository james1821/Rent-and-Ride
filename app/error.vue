<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; statusMessage?: string } }>()
function goHome() { clearError({ redirect: '/' }) }
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center">
    <p class="eyebrow">ERROR {{ error.statusCode }}</p>
    <h1 class="mt-3 text-5xl text-ink sm:text-7xl">
      {{ error.statusCode === 404 ? 'Page Not Found' : 'Something Went Wrong' }}
    </h1>
    <p class="mt-2 max-w-md text-ink-muted">
      {{ error.statusMessage || 'The page you\u2019re looking for doesn\u2019t exist or has moved.' }}
    </p>
    <button class="btn-primary mt-8" @click="goHome">
      Back to Home
    </button>
  </div>
</template>
