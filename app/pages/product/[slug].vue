<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

const { fetchProductBySlug } = useCatalog()
const { checkAvailability, fetchCalendar } = useAvailability()
const { addItem } = useCart()
const { isFavorite, toggleFavorite } = useFavorites()
const { isAuthenticated } = useAuth()
const { format } = useCurrency()
const toast = useToast()

const { data, pending, error } = await useAsyncData(`product-${slug}`, () => fetchProductBySlug(slug))
if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Vehicle not found' })
}

const product = computed(() => data.value!.product)
const related = computed(() => data.value!.related)

const activeImage = ref(0)
watch(product, (p) => { if (p) activeImage.value = 0 })

const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
const startDate = ref(tomorrow)
const endDate = ref(tomorrow)
const quantity = ref(1)

const availability = ref<{ isAvailable: boolean; availableQuantity: number } | null>(null)
const checkingAvailability = ref(false)
const addingToCart = ref(false)

async function runAvailabilityCheck() {
  if (!startDate.value || !endDate.value || endDate.value < startDate.value) {
    availability.value = null
    return
  }
  checkingAvailability.value = true
  try {
    availability.value = await checkAvailability(product.value.id, startDate.value, endDate.value, quantity.value)
  } catch {
    availability.value = null
  } finally {
    checkingAvailability.value = false
  }
}
watch([startDate, endDate, quantity], runAvailabilityCheck, { immediate: true })

const disabledDates = ref<Set<string>>(new Set())
onMounted(async () => {
  const from = tomorrow
  const to = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)
  try {
    const calendar = await fetchCalendar(product.value.id, from, to)
    disabledDates.value = new Set(Object.entries(calendar.days).filter(([, qty]) => qty <= 0).map(([day]) => day))
  } catch {
    disabledDates.value = new Set()
  }
})

const specChips = computed(() => vehicleSpecChips(product.value.vehicle))
const imageBroken = ref(false)
watch(activeImage, () => { imageBroken.value = false })

const durationDays = computed(() => {
  if (!startDate.value || !endDate.value) return 0
  const ms = new Date(endDate.value).getTime() - new Date(startDate.value).getTime()
  return Math.round(ms / 86400000) + 1
})
const estimatedTotal = computed(() => product.value.pricing.daily * durationDays.value * quantity.value)

