<script setup lang="ts">
const { isAuthenticated, isAdmin, currentUser, currentRole, logout } = useAuth()
const { itemCount, watchCart, stopWatching: stopCart } = useCart()
const { watchFavorites, stopWatching: stopFavorites, productIds } = useFavorites()
const { searchSuggestions } = useCatalog()
const route = useRoute()
const siteName = useRuntimeConfig().public.siteName

const searchQuery = ref('')
const searchResults = ref<{ products: any[]; categories: any[] }>({ products: [], categories: [] })
const showResults = ref(false)
const menuOpen = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

watch(() => route.fullPath, () => { menuOpen.value = false })
watch(menuOpen, (open) => { if (import.meta.client) document.documentElement.style.overflow = open ? 'hidden' : '' })

watch(searchQuery, (q) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (q.trim().length < 2) { searchResults.value = { products: [], categories: [] }; showResults.value = false; return }
  searchTimeout = setTimeout(async () => {
    searchResults.value = await searchSuggestions(q).catch(() => ({ products: [], categories: [] }))
    showResults.value = true
  }, 220)
})

// Start the cart/favorites listeners only once the account profile is confirmed
// (currentRole is set after /api/customers/me succeeds), otherwise Firestore rules deny them.
watch([currentUser, currentRole], ([user, role]) => {
  if (user && role) { watchCart(); watchFavorites() } else { stopCart(); stopFavorites() }
}, { immediate: true })

// Vehicle-type links work regardless of how the admin names categories.
const navLinks = [
  { label: 'Cars', to: '/catalog?vehicleType=car' },
  { label: 'Motorcycles', to: '/catalog?vehicleType=motorcycle' },
  { label: 'All Vehicles', to: '/catalog' }
]
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-md">
    <div class="container-page flex h-16 items-center gap-4 lg:gap-8">
      <button class="-ml-2 rounded-full p-2 text-ink hover:bg-sunken lg:hidden" aria-label="Open menu" @click="menuOpen = true">
        <UIcon name="i-heroicons-bars-3" class="h-6 w-6" />
      </button>

      <NuxtLink to="/" class="flex shrink-0 items-center gap-2.5 font-display text-xl font-black tracking-tight text-ink">
        <span class="brand-dot" />
        {{ siteName }}
      </NuxtLink>

      <nav class="hidden items-center gap-1 text-sm font-semibold lg:flex" aria-label="Main">
        <NuxtLink
          v-for="link in navLinks" :key="link.label" :to="link.to"
          class="rounded-full px-4 py-2 text-ink-muted transition hover:bg-ink hover:text-white"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="relative ml-auto hidden max-w-sm flex-1 md:block">
        <UIcon name="i-heroicons-magnifying-glass" class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          v-model="searchQuery"
          type="search"
          aria-label="Search vehicles"
          placeholder="Search Honda, Vios, scooter…"
          class="w-full rounded-full border border-line bg-white py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint transition focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
          @focus="showResults = searchResults.products.length > 0 || searchResults.categories.length > 0"
          @blur="() => setTimeout(() => (showResults = false), 150)"
        >

        <div
          v-if="showResults"
          class="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-xl border border-line bg-white shadow-lift animate-fade-in"
        >
          <div v-if="searchResults.products.length" class="p-2">
            <p class="eyebrow px-2 py-1">Vehicles</p>
            <NuxtLink
              v-for="p in searchResults.products" :key="p.id" :to="`/product/${p.slug}`"
              class="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-sunken"
            >
              <img v-if="p.image" :src="p.image" :alt="p.name" class="h-10 w-14 rounded object-cover">
              <span class="flex-1">
                <span class="block font-semibold text-ink">{{ p.name }}</span>
                <span class="block text-xs text-ink-muted">{{ p.brand }}</span>
              </span>
              <span class="text-xs font-bold text-ink">₱{{ p.dailyPrice.toLocaleString() }}/day</span>
            </NuxtLink>
          </div>
          <div v-if="searchResults.categories.length" class="border-t border-line p-2">
            <p class="eyebrow px-2 py-1">Categories</p>
            <NuxtLink
              v-for="c in searchResults.categories" :key="c.id" :to="`/catalog?categoryId=${c.id}`"
              class="block rounded-lg px-2 py-2 text-sm font-medium text-ink hover:bg-sunken"
            >
              {{ c.name }}
            </NuxtLink>
          </div>
          <p v-if="!searchResults.products.length && !searchResults.categories.length" class="p-4 text-sm text-ink-muted">
            No matches yet — keep typing.
          </p>
        </div>
      </div>

      <div class="ml-auto flex items-center gap-1 sm:gap-2 md:ml-0">
        <NuxtLink to="/favorites" class="relative rounded-full p-2 text-ink transition hover:bg-sunken" aria-label="Favorites">
          <UIcon name="i-heroicons-heart" class="h-6 w-6" />
          <span v-if="productIds.length" class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">
            {{ productIds.length }}
          </span>
        </NuxtLink>

        <NuxtLink to="/cart" class="relative rounded-full p-2 text-ink transition hover:bg-sunken" aria-label="Cart">
          <UIcon name="i-heroicons-shopping-bag" class="h-6 w-6" />
          <span v-if="itemCount" class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">
            {{ itemCount }}
          </span>
        </NuxtLink>

        <NuxtLink v-if="isAdmin" to="/admin" class="hidden rounded-full border border-ink px-4 py-1.5 text-sm font-bold text-ink transition hover:bg-ink hover:text-white sm:block">
          Admin
        </NuxtLink>

        <NuxtLink v-if="!isAuthenticated" to="/login" class="btn-primary !px-5 !py-2">
          Sign In
        </NuxtLink>
        <button v-else class="hidden rounded-full px-3 py-2 text-sm font-semibold text-ink-muted transition hover:text-ink sm:block" @click="logout">
          Sign Out
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    <Teleport to="body">
      <div v-if="menuOpen" class="on-dark fixed inset-0 z-[60] flex flex-col bg-ink text-white animate-fade-in lg:hidden">
        <div class="flex h-16 items-center justify-between px-4">
          <span class="flex items-center gap-2.5 font-display text-xl font-black"><span class="brand-dot" /> {{ siteName }}</span>
          <button class="rounded-full p-2 hover:bg-white/10" aria-label="Close menu" @click="menuOpen = false">
            <UIcon name="i-heroicons-x-mark" class="h-6 w-6" />
          </button>
        </div>
        <nav class="flex-1 space-y-1 overflow-y-auto px-4 pt-6" aria-label="Mobile">
          <NuxtLink
            v-for="link in navLinks" :key="link.label" :to="link.to"
            class="block border-b border-white/10 py-4 font-display text-4xl font-extrabold uppercase tracking-tight transition hover:text-volt"
          >
            {{ link.label }}
          </NuxtLink>
          <div class="grid gap-3 pt-8 text-lg font-semibold text-white/80">
            <NuxtLink to="/favorites">Favorites</NuxtLink>
            <NuxtLink to="/cart">Cart</NuxtLink>
            <NuxtLink v-if="isAuthenticated" to="/account/rentals">My Rentals</NuxtLink>
            <NuxtLink v-if="isAdmin" to="/admin">Admin</NuxtLink>
            <button v-if="isAuthenticated" class="text-left" @click="logout">Sign Out</button>
            <NuxtLink v-else to="/login" class="text-volt">Sign In</NuxtLink>
          </div>
        </nav>
        <div class="p-4">
          <NuxtLink to="/catalog" class="btn-light w-full">Browse all vehicles</NuxtLink>
        </div>
      </div>
    </Teleport>
  </header>
</template>
