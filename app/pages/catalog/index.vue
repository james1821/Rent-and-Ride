<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { fetchProducts, fetchCategories, fetchSubcategories, fetchBrands } = useCatalog()

const filters = reactive({
  q: (route.query.q as string) ?? '',
  categoryId: (route.query.categoryId as string) ?? '',
  subcategoryId: (route.query.subcategoryId as string) ?? '',
  brand: (route.query.brand as string) ?? '',
  vehicleType: ((route.query.vehicleType as string) ?? '') as '' | 'car' | 'motorcycle',
  transmission: (route.query.transmission as string) ?? '',
  fuelType: (route.query.fuelType as string) ?? '',
  minSeats: route.query.minSeats ? Number(route.query.minSeats) : undefined,
  minPrice: route.query.minPrice ? Number(route.query.minPrice) : undefined,
  maxPrice: route.query.maxPrice ? Number(route.query.maxPrice) : undefined,
  availableOnly: route.query.availableOnly === 'true',
  featuredOnly: route.query.featuredOnly === 'true',
  sort: (route.query.sort as any) ?? 'newest',
  page: route.query.page ? Number(route.query.page) : 1
})

const { data: categories } = await useAsyncData('catalog-categories', () => fetchCategories())
const { data: subcategories } = await useAsyncData(
  () => `catalog-subcategories-${filters.categoryId}`,
  () => fetchSubcategories(filters.categoryId || undefined),
  { watch: [() => filters.categoryId] }
)

const { data: result, pending, refresh } = await useAsyncData(
  'catalog-products',
  () => fetchProducts({
    q: filters.q || undefined,
    categoryId: filters.categoryId || undefined,
    subcategoryId: filters.subcategoryId || undefined,
    brand: filters.brand || undefined,
    vehicleType: filters.vehicleType || undefined,
    transmission: filters.transmission || undefined,
    fuelType: filters.fuelType || undefined,
    minSeats: filters.minSeats,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    availableOnly: filters.availableOnly || undefined,
    featuredOnly: filters.featuredOnly || undefined,
    sort: filters.sort,
    page: filters.page,
    pageSize: 12
  }),
  { watch: [filters] }
)

// Any filter change (but not a page change) returns to page 1.
watch(() => JSON.stringify({ ...filters, page: 0 }), () => { if (filters.page !== 1) filters.page = 1 })

watch(filters, () => {
  router.replace({ query: { ...filters, page: filters.page } as any })
}, { deep: true })

const { data: brands } = await useAsyncData('catalog-brands', () => fetchBrands())
const filtersOpen = ref(false)
const activeCount = computed(() => [filters.categoryId, filters.subcategoryId, filters.brand, filters.vehicleType, filters.transmission, filters.fuelType, filters.minSeats, filters.minPrice, filters.maxPrice, filters.availableOnly, filters.q].filter(Boolean).length)

function resetFilters() {
  filters.q = ''
  filters.categoryId = ''
  filters.subcategoryId = ''
  filters.brand = ''
  filters.vehicleType = ''
  filters.transmission = ''
  filters.fuelType = ''
  filters.minSeats = undefined
  filters.minPrice = undefined
  filters.maxPrice = undefined
  filters.availableOnly = false
  filters.featuredOnly = false
  filters.sort = 'newest'
  filters.page = 1
}
</script>

