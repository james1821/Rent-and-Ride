<script setup lang="ts">
import type { Product } from '~/types'

const props = defineProps<{ product: Product }>()
const { format } = useCurrency()
const { isFavorite, toggleFavorite } = useFavorites()
const { addItem } = useCart()
const { isAuthenticated } = useAuth()
const toast = useToast()
const route = useRoute()

function promptLogin(message: string) {
  toast.add({ title: message, color: 'red' })
  return navigateTo(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
}

const busy = ref(false)
const addingToCart = ref(false)
const imageBroken = ref(false)

async function onToggleFavorite(e: Event) {
  e.preventDefault()
  e.stopPropagation()
  if (!isAuthenticated.value) {
    await promptLogin('Sign in to save favorites')
    return
  }
  busy.value = true
  try {
    await toggleFavorite(props.product.id)
  } catch (err: any) {
    toast.add({ title: err.message ?? 'Could not update favorites', color: 'red' })
  } finally {
    busy.value = false
  }
}

async function onQuickAddToCart(e: Event) {
  e.preventDefault()
  e.stopPropagation()
  if (!isAuthenticated.value) {
    await promptLogin('Sign in to add vehicles to your cart')
    return
  }
  // Quick-add defaults to a 1-day rental starting tomorrow; the cart page
  // lets the customer adjust dates before checkout.
  addingToCart.value = true
  try {
    const start = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    await addItem({ productId: props.product.id, quantity: 1, startDate: start, endDate: start, addedAt: new Date().toISOString() })
    toast.add({ title: `${props.product.name} added to cart`, color: 'green' })
  } catch (err: any) {
    toast.add({ title: err.message ?? 'Could not add to cart', color: 'red' })
  } finally {
    addingToCart.value = false
  }
}

const available = computed(() => props.product.quantityAvailable > 0 && props.product.isRentable)
const chips = computed(() => vehicleSpecChips(props.product.vehicle).filter((c) => ['transmission', 'seats', 'fuel'].includes(c.key)))
const typeLabel = computed(() => (props.product.vehicle ? VEHICLE_TYPE_LABEL[props.product.vehicle.type] : ''))
</script>

<template>
  <NuxtLink :to="`/product/${product.slug}`" class="card-lift group relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-card">
    <div class="relative aspect-[4/3] overflow-hidden bg-sunken">
      <img
        v-if="product.images?.[0] && !imageBroken"
        :src="product.images[0]" :alt="product.name" loading="lazy"
        class="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        @error="imageBroken = true"
      >
      <div v-else class="flex h-full w-full items-center justify-center text-ink-faint">
        <UIcon name="i-heroicons-truck" class="h-12 w-12" />
      </div>

      <span
        class="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold shadow-card backdrop-blur"
        :class="available ? 'text-ink' : 'text-ink-muted'"
      >
        <span class="h-1.5 w-1.5 rounded-full" :class="available ? 'bg-ok' : 'bg-ink-faint'" />
        {{ available ? 'Available' : 'Unavailable' }}
      </span>

      <button
        class="absolute right-3 top-3 rounded-full bg-white/95 p-2 text-ink shadow-card backdrop-blur transition hover:scale-110 hover:bg-volt"
        :disabled="busy"
        :aria-label="isFavorite(product.id) ? 'Remove from favorites' : 'Add to favorites'"
        @click="onToggleFavorite"
      >
        <UIcon :name="isFavorite(product.id) ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'" class="h-4 w-4" />
      </button>
    </div>

    <div class="flex flex-1 flex-col p-4">
      <p class="eyebrow">{{ product.brand }}<template v-if="typeLabel"> · {{ typeLabel }}</template></p>
      <h3 class="mt-1.5 text-lg leading-tight text-ink">{{ product.name }}</h3>

      <ul v-if="chips.length" class="mt-3 flex flex-wrap gap-1.5">
        <li v-for="c in chips" :key="c.key" class="flex items-center gap-1 rounded-full bg-sunken px-2.5 py-1 text-xs font-medium text-ink-soft">
          <UIcon :name="c.icon" class="h-3.5 w-3.5" /> {{ c.value }}
        </li>
      </ul>

      <div class="mt-auto flex items-end justify-between gap-2 pt-5">
        <div>
          <p class="font-display text-2xl font-extrabold leading-none text-ink">{{ format(product.pricing.daily) }}</p>
          <p class="mt-1 text-xs text-ink-muted">per day</p>
        </div>
        <button
          class="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white transition hover:bg-volt hover:text-ink disabled:opacity-40"
          :disabled="!available || addingToCart"
          aria-label="Add to cart"
          @click="onQuickAddToCart"
        >
          <UIcon name="i-heroicons-shopping-bag" class="h-5 w-5" />
        </button>
      </div>
    </div>
  </NuxtLink>
</template>
