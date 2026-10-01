<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const id = route.params.id as string
const { getRental, setStatus } = useRentals()
const { format } = useCurrency()
const toast = useToast()

const { data: rental, refresh } = await useAsyncData(`admin-rental-${id}`, () => getRental(id), { server: false })

// Mirrors RENTAL_STATUS_TRANSITIONS in server/types — kept here for the UI's
// "next status" buttons; the server is still the source of truth and will
// reject anything not actually valid.
const nextStatusOptions: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  READY_FOR_PICKUP: ['ACTIVE', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['RETURN_PENDING', 'OVERDUE'],
  RETURN_PENDING: ['RETURNED'],
  OVERDUE: ['RETURN_PENDING', 'RETURNED'],
  RETURNED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: []
}

const changing = ref(false)
async function changeStatus(status: string) {
  changing.value = true
  try {
    await setStatus(id, status as any)
    await refresh()
    toast.add({ title: `Rental marked ${status.replace(/_/g, ' ').toLowerCase()}`, color: 'green' })
  } catch (err: any) {
    toast.add({ title: err.message ?? 'Could not update status', color: 'red' })
  } finally {
    changing.value = false
  }
}
</script>

<template>
  <div v-if="rental">
    <AdminTopbar>
      <template #title>
        <div>
          <p class="font-mono text-xs text-ink-muted">{{ rental.rentalNumber }}</p>
          <h1 class="font-display text-lg font-bold text-ink">{{ rental.customerSnapshot.name }}</h1>
        </div>
      </template>
    </AdminTopbar>

    <div class="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
      <div class="space-y-6">
        <section class="rounded border border-line bg-surface p-5">
          <h2 class="font-display text-base font-semibold text-ink">Items</h2>
          <table class="mt-3 w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wide text-ink-muted">
                <th class="pb-2">Item</th><th class="pb-2">Dates</th><th class="pb-2">Qty</th><th class="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              <tr v-for="item in rental.items" :key="item.id">
                <td class="py-2 text-ink">{{ item.productSnapshot.name }} <span class="text-xs text-ink-muted">({{ item.productSnapshot.sku }})</span></td>
                <td class="py-2 text-ink-muted">{{ item.startDate }} → {{ item.endDate }}</td>
                <td class="py-2 text-ink-muted">{{ item.quantity }}</td>
                <td class="py-2 text-right text-ink">{{ format(item.lineTotal) }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="rounded border border-line bg-surface p-5">
          <h2 class="font-display text-base font-semibold text-ink">Customer</h2>
          <p class="mt-2 text-sm text-ink">{{ rental.customerSnapshot.name }}</p>
          <p class="text-sm text-ink-muted">{{ rental.customerSnapshot.email }} · {{ rental.customerSnapshot.phone }}</p>
          <NuxtLink :to="`/admin/customers/${rental.customerId}`" class="mt-1 inline-block text-xs font-semibold text-ink underline-offset-4 hover:underline">View customer profile →</NuxtLink>
        </section>

        <section class="rounded border border-line bg-surface p-5">
          <h2 class="font-display text-base font-semibold text-ink">Fulfillment & Notes</h2>
          <p class="mt-2 text-sm text-ink-muted">
            {{ rental.fulfillment.method === 'pickup' ? 'In-store pickup' : 'Delivery' }}
            <span v-if="rental.fulfillment.address">— {{ rental.fulfillment.address.line1 }}, {{ rental.fulfillment.address.city }}</span>
          </p>
          <p v-if="rental.notes" class="mt-2 text-sm text-ink">Customer notes: {{ rental.notes }}</p>
          <p v-if="rental.internalNotes" class="mt-2 text-sm text-warn">Internal: {{ rental.internalNotes }}</p>
        </section>

        <section class="rounded border border-line bg-surface p-5">
          <h2 class="font-display text-base font-semibold text-ink">Status History</h2>
          <ul class="mt-3 space-y-2 text-sm">
            <li v-for="(h, i) in rental.statusHistory" :key="i" class="flex justify-between">
              <span class="text-ink">{{ h.status.replace(/_/g, ' ') }}</span>
              <span class="text-ink-muted">{{ new Date(h.changedAt).toLocaleString() }}</span>
            </li>
          </ul>
        </section>
      </div>

      <aside class="h-fit space-y-4">
        <div class="rounded border border-line bg-surface p-5">
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-muted">Current Status</p>
          <p class="mt-1 font-display text-xl font-bold text-ink">{{ rental.status.replace(/_/g, ' ') }}</p>

          <div v-if="nextStatusOptions[rental.status]?.length" class="mt-4 space-y-2">
            <p class="text-xs text-ink-muted">Move to:</p>
            <button
              v-for="s in nextStatusOptions[rental.status]" :key="s"
              class="block w-full rounded border border-line px-3 py-2 text-left text-sm text-ink transition hover:border-ink disabled:opacity-50"
              :disabled="changing"
              @click="changeStatus(s)"
            >
              {{ s.replace(/_/g, ' ') }}
            </button>
          </div>
        </div>

        <div class="space-y-2 rounded border border-line bg-surface p-5 text-sm">
          <div class="flex justify-between"><span class="text-ink-muted">Subtotal</span><span class="text-ink">{{ format(rental.pricing.subtotal) }}</span></div>
          <div class="flex justify-between"><span class="text-ink-muted">Deposit</span><span class="text-ink">{{ format(rental.pricing.deposit) }}</span></div>
          <div v-if="rental.pricing.discount" class="flex justify-between text-ok"><span>Discount</span><span>−{{ format(rental.pricing.discount) }}</span></div>
          <div class="flex justify-between border-t border-line pt-2 font-semibold"><span class="text-ink">Total</span><span class="text-ink">{{ format(rental.pricing.total) }}</span></div>
        </div>
      </aside>
    </div>
  </div>
</template>