async function onAddToCart() {
  if (!isAuthenticated.value) {
    toast.add({ title: 'Sign in to book this vehicle', color: 'red' })
    return navigateTo(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
  }
  if (!availability.value?.isAvailable) {
    toast.add({ title: 'This vehicle is not available for those dates', color: 'red' })
    return
  }
  addingToCart.value = true
  try {
    await addItem({
      productId: product.value.id,
      quantity: quantity.value,
      startDate: startDate.value,
      endDate: endDate.value,
      addedAt: new Date().toISOString()
    })
    toast.add({ title: 'Added to cart', color: 'green' })
  } catch (err: any) {
    toast.add({ title: err.message ?? 'Could not add to cart', color: 'red' })
  } finally {
    addingToCart.value = false
  }
}

async function onToggleFavorite() {
  if (!isAuthenticated.value) {
    toast.add({ title: 'Sign in to save favorites', color: 'red' })
    await navigateTo(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  try {
    await toggleFavorite(product.value.id)
  } catch (err: any) {
    toast.add({ title: err.message ?? 'Could not update favorites', color: 'red' })
  }
}
</script>

<template>
  <div v-if="pending" class="container-page py-20 text-center text-ink-muted">Loading...</div>

  <div v-else class="container-page py-8 sm:py-12">
    <NuxtLink to="/catalog" class="inline-flex items-center gap-1 text-sm font-bold text-ink-muted transition hover:text-ink">
      <UIcon name="i-heroicons-arrow-left" class="h-4 w-4" /> All vehicles
    </NuxtLink>

    <div class="mt-6 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
      <!-- Gallery -->
      <div>
        <div class="aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-sunken shadow-card">
          <img
            v-if="product.images?.[activeImage] && !imageBroken"
            :src="product.images[activeImage]" :alt="product.name" class="h-full w-full object-cover"
            @error="imageBroken = true"
          >
          <div v-else class="flex h-full w-full items-center justify-center text-ink-faint"><UIcon name="i-heroicons-truck" class="h-16 w-16" /></div>
        </div>
        <div v-if="product.images.length > 1" class="mt-3 flex flex-wrap gap-3">
          <button
            v-for="(img, i) in product.images" :key="img"
            class="h-16 w-24 overflow-hidden rounded-lg border-2 transition"
            :class="i === activeImage ? 'border-ink' : 'border-transparent opacity-60 hover:opacity-100'"
            :aria-label="`Show photo ${i + 1}`"
            @click="activeImage = i"
          >
            <img :src="img" :alt="`${product.name} photo ${i + 1}`" class="h-full w-full object-cover">
          </button>
        </div>

        <!-- Vehicle specs -->
        <div v-if="specChips.length || product.specifications.length" class="mt-10">
          <h2 class="text-3xl">Specs</h2>
          <dl v-if="specChips.length" class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div v-for="c in specChips" :key="c.key" class="rounded-xl border border-line bg-surface p-4">
              <UIcon :name="c.icon" class="h-5 w-5 text-ink-muted" />
              <dt class="eyebrow mt-3">{{ c.label }}</dt>
              <dd class="mt-0.5 font-display text-lg font-bold text-ink">{{ c.value }}</dd>
            </div>
          </dl>
          <dl v-if="product.specifications.length" class="mt-4 divide-y divide-line border-y border-line">
            <div v-for="spec in product.specifications" :key="spec.label" class="flex justify-between gap-4 py-3 text-sm">
              <dt class="text-ink-muted">{{ spec.label }}</dt>
              <dd class="text-right font-medium text-ink">{{ spec.value }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Details + booking -->
      <div class="lg:sticky lg:top-24 lg:self-start">
        <p class="eyebrow">{{ product.brand }}<template v-if="product.vehicle?.model"> · {{ product.vehicle.model }}</template></p>
        <h1 class="mt-2 text-4xl sm:text-5xl">{{ product.name }}</h1>

        <div class="mt-4 flex flex-wrap items-center gap-3">
          <span
            class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
            :class="product.quantityAvailable > 0 ? 'bg-ink text-white' : 'bg-sunken text-ink-muted'"
          >
            <span class="h-1.5 w-1.5 rounded-full" :class="product.quantityAvailable > 0 ? 'bg-volt' : 'bg-ink-faint'" />
            {{ product.quantityAvailable > 0 ? 'Available' : 'Fully booked' }}
          </span>
          <span v-if="product.rating?.count" class="flex items-center gap-1 text-xs font-semibold text-ink">
            <UIcon name="i-heroicons-star-solid" class="h-3.5 w-3.5" />
            {{ product.rating.average.toFixed(1) }} ({{ product.rating.count }} reviews)
          </span>
        </div>

        <div class="mt-6 flex items-baseline gap-2">
          <span class="font-display text-5xl font-black tracking-tight text-ink">{{ format(product.pricing.daily) }}</span>
          <span class="text-sm text-ink-muted">/ day</span>
        </div>
        <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-ink-muted">
          <span v-if="product.pricing.weekly">{{ format(product.pricing.weekly) }} / week</span>
          <span v-if="product.pricing.monthly">{{ format(product.pricing.monthly) }} / month</span>
          <span>Refundable deposit: {{ format(product.pricing.deposit) }}</span>
        </div>

        <p class="mt-6 text-sm leading-relaxed text-ink-muted">{{ product.description }}</p>

        <!-- Rental date selector -->
        <div class="mt-8 space-y-4 rounded-2xl border-2 border-ink bg-surface p-5 shadow-card">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="eyebrow" for="start-date">Pickup date</label>
              <input id="start-date" v-model="startDate" type="date" :min="tomorrow" class="input mt-1.5">
            </div>
            <div>
              <label class="eyebrow" for="end-date">Return date</label>
              <input id="end-date" v-model="endDate" type="date" :min="startDate" class="input mt-1.5">
            </div>
          </div>

          <div class="flex items-center justify-between">
            <span class="eyebrow">Units</span>
            <div class="flex items-center gap-3">
              <button class="h-9 w-9 rounded-full border border-ink text-ink transition hover:bg-ink hover:text-white" aria-label="Fewer units" @click="quantity = Math.max(1, quantity - 1)">−</button>
              <span class="w-6 text-center font-bold text-ink">{{ quantity }}</span>
              <button class="h-9 w-9 rounded-full border border-ink text-ink transition hover:bg-ink hover:text-white" aria-label="More units" @click="quantity++">+</button>
            </div>
          </div>

          <p v-if="disabledDates.size" class="text-xs text-ink-muted">
            {{ disabledDates.size }} day(s) in the next 90 are fully booked — availability below reflects your exact selection.
          </p>

          <p v-if="checkingAvailability" class="text-xs text-ink-muted" aria-live="polite">Checking availability…</p>
          <p v-else-if="availability?.isAvailable" class="text-xs font-semibold text-ok" aria-live="polite">
            ✓ Available for these dates
          </p>
          <p v-else-if="availability" class="text-xs font-semibold text-danger" aria-live="polite">
            Not available for these dates — only {{ availability.availableQuantity }} unit(s) free
          </p>

          <div class="flex items-center justify-between border-t border-line pt-4 text-sm">
            <span class="text-ink-muted">{{ durationDays }} day(s) × {{ quantity }} unit(s)</span>
            <span class="font-display text-2xl font-extrabold text-ink">{{ format(estimatedTotal) }}</span>
          </div>

          <div class="flex gap-3">
            <button
              class="btn-primary flex-1 !py-4"
              :disabled="!availability?.isAvailable || addingToCart"
              @click="onAddToCart"
            >
              {{ addingToCart ? 'Adding…' : 'Add to Cart' }}
            </button>
            <button
              class="rounded-full border-2 border-ink px-4 text-ink transition hover:bg-volt"
              :aria-label="isFavorite(product.id) ? 'Remove from favorites' : 'Add to favorites'"
              @click="onToggleFavorite"
            >
              <UIcon :name="isFavorite(product.id) ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'" class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Related vehicles -->
    <section v-if="related.length" class="mt-20">
      <h2 class="text-4xl">Similar vehicles</h2>
      <div class="mt-8 grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 lg:grid-cols-4">
        <ProductCard v-for="p in related" :key="p.id" :product="p" />
      </div>
    </section>
  </div>
</template>
