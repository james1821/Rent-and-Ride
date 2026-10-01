<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { productIds, watchFavorites } = useFavorites()
const { currentUser, currentRole } = useAuth()
const { fetchProducts } = useCatalog()

watch(currentRole, (r) => { if (r) watchFavorites() }, { immediate: true })

const products = ref<any[]>([])
const loading = ref(false)

watch(productIds, async (ids) => {
  if (ids.length === 0) { products.value = []; return }
  loading.value = true
  try {
    // Small catalogs make this practical; fetch broadly and filter client-side
    // rather than adding a dedicated "products by ID list" endpoint.
    const result = await fetchProducts({ pageSize: 48 })
    products.value = result.items.filter((p) => ids.includes(p.id))
  } finally {
    loading.value = false
  }
}, { immediate: true })
</script>

<template>
  <div class="container-page py-10">
    <h1 class="text-4xl text-ink sm:text-5xl">Your Favorites</h1>

    <ProductGridSkeleton v-if="loading" class="mt-8" />

    <div v-else-if="products.length === 0" class="mt-16 rounded border border-dashed border-line py-20 text-center">
      <p class="text-ink-muted">You haven't favorited any vehicles yet.</p>
      <NuxtLink to="/catalog" class="mt-3 inline-block text-sm font-semibold text-ink underline-offset-4 hover:underline">Browse vehicles →</NuxtLink>
    </div>

    <div v-else class="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
      <ProductCard v-for="p in products" :key="p.id" :product="p" />
    </div>
  </div>
</template>
