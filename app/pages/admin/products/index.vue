<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { apiFetch } = useApi()
const { format } = useCurrency()
const search = ref('')

const { data, refresh, pending } = await useAsyncData('admin-products', () =>
  apiFetch<any>('/api/products', { query: { pageSize: 100 } }),
  { server: false }
)

const filtered = computed(() => {
  if (!search.value) return data.value?.items ?? []
  const q = search.value.toLowerCase()
  return (data.value?.items ?? []).filter((p: any) =>
    p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
  )
})

async function archiveProduct(id: string) {
  if (!confirm('Archive this vehicle? It will be hidden from the storefront but kept for rental history.')) return
  await apiFetch(`/api/products/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div>
    <AdminTopbar>
      <template #title><h1 class="font-display text-lg font-bold text-ink">Vehicles</h1></template>
    </AdminTopbar>

    <div class="p-6">
      <div class="mb-4 flex justify-between gap-4">
        <input v-model="search" placeholder="Search by name, plate/SKU, or brand…" class="w-full max-w-sm rounded border border-line bg-surface px-3 py-2 text-sm text-ink">
        <NuxtLink to="/admin/products/new" class="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink-soft">
          + New Vehicle
        </NuxtLink>
      </div>

      <div v-if="pending" class="text-ink-muted">Loading…</div>

      <table v-else class="w-full overflow-hidden rounded border border-line bg-surface text-sm">
        <thead>
          <tr class="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
            <th class="p-3">Vehicle</th><th class="p-3">Type</th><th class="p-3">SKU</th><th class="p-3">Daily</th>
            <th class="p-3">Stock</th><th class="p-3">Status</th><th class="p-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-for="p in filtered" :key="p.id">
            <td class="flex items-center gap-3 p-3">
              <img v-if="p.images?.[0]" :src="p.images[0]" class="h-10 w-14 rounded object-cover" :alt="p.name">
              <div>
                <p class="text-ink">{{ p.name }}</p>
                <p class="text-xs text-ink-muted">{{ p.brand }}{{ p.vehicle?.year ? ` · ${p.vehicle.year}` : '' }}</p>
              </div>
            </td>
            <td class="p-3 capitalize text-ink">{{ p.vehicle?.type ?? '—' }}</td>
            <td class="p-3 font-mono text-xs text-ink-muted">
              {{ p.sku }}
            </td>
            <td class="p-3 text-ink">{{ format(p.pricing.daily) }}</td>
            <td class="p-3 text-ink">{{ p.quantityAvailable }} / {{ p.quantityTotal }}</td>
            <td class="p-3">
              <span :class="p.status === 'active' ? 'text-ok' : 'text-ink-muted'">{{ p.status }}</span>
            </td>
            <td class="p-3 text-right">
              <NuxtLink :to="`/admin/products/${p.id}`" class="font-semibold text-ink underline-offset-4 hover:underline">Edit</NuxtLink>
              <button v-if="p.status !== 'archived'" class="ml-3 text-danger hover:underline" @click="archiveProduct(p.id)">Archive</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
