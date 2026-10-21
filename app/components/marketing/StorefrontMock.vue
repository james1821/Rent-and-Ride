<script setup lang="ts">
// Code-rendered preview of the customer-facing storefront (catalog).
// Pulls the first 3 featured vehicles from the real API so images, names and
// prices stay in sync with what is managed in Admin. Falls back to the static
// list below while loading or if the API is unavailable.
import type { Product } from '~/types'

const { fetchProducts } = useCatalog()
const { format } = useCurrency()

const fallbackVehicles = [
  { name: 'Toyota Vios 1.3', type: 'Sedan', price: '₱1,800', image: '/uploads/products/1790826167239-3f88eb95.jpg' },
  { name: 'Honda Click 125', type: 'Scooter', price: '₱800', image: '/uploads/products/1790826021198-4bd679f4.jpg' },
  { name: 'Honda CBR150R', type: 'Sport bike', price: '₱1,800', image: '/uploads/products/1790827930521-dce5c652.png' }
]

// Client-only and non-blocking: the landing page renders instantly with the
// fallback, then swaps in live catalog data.
const { data } = usePageData(
  'marketing-storefront-preview',
  () => fetchProducts({ featuredOnly: true, pageSize: 3 }),
  { server: false }
)

function typeLabel(p: Product) {
  const enriched = p as Product & { categoryName?: string; subcategoryName?: string }
  if (enriched.subcategoryName) return enriched.subcategoryName
  if (enriched.categoryName) return enriched.categoryName
  if (p.vehicle?.type === 'car') return 'Car'
  if (p.vehicle?.type === 'motorcycle') return 'Motorcycle'
  return 'Vehicle'
}

const vehicles = computed(() => {
  const items = data.value?.items ?? []
  if (!items.length) return fallbackVehicles
  return items.slice(0, 3).map((p) => ({
    name: p.name,
    type: typeLabel(p),
    price: format(p.pricing.daily),
    image: p.images?.[0] || ''
  }))
})
</script>

<template>
  <div class="bg-canvas text-left">
    <div class="flex items-center gap-4 border-b border-line bg-canvas px-4 py-2.5">
      <span class="flex items-center gap-1.5 font-display text-sm font-black tracking-tight text-ink">
        <span class="brand-dot" /> RentRide
      </span>
      <span class="hidden gap-1 sm:flex">
        <span v-for="t in ['Cars', 'Motorcycles', 'All Vehicles']" :key="t" class="rounded-full px-2.5 py-1 text-[10px] font-semibold text-ink-muted">{{ t }}</span>
      </span>
      <span class="ml-auto flex items-center gap-2">
        <span class="h-6 w-6 rounded-full bg-sunken" />
        <span class="h-6 w-6 rounded-full bg-sunken" />
      </span>
    </div>

    <div class="bg-ink px-4 py-6 text-white">
      <p class="font-mono text-[9px] uppercase tracking-[0.18em] text-volt">Fleet</p>
      <p class="mt-1 font-display text-2xl font-extrabold uppercase tracking-tightest">All vehicles</p>
      <div class="mt-3 flex flex-wrap gap-1.5">
        <span v-for="c in ['All', 'Cars', 'Motorcycles']" :key="c" class="rounded-full border px-3 py-1 text-[10px] font-bold" :class="c === 'All' ? 'border-volt bg-volt text-ink' : 'border-white/30 text-white'">{{ c }}</span>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
      <div v-for="(v, i) in vehicles" :key="i" class="overflow-hidden rounded-lg border border-line bg-surface">
        <div class="aspect-[4/3] bg-sunken">
          <img v-if="v.image" :src="v.image" :alt="v.name" class="h-full w-full object-cover" loading="lazy">
          <div v-else class="flex h-full w-full items-center justify-center text-ink-faint">
            <UIcon name="i-heroicons-truck" class="h-7 w-7" />
          </div>
        </div>
        <div class="p-2.5">
          <p class="truncate text-[11px] font-semibold text-ink">{{ v.name }}</p>
          <div class="mt-1 flex items-center justify-between gap-2">
            <span class="truncate text-[9px] uppercase tracking-wide text-ink-muted">{{ v.type }}</span>
            <span class="shrink-0 text-[11px] font-bold text-ink">{{ v.price }}<span class="text-[9px] font-medium text-ink-muted">/day</span></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
