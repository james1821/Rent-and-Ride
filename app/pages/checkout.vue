<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { items, pricingPreview, refreshPricing, clear, watchCart } = useCart()
const { checkout } = useRentals()
const { format } = useCurrency()
const { currentUser, currentRole } = useAuth()
const toast = useToast()
const router = useRouter()

watch(currentRole, (r) => { if (r) { watchCart(); refreshPricing() } }, { immediate: true })

const fulfillmentMethod = ref<'pickup' | 'delivery'>('pickup')
const address = reactive({ line1: '', line2: '', city: '', province: '', postalCode: '' })
const notes = ref('')
const submitting = ref(false)
const submitError = ref('')

async function submitOrder() {
  if (items.value.length === 0) return
  if (fulfillmentMethod.value === 'delivery' && (!address.line1 || !address.city || !address.province || !address.postalCode)) {
    submitError.value = 'Please complete your delivery address.'
    return
  }

  submitting.value = true
  submitError.value = ''
  try {
    const rental = await checkout({
      items: items.value.map((i) => ({ productId: i.productId, quantity: i.quantity, startDate: i.startDate, endDate: i.endDate })),
      fulfillment: {
        method: fulfillmentMethod.value,
        address: fulfillmentMethod.value === 'delivery' ? { ...address } : undefined
      },
      notes: notes.value || undefined
    })
    await clear()
    toast.add({ title: 'Rental booked! We\u2019ll confirm shortly.', color: 'green' })
    router.push(`/account/rentals/${rental.id}`)
  } catch (err: any) {
    submitError.value = err.message ?? 'Something went wrong creating your rental'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="container-page py-10">
    <h1 class="text-4xl text-ink sm:text-5xl">Checkout</h1>

    <div v-if="items.length === 0" class="mt-16 text-center text-ink-muted">
      Your cart is empty. <NuxtLink to="/catalog" class="font-semibold text-ink underline-offset-4 hover:underline">Browse vehicles →</NuxtLink>
    </div>

    <div v-else class="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
      <div class="space-y-8">
        <section class="rounded border border-line bg-surface p-6">
          <h2 class="font-display text-lg font-bold text-ink">Fulfillment</h2>
          <div class="mt-4 flex gap-4">
            <label class="flex flex-1 cursor-pointer items-center gap-2 rounded border p-3 text-sm" :class="fulfillmentMethod === 'pickup' ? 'border-ink text-ink' : 'border-line text-ink-muted'">
              <input v-model="fulfillmentMethod" type="radio" value="pickup"> In-Store Pickup
            </label>
            <label class="flex flex-1 cursor-pointer items-center gap-2 rounded border p-3 text-sm" :class="fulfillmentMethod === 'delivery' ? 'border-ink text-ink' : 'border-line text-ink-muted'">
              <input v-model="fulfillmentMethod" type="radio" value="delivery"> Delivery
            </label>
          </div>

          <div v-if="fulfillmentMethod === 'delivery'" class="mt-4 grid gap-3 sm:grid-cols-2">
            <input v-model="address.line1" placeholder="Address line 1" class="rounded border border-line bg-canvas px-3 py-2 text-sm text-ink sm:col-span-2">
            <input v-model="address.line2" placeholder="Address line 2 (optional)" class="rounded border border-line bg-canvas px-3 py-2 text-sm text-ink sm:col-span-2">
            <input v-model="address.city" placeholder="City" class="rounded border border-line bg-canvas px-3 py-2 text-sm text-ink">
            <input v-model="address.province" placeholder="Province" class="rounded border border-line bg-canvas px-3 py-2 text-sm text-ink">
            <input v-model="address.postalCode" placeholder="Postal code" class="rounded border border-line bg-canvas px-3 py-2 text-sm text-ink">
          </div>
        </section>

        <section class="rounded border border-line bg-surface p-6">
          <h2 class="font-display text-lg font-bold text-ink">Notes</h2>
          <textarea v-model="notes" rows="3" placeholder="Anything we should know about this rental?" class="mt-3 w-full rounded border border-line bg-canvas px-3 py-2 text-sm text-ink" />
        </section>

        <section class="rounded border border-line bg-surface p-6">
          <h2 class="font-display text-lg font-bold text-ink">Items</h2>
          <ul class="mt-3 divide-y divide-line">
            <li v-for="(item, i) in items" :key="i" class="flex justify-between py-2 text-sm">
              <span class="text-ink-muted">{{ item.quantity }}× {{ item.startDate }} → {{ item.endDate }}</span>
            </li>
          </ul>
        </section>
      </div>

      <aside class="h-fit space-y-4 rounded border border-line bg-surface p-6">
        <h2 class="font-display text-lg font-bold text-ink">Rental Summary</h2>
        <dl v-if="pricingPreview" class="space-y-2 text-sm">
          <div class="flex justify-between"><dt class="text-ink-muted">Subtotal</dt><dd class="text-ink">{{ format(pricingPreview.subtotal) }}</dd></div>
          <div class="flex justify-between"><dt class="text-ink-muted">Deposit</dt><dd class="text-ink">{{ format(pricingPreview.deposit) }}</dd></div>
          <div v-if="pricingPreview.discount" class="flex justify-between text-ok"><dt>Discount</dt><dd>−{{ format(pricingPreview.discount) }}</dd></div>
          <div class="flex justify-between border-t border-line pt-2 text-base font-semibold">
            <dt class="text-ink">Total Due</dt><dd class="text-ink">{{ format(pricingPreview.total) }}</dd>
          </div>
        </dl>

        <p v-if="submitError" class="text-sm text-danger">{{ submitError }}</p>

        <button
          class="w-full rounded-full bg-ink py-3 text-sm font-semibold text-white transition hover:bg-ink-soft disabled:opacity-50"
          :disabled="submitting"
          @click="submitOrder"
        >
          {{ submitting ? 'Confirming…' : 'Confirm Rental' }}
        </button>
        <p class="text-center text-xs text-ink-muted">
          Availability and pricing are re-verified on our servers before your rental is confirmed.
        </p>
      </aside>
    </div>
  </div>
</template>
