<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { apiFetch } = useApi()
const { format } = useCurrency()

const { data, pending, error } = await useAsyncData('admin-dashboard', () =>
  apiFetch<any>('/api/admin/dashboard/stats'),
  { server: false }
)

const cards = computed(() => data.value ? [
  { label: 'Total Rentals', value: data.value.totals.totalRentals, icon: 'i-heroicons-clipboard-document-list' },
  { label: 'Pending', value: data.value.totals.pendingRentals, icon: 'i-heroicons-clock', accent: 'text-warn' },
  { label: 'Active', value: data.value.totals.activeRentals, icon: 'i-heroicons-bolt', accent: 'text-ok' },
  { label: 'Overdue', value: data.value.totals.overdueRentals, icon: 'i-heroicons-exclamation-triangle', accent: 'text-danger' },
  { label: 'Customers', value: data.value.totals.totalCustomers, icon: 'i-heroicons-users' },
  { label: 'Active Vehicles', value: data.value.totals.totalProducts, icon: 'i-heroicons-truck' },
  { label: 'Revenue (Completed)', value: format(data.value.totals.revenue), icon: 'i-heroicons-banknotes', accent: 'text-ok' }
] : [])
</script>

<template>
  <div>
    <AdminTopbar>
      <template #title><h1 class="font-display text-lg font-bold text-ink">Dashboard</h1></template>
    </AdminTopbar>

    <div class="p-6">
      <div v-if="pending" class="text-ink-muted">Loading…</div>

      <div v-else-if="!data" class="rounded border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
        Could not load dashboard data{{ error?.message ? `: ${error.message}` : '' }}. Check that the server can reach Firebase (see .env).
      </div>

      <template v-else>
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div v-for="c in cards" :key="c.label" class="rounded border border-line bg-surface p-5">
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium uppercase tracking-wide text-ink-muted">{{ c.label }}</p>
              <UIcon :name="c.icon" class="h-5 w-5" :class="c.accent ?? 'text-ink-muted'" />
            </div>
            <p class="mt-2 font-display text-2xl font-bold text-ink">{{ c.value }}</p>
          </div>
        </div>

        <div class="mt-8 grid gap-6 lg:grid-cols-2">
          <section class="rounded border border-line bg-surface p-5">
            <h2 class="font-display text-base font-semibold text-ink">Upcoming Rentals (7 days)</h2>
            <ul class="mt-3 divide-y divide-line">
              <li v-for="r in data.upcomingRentals" :key="r.id" class="flex justify-between py-2 text-sm">
                <span class="text-ink">{{ r.customerSnapshot.name }}</span>
                <span class="text-ink-muted">{{ r.startDate }}</span>
              </li>
              <li v-if="!data.upcomingRentals.length" class="py-4 text-sm text-ink-muted">Nothing scheduled.</li>
            </ul>
          </section>

          <section class="rounded border border-line bg-surface p-5">
            <h2 class="font-display text-base font-semibold text-ink">Popular Vehicles</h2>
            <ul class="mt-3 divide-y divide-line">
              <li v-for="p in data.popularVehicles" :key="p.productId" class="flex justify-between py-2 text-sm">
                <span class="text-ink">{{ p.name }}</span>
                <span class="text-ink-muted">{{ p.timesRented }}× rented</span>
              </li>
              <li v-if="!data.popularVehicles.length" class="py-4 text-sm text-ink-muted">No rental history yet.</li>
            </ul>
          </section>
        </div>

        <section class="mt-6 rounded border border-line bg-surface p-5">
          <h2 class="font-display text-base font-semibold text-ink">Recent Rentals</h2>
          <table class="mt-3 w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wide text-ink-muted">
                <th class="pb-2">Rental #</th><th class="pb-2">Customer</th><th class="pb-2">Status</th><th class="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              <tr v-for="r in data.recentRentals" :key="r.id">
                <td class="py-2">
                  <NuxtLink :to="`/admin/rentals/${r.id}`" class="font-mono font-semibold text-ink underline-offset-4 hover:underline">{{ r.rentalNumber }}</NuxtLink>
                </td>
                <td class="py-2 text-ink">{{ r.customerSnapshot.name }}</td>
                <td class="py-2 text-ink-muted">{{ r.status.replace(/_/g, ' ') }}</td>
                <td class="py-2 text-right text-ink">{{ format(r.pricing.total) }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </template>
    </div>
  </div>
</template>
