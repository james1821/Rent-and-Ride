<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const id = route.params.id as string

const { getRental, cancelRental } = useRentals()
const { format } = useCurrency()
const toast = useToast()

const { data: rental, refresh } = await useAsyncData(`rental-${id}`, () => getRental(id))

const cancelling = ref(false)
async function onCancel() {
  if (!confirm('Cancel this rental request?')) return
  cancelling.value = true
  try {
    await cancelRental(id)
    await refresh()
    toast.add({ title: 'Rental cancelled', color: 'green' })
  } catch (err: any) {
    toast.add({ title: err.message ?? 'Could not cancel this rental', color: 'red' })
  } finally {
    cancelling.value = false
  }
}
</script>

<template>
  <div v-if="rental" class="container-page py-10">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="font-mono text-sm text-ink-muted">{{ rental.rentalNumber }}</p>
        <h1 class="text-4xl text-ink">{{ rental.status.replace(/_/g, ' ') }}</h1>
      </div>
      <button
        v-if="rental.status === 'PENDING'"
        class="rounded border border-danger px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/10 disabled:opacity-50"
        :disabled="cancelling"
        @click="onCancel"
      >
        Cancel Rental
      </button>
    </div>

    <div class="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
      <div class="space-y-6">
        <section class="rounded border border-line bg-surface p-5">
          <h2 class="font-display text-base font-semibold text-ink">Items</h2>
          <ul class="mt-3 divide-y divide-line">
            <li v-for="item in rental.items" :key="item.id" class="flex items-center gap-4 py-3">
              <img :src="item.productSnapshot.image" class="h-14 w-14 rounded object-cover" :alt="item.productSnapshot.name">
              <div class="flex-1">
                <p class="text-sm text-ink">{{ item.productSnapshot.name }}</p>
                <p class="text-xs text-ink-muted">{{ item.startDate }} → {{ item.endDate }} · {{ item.quantity }}× · {{ format(item.pricePerDay) }}/day</p>
              </div>
              <span class="text-sm font-semibold text-ink">{{ format(item.lineTotal) }}</span>
            </li>
          </ul>
        </section>

        <section class="rounded border border-line bg-surface p-5">
          <h2 class="font-display text-base font-semibold text-ink">Fulfillment</h2>
          <p class="mt-2 text-sm text-ink-muted">
            {{ rental.fulfillment.method === 'pickup' ? 'In-store pickup' : 'Delivery' }}
            <span v-if="rental.fulfillment.address">
              — {{ rental.fulfillment.address.line1 }}, {{ rental.fulfillment.address.city }}
            </span>
          </p>
          <p v-if="rental.notes" class="mt-2 text-sm text-ink-muted">Notes: {{ rental.notes }}</p>
        </section>

        <section class="rounded border border-line bg-surface p-5">
          <h2 class="font-display text-base font-semibold text-ink">Status History</h2>
          <ul class="mt-3 space-y-2">
            <li v-for="(h, i) in rental.statusHistory" :key="i" class="flex justify-between text-sm">
              <span class="text-ink">{{ h.status.replace(/_/g, ' ') }}</span>
              <span class="text-ink-muted">{{ new Date(h.changedAt).toLocaleString() }}</span>
            </li>
          </ul>
        </section>
      </div>

      <aside class="h-fit space-y-2 rounded border border-line bg-surface p-5 text-sm">
        <div class="flex justify-between"><span class="text-ink-muted">Subtotal</span><span class="text-ink">{{ format(rental.pricing.subtotal) }}</span></div>
        <div class="flex justify-between"><span class="text-ink-muted">Deposit</span><span class="text-ink">{{ format(rental.pricing.deposit) }}</span></div>
        <div v-if="rental.pricing.discount" class="flex justify-between text-ok"><span>Discount</span><span>−{{ format(rental.pricing.discount) }}</span></div>
        <div class="flex justify-between border-t border-line pt-2 font-semibold"><span class="text-ink">Total</span><span class="text-ink">{{ format(rental.pricing.total) }}</span></div>
      </aside>
    </div>
  </div>
</template>
