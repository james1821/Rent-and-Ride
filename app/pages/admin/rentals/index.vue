<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const { listRentals } = useRentals()
const { format } = useCurrency()

const status = ref((route.query.status as string) ?? '')
const search = ref('')

const { data, refresh, pending } = await useAsyncData(
  'admin-rentals',
  () => listRentals({ status: (status.value || undefined) as any, search: search.value || undefined, pageSize: 100 }),
  { watch: [status, search], server: false }
)

const statusOptions = ['', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'ACTIVE', 'RETURN_PENDING', 'RETURNED', 'COMPLETED', 'CANCELLED', 'OVERDUE']

const statusColor: Record<string, string> = {
  PENDING: 'text-warn', CONFIRMED: 'text-ok', ACTIVE: 'text-ok',
  OVERDUE: 'text-danger', CANCELLED: 'text-ink-muted', COMPLETED: 'text-ink-muted'
}
</script>

<template>
  <div>
    <AdminTopbar>
      <template #title><h1 class="font-display text-lg font-bold text-ink">All Rentals</h1></template>
    </AdminTopbar>

    <div class="p-6">
      <div class="mb-4 flex flex-wrap gap-3">
        <input v-model="search" placeholder="Search rental #, customer, email…" class="w-72 rounded border border-line bg-surface px-3 py-2 text-sm text-ink">
        <select v-model="status" class="rounded border border-line bg-surface px-3 py-2 text-sm text-ink">
          <option v-for="s in statusOptions" :key="s" :value="s">{{ s || 'All Statuses' }}</option>
        </select>
      </div>

      <div v-if="pending" class="text-ink-muted">Loading…</div>

      <table v-else class="w-full overflow-hidden rounded border border-line bg-surface text-sm">
        <thead>
          <tr class="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
            <th class="p-3">Rental #</th><th class="p-3">Customer</th><th class="p-3">Dates</th>
            <th class="p-3">Status</th><th class="p-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-for="r in data?.items" :key="r.id">
            <td class="p-3">
              <NuxtLink :to="`/admin/rentals/${r.id}`" class="font-mono font-semibold text-ink underline-offset-4 hover:underline">{{ r.rentalNumber }}</NuxtLink>
            </td>
            <td class="p-3 text-ink">{{ r.customerSnapshot.name }}</td>
            <td class="p-3 text-ink-muted">{{ r.startDate }} → {{ r.endDate }}</td>
            <td class="p-3"><span :class="statusColor[r.status] ?? 'text-ink-muted'">{{ r.status.replace(/_/g, ' ') }}</span></td>
            <td class="p-3 text-right text-ink">{{ format(r.pricing.total) }}</td>
          </tr>
          <tr v-if="!data?.items.length"><td colspan="5" class="p-6 text-center text-ink-muted">No rentals match these filters.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
