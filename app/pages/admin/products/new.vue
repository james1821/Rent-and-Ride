<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
</script>

<template>
  <div>
    <AdminTopbar>
      <template #title><h1 class="font-display text-lg font-bold text-ink">New Vehicle</h1></template>
    </AdminTopbar>
    <div class="space-y-8 p-6">
      <AdminProductForm />
    </div>
  </div>
</template>
