<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
const route = useRoute()
const productId = route.params.id as string
</script>

<template>
  <div>
    <AdminTopbar>
      <template #title><h1 class="font-display text-lg font-bold text-ink">Edit Vehicle</h1></template>
    </AdminTopbar>
    <div class="space-y-8 p-6">
      <AdminProductForm :product-id="productId" />
      <div class="max-w-3xl border-t border-line pt-6">
        <AdminInventoryManager :product-id="productId" />
      </div>
    </div>
  </div>
</template>
