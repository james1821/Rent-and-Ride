<script setup lang="ts">
const { fetchProducts, fetchCategories, fetchBrands } = useCatalog()

// Default hero, used when the admin hasn't created any "hero" banners.
const defaultSlides = [
  {
    title: 'Go anywhere, anytime. Rent a car or motorcycle today.',
    description: 'Cars and motorcycles for daily, weekly and monthly rental. Live availability, clear rates, pickup or delivery.',
    ctaLabel: 'Browse Cars',
    ctaHref: '/catalog?vehicleType=car',
    secondaryCtaLabel: 'Browse Motorcycles',
    secondaryCtaHref: '/catalog?vehicleType=motorcycle'
  }
]

// Hero slides are managed in Admin → Banners (placement: hero).
const { data: heroSlides } = await useAsyncData('home-hero', async () => {
  try {
    const res = await $fetch<{ success: boolean; data: any[] }>('/api/banners', { query: { placement: 'hero' } })
    return res.success && res.data.length ? res.data : defaultSlides
  } catch {
    return defaultSlides
  }
})

const { data: categories } = await useAsyncData('home-categories', () => fetchCategories().catch(() => []))
const { data: brands } = await useAsyncData('home-brands', () => fetchBrands())
const { data: featured, pending: loadingFeatured } = await useAsyncData('home-featured', () =>
  fetchProducts({ featuredOnly: true, pageSize: 8 })
)

const perks = [
  { icon: 'i-heroicons-calendar-days', title: 'Live availability', text: 'See exactly which dates are free before you book.' },
  { icon: 'i-heroicons-banknotes', title: 'Clear daily, weekly & monthly rates', text: 'Longer rentals unlock our weekly and monthly pricing automatically.' },
  { icon: 'i-heroicons-truck', title: 'Pickup or delivery', text: 'Collect in store or have your vehicle brought to you.' }
]
</script>

<template>
  <div>
    <HomeHeroSlider :slides="heroSlides ?? defaultSlides" />

    <!-- Brand marquee (from the vehicles actually in the catalog) -->
    <div v-if="brands?.length" class="overflow-hidden border-b border-line bg-white py-5" aria-hidden="true">
      <div class="flex w-max animate-marquee gap-12 whitespace-nowrap font-display text-2xl font-black uppercase tracking-tight text-ink/25">
        <span v-for="n in 2" :key="n" class="flex gap-12">
          <span v-for="b in [...brands, ...brands]" :key="`${n}-${b}`">{{ b }}</span>
        </span>
      </div>
    </div>

    <!-- Vehicle type tiles -->
    <section class="container-page py-16 sm:py-24">
      <div class="grid gap-5 md:grid-cols-2">
        <NuxtLink to="/catalog?vehicleType=car" class="on-dark card-lift group relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-2xl border border-ink bg-ink p-8 text-white sm:min-h-[340px]">
          <div class="speed-lines absolute inset-0" />
          <p class="eyebrow relative !text-volt">Four wheels</p>
          <div class="relative flex items-end justify-between">
            <h2 class="text-6xl sm:text-8xl">Cars</h2>
            <span class="flex h-14 w-14 items-center justify-center rounded-full bg-white text-ink transition group-hover:bg-volt group-hover:rotate-45"><UIcon name="i-heroicons-arrow-up-right" class="h-6 w-6" /></span>
          </div>
        </NuxtLink>
        <NuxtLink to="/catalog?vehicleType=motorcycle" class="card-lift group relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-2xl border-2 border-ink bg-volt p-8 text-ink sm:min-h-[340px]">
          <p class="eyebrow !text-ink">Two wheels</p>
          <div class="flex items-end justify-between">
            <h2 class="text-5xl sm:text-7xl">Motorcycles</h2>
            <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink text-white transition group-hover:rotate-45"><UIcon name="i-heroicons-arrow-up-right" class="h-6 w-6" /></span>
          </div>
        </NuxtLink>
      </div>
    </section>

    <section v-if="categories?.length" class="container-page pb-16 sm:pb-24">
      <div class="mb-8 flex items-end justify-between gap-4">
        <h2 class="text-4xl sm:text-5xl">Browse by category</h2>
        <NuxtLink to="/catalog" class="shrink-0 text-sm font-bold text-ink underline-offset-4 hover:underline">View all →</NuxtLink>
      </div>
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <HomeCategoryCard
          v-for="cat in categories" :key="cat.id"
          :name="cat.name"
          :image-url="cat.imageUrl"
          :href="`/catalog?categoryId=${cat.id}`"
        />
      </div>
    </section>

    <section class="container-page pb-16 sm:pb-24">
      <div class="mb-8 flex items-end justify-between gap-4">
        <h2 class="text-4xl sm:text-5xl">Popular right now</h2>
        <NuxtLink to="/catalog?featuredOnly=true" class="shrink-0 text-sm font-bold text-ink underline-offset-4 hover:underline">View all →</NuxtLink>
      </div>
      <ProductGridSkeleton v-if="loadingFeatured" />
      <div v-else-if="featured?.items.length" class="grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <ProductCard v-for="p in featured.items" :key="p.id" :product="p" />
      </div>
      <div v-else class="rounded-xl border border-dashed border-line py-16 text-center">
        <p class="text-ink-muted">No featured vehicles yet.</p>
        <NuxtLink to="/catalog" class="mt-3 inline-block text-sm font-bold text-ink underline-offset-4 hover:underline">Browse all vehicles →</NuxtLink>
      </div>
    </section>

    <section class="container-page pb-16 sm:pb-24">
      <div class="grid gap-5 md:grid-cols-3">
        <div v-for="perk in perks" :key="perk.title" class="rounded-xl border border-line bg-surface p-6 shadow-card transition hover:border-ink">
          <span class="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-volt"><UIcon :name="perk.icon" class="h-6 w-6" /></span>
          <h5 class="mt-5 text-lg">{{ perk.title }}</h5>
          <p class="mt-2 text-sm text-ink-muted">{{ perk.text }}</p>
        </div>
      </div>
    </section>

    <HomeHowItWorks />
  </div>
</template>