<template>
  <div>
    <section class="on-dark speed-lines bg-ink text-white">
      <div class="container-page py-12 sm:py-16">
        <p class="eyebrow !text-volt">Fleet</p>
        <h1 class="mt-3 text-5xl sm:text-7xl">
          {{ filters.vehicleType === 'car' ? 'Cars' : filters.vehicleType === 'motorcycle' ? 'Motorcycles' : 'All vehicles' }}
        </h1>
        <div class="mt-8 flex flex-wrap items-center gap-2">
          <button
            v-for="t in [{ v: '', l: 'All' }, { v: 'car', l: 'Cars' }, { v: 'motorcycle', l: 'Motorcycles' }]" :key="t.v"
            class="rounded-full border px-5 py-2 text-sm font-bold transition"
            :class="filters.vehicleType === t.v ? 'border-volt bg-volt text-ink' : 'border-white/30 text-white hover:border-white'"
            @click="filters.vehicleType = t.v as any"
          >{{ t.l }}</button>
        </div>
      </div>
    </section>

    <div class="container-page py-10">
      <div class="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside>
          <button class="btn-outline mb-4 w-full lg:hidden" @click="filtersOpen = !filtersOpen">
            <UIcon name="i-heroicons-adjustments-horizontal" class="h-5 w-5" />
            Filters<span v-if="activeCount"> ({{ activeCount }})</span>
          </button>

          <div class="space-y-5 rounded-xl border border-line bg-surface p-5" :class="filtersOpen ? 'block' : 'hidden lg:block'">
            <div>
              <label class="eyebrow" for="f-q">Search</label>
              <input id="f-q" v-model.lazy.trim="filters.q" type="search" placeholder="Name, brand, model…" class="input mt-2">
            </div>

            <div>
              <label class="eyebrow" for="f-cat">Category</label>
              <select id="f-cat" v-model="filters.categoryId" class="input mt-2" @change="filters.subcategoryId = ''">
                <option value="">All categories</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div v-if="subcategories?.length">
              <label class="eyebrow" for="f-sub">Subcategory</label>
              <select id="f-sub" v-model="filters.subcategoryId" class="input mt-2">
                <option value="">All subcategories</option>
                <option v-for="s in subcategories" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>

            <div v-if="brands?.length">
              <label class="eyebrow" for="f-brand">Brand</label>
              <select id="f-brand" v-model="filters.brand" class="input mt-2">
                <option value="">All brands</option>
                <option v-for="b in brands" :key="b" :value="b">{{ b }}</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="eyebrow" for="f-trans">Transmission</label>
                <select id="f-trans" v-model="filters.transmission" class="input mt-2">
                  <option value="">Any</option>
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                  <option value="semi-automatic">Semi-auto</option>
                </select>
              </div>
              <div>
                <label class="eyebrow" for="f-fuel">Fuel</label>
                <select id="f-fuel" v-model="filters.fuelType" class="input mt-2">
                  <option value="">Any</option>
                  <option value="gasoline">Gasoline</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                </select>
              </div>
            </div>

            <div>
              <label class="eyebrow" for="f-seats">Minimum seats</label>
              <select id="f-seats" v-model.number="filters.minSeats" class="input mt-2">
                <option :value="undefined">Any</option>
                <option v-for="n in [2, 4, 5, 7, 9]" :key="n" :value="n">{{ n }}+</option>
              </select>
            </div>

            <div>
              <span class="eyebrow">Daily price (₱)</span>
              <div class="mt-2 flex items-center gap-2">
                <input v-model.number="filters.minPrice" type="number" min="0" placeholder="Min" aria-label="Minimum daily price" class="input">
                <span class="text-ink-muted">–</span>
                <input v-model.number="filters.maxPrice" type="number" min="0" placeholder="Max" aria-label="Maximum daily price" class="input">
              </div>
            </div>

            <label class="flex items-center gap-2 text-sm font-medium text-ink">
              <input v-model="filters.availableOnly" type="checkbox" class="h-4 w-4 accent-black">
              Available only
            </label>

            <button class="text-sm font-bold text-ink underline-offset-4 hover:underline" @click="resetFilters">Reset filters</button>
          </div>
        </aside>

        <div>
          <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p class="text-sm font-medium text-ink-muted" aria-live="polite">
              {{ result?.pagination.total ?? 0 }} vehicle{{ result?.pagination.total === 1 ? '' : 's' }}
            </p>
            <select v-model="filters.sort" aria-label="Sort" class="input !w-auto">
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A–Z</option>
            </select>
          </div>

          <ProductGridSkeleton v-if="pending" :count="6" />

          <div v-else-if="result?.items.length" class="grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 xl:grid-cols-3">
            <ProductCard v-for="p in result.items" :key="p.id" :product="p" />
          </div>

          <div v-else class="rounded-xl border border-dashed border-line py-20 text-center">
            <UIcon name="i-heroicons-truck" class="mx-auto h-10 w-10 text-ink-faint" />
            <p class="mt-3 font-semibold text-ink">No vehicles match these filters.</p>
            <button class="btn-outline mt-5" @click="resetFilters">Clear filters</button>
          </div>

          <nav v-if="result && result.pagination.totalPages > 1" class="mt-10 flex flex-wrap justify-center gap-2" aria-label="Pagination">
            <button
              v-for="p in result.pagination.totalPages" :key="p"
              class="h-10 w-10 rounded-full text-sm font-bold transition"
              :class="p === filters.page ? 'bg-ink text-white' : 'text-ink hover:bg-sunken'"
              :aria-current="p === filters.page ? 'page' : undefined"
              @click="filters.page = p"
            >
              {{ p }}
            </button>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>
