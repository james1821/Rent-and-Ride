<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { items, pricingPreview, loadingPricing, watchCart, removeItem, updateQuantity, updateDates, refreshPricing } = useCart()
const { format } = useCurrency()
const { currentUser, currentRole } = useAuth()

watch(currentRole, (r) => { if (r) watchCart() }, { immediate: true })

const couponCode = ref('')
const couponError = ref('')
async function applyCoupon() {
  couponError.value = ''
  try {
    await refreshPricing(couponCode.value || undefined)
  } catch (err: any) {
    couponError.value = err.message ?? 'Could not apply coupon'
  }
}

function lineFor(item: typeof items.value[number]) {
  return pricingPreview.value?.lines.find(
    (l: any) => l.productId === item.productId && l.startDate === item.startDate && l.endDate === item.endDate
  )
}
</script>

<template>
  <div class="container-page py-10">
    <h1 class="text-4xl text-ink sm:text-5xl">Your Cart</h1>

    <div v-if="items.length === 0" class="mt-16 rounded border border-dashed border-line py-20 text-center">
      <p class="text-ink-muted">Your cart is empty.</p>
      <NuxtLink to="/catalog" class="mt-3 inline-block text-sm font-semibold text-ink underline-offset-4 hover:underline">Browse vehicles →</NuxtLink>
    </div>

    <div v-else class="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
      <div class="space-y-4">
        <div
          v-for="(item, i) in items" :key="`${item.productId}-${item.startDate}-${item.endDate}-${i}`"
          class="flex gap-4 rounded border border-line bg-surface p-4"
        >
          <img
            :src="lineFor(item)?.productImage || 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=200&auto=format&fit=crop'"
            class="h-20 w-20 rounded object-cover"
            :alt="lineFor(item)?.productName ?? 'Product'"
          >
          <div class="flex-1">
            <div class="flex items-start justify-between">
              <div>
                <p class="font-display font-semibold text-ink">{{ lineFor(item)?.productName ?? 'Loading…' }}</p>
                <p class="text-xs text-ink-muted">{{ format(lineFor(item)?.pricePerDay ?? 0) }}/day</p>
              </div>
              <button class="text-ink-muted hover:text-danger" aria-label="Remove item" @click="removeItem(item.productId, item.startDate, item.endDate)">
                <UIcon name="i-heroicons-trash" class="h-5 w-5" />
              </button>
            </div>

            <div class="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <div class="flex items-center gap-2">
                <input
                  type="date" :value="item.startDate"
                  class="rounded border border-line bg-canvas px-2 py-1 text-xs text-ink"
                  @change="(e: any) => updateDates(item.productId, item.startDate, item.endDate, e.target.value, item.endDate)"
                >
                <span class="text-ink-muted">→</span>
                <input
                  type="date" :value="item.endDate" :min="item.startDate"
                  class="rounded border border-line bg-canvas px-2 py-1 text-xs text-ink"
                  @change="(e: any) => updateDates(item.productId, item.startDate, item.endDate, item.startDate, e.target.value)"
                >
              </div>
              <span class="text-ink-muted">{{ lineFor(item)?.durationDays ?? '–' }} day(s)</span>
              <div class="flex items-center gap-2">
                <button class="h-6 w-6 rounded border border-line text-xs text-ink" @click="updateQuantity(item.productId, item.startDate, item.endDate, item.quantity - 1)">−</button>
                <span class="w-4 text-center text-xs">{{ item.quantity }}</span>
                <button class="h-6 w-6 rounded border border-line text-xs text-ink" @click="updateQuantity(item.productId, item.startDate, item.endDate, item.quantity + 1)">+</button>
              </div>
              <span class="ml-auto font-semibold text-ink">{{ format(lineFor(item)?.lineTotal ?? 0) }}</span>
            </div>
          </div>
        </div>
      </div>

      <aside class="h-fit space-y-4 rounded border border-line bg-surface p-6">
        <h2 class="font-display text-lg font-bold text-ink">Order Summary</h2>

        <div class="flex gap-2">
          <input v-model="couponCode" placeholder="Coupon code" class="flex-1 rounded border border-line bg-canvas px-3 py-2 text-sm text-ink">
          <button class="rounded border border-line px-3 text-sm text-ink hover:border-ink" @click="applyCoupon">Apply</button>
        </div>
        <p v-if="couponError" class="text-xs text-danger">{{ couponError }}</p>

        <div v-if="loadingPricing" class="text-sm text-ink-muted">Calculating…</div>
        <dl v-else-if="pricingPreview" class="space-y-2 text-sm">
          <div class="flex justify-between"><dt class="text-ink-muted">Subtotal</dt><dd class="text-ink">{{ format(pricingPreview.subtotal) }}</dd></div>
          <div class="flex justify-between"><dt class="text-ink-muted">Deposit</dt><dd class="text-ink">{{ format(pricingPreview.deposit) }}</dd></div>
          <div v-if="pricingPreview.discount" class="flex justify-between text-ok"><dt>Discount</dt><dd>−{{ format(pricingPreview.discount) }}</dd></div>
          <div class="flex justify-between border-t border-line pt-2 text-base font-semibold">
            <dt class="text-ink">Total</dt><dd class="text-ink">{{ format(pricingPreview.total) }}</dd>
          </div>
        </dl>

        <NuxtLink
          to="/checkout"
          class="block rounded-full bg-ink py-3 text-center text-sm font-semibold text-white transition hover:bg-ink-soft"
        >
          Proceed to Checkout
        </NuxtLink>
        <p class="text-center text-xs text-ink-muted">Prices are recalculated securely at checkout.</p>
      </aside>
    </div>
  </div>
</template>
