<script setup lang="ts">
// Code-rendered preview of the real admin dashboard (app/pages/admin/index.vue),
// built from the same design tokens and the same navigation labels as
// AdminSidebar.vue. Numbers and names are illustrative sample data.
const sections = [
  { label: 'Overview', items: [{ label: 'Dashboard', icon: 'i-heroicons-squares-2x2', active: true }] },
  { label: 'Rentals', items: [
    { label: 'All Rentals', icon: 'i-heroicons-clipboard-document-list' },
    { label: 'Pending', icon: 'i-heroicons-clock' },
    { label: 'Active', icon: 'i-heroicons-bolt' }
  ] },
  { label: 'Catalog', items: [
    { label: 'Categories', icon: 'i-heroicons-tag' },
    { label: 'Vehicles', icon: 'i-heroicons-truck' }
  ] },
  { label: 'System', items: [
    { label: 'Settings', icon: 'i-heroicons-cog-6-tooth' }
  ] }
]

const cards = [
  { label: 'Total Rentals', value: '128' },
  { label: 'Pending', value: '6' },
  { label: 'Active', value: '14' },
  { label: 'Overdue', value: '1' },
  { label: 'Customers', value: '74' },
  { label: 'Active Vehicles', value: '21' },
  { label: 'Revenue (Completed)', value: '₱312,400' }
]

const upcoming = [
  { name: 'Toyota Vios 1.3', date: 'Oct 21' },
  { name: 'Honda Click 125', date: 'Oct 22' }
]

const popular = [
  { name: 'Honda Click 125', count: '18× rented' },
  { name: 'Toyota Vios 1.3', count: '12× rented' }
]

const recent = [
  { no: 'RR-2041', name: 'Sample Customer', status: 'CONFIRMED', total: '₱4,500' },
  { no: 'RR-2040', name: 'Sample Customer', status: 'ACTIVE', total: '₱2,300' },
  { no: 'RR-2039', name: 'Sample Customer', status: 'PENDING', total: '₱6,100' }
]
</script>

<template>
  <div class="flex min-h-[420px] bg-canvas text-left">
    <aside class="hidden w-40 shrink-0 bg-ink p-3 text-white sm:block">
      <div class="flex items-center gap-2 px-2 py-1.5 font-display text-sm font-extrabold tracking-tight">
        <span class="brand-dot" /> RentRide
        <span class="rounded-full bg-volt px-1.5 py-0.5 font-mono text-[8px] font-medium uppercase tracking-widest text-ink">Admin</span>
      </div>
      <div v-for="s in sections" :key="s.label" class="mt-3">
        <p class="px-2 font-mono text-[8px] uppercase tracking-[0.18em] text-white/40">{{ s.label }}</p>
        <ul class="mt-1 space-y-0.5">
          <li
            v-for="i in s.items" :key="i.label"
            class="flex items-center gap-2 rounded-full px-2 py-1 text-[11px]"
            :class="i.active ? 'bg-volt text-ink' : 'text-white/70'"
          >
            <UIcon :name="i.icon" class="h-3.5 w-3.5" />{{ i.label }}
          </li>
        </ul>
      </div>
    </aside>

    <div class="min-w-0 flex-1">
      <div class="flex items-center justify-between border-b border-line bg-surface px-4 py-3">
        <p class="font-display text-sm font-bold text-ink">Dashboard</p>
        <span class="h-5 w-5 rounded-full bg-ink" />
      </div>

      <div class="space-y-3 p-4">
        <div class="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <div v-for="c in cards" :key="c.label" class="rounded border border-line bg-surface p-2.5">
            <p class="text-[8px] font-medium uppercase tracking-wide text-ink-muted">{{ c.label }}</p>
            <p class="mt-1 font-display text-base font-bold text-ink">{{ c.value }}</p>
          </div>
        </div>

        <div class="grid gap-2 lg:grid-cols-2">
          <div class="rounded border border-line bg-surface p-3">
            <p class="font-display text-[11px] font-semibold text-ink">Upcoming Rentals (7 days)</p>
            <ul class="mt-2 space-y-1">
              <li v-for="r in upcoming" :key="r.name" class="flex justify-between text-[10px]">
                <span class="text-ink">{{ r.name }}</span><span class="text-ink-muted">{{ r.date }}</span>
              </li>
            </ul>
          </div>
          <div class="rounded border border-line bg-surface p-3">
            <p class="font-display text-[11px] font-semibold text-ink">Popular Vehicles</p>
            <ul class="mt-2 space-y-1">
              <li v-for="p in popular" :key="p.name" class="flex justify-between text-[10px]">
                <span class="text-ink">{{ p.name }}</span><span class="text-ink-muted">{{ p.count }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="rounded border border-line bg-surface p-3">
          <p class="font-display text-[11px] font-semibold text-ink">Recent Rentals</p>
          <table class="mt-2 w-full text-[10px]">
            <thead>
              <tr class="text-left uppercase tracking-wide text-ink-muted">
                <th class="pb-1 font-medium">Rental #</th>
                <th class="pb-1 font-medium">Customer</th>
                <th class="pb-1 font-medium">Status</th>
                <th class="pb-1 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              <tr v-for="r in recent" :key="r.no">
                <td class="py-1 font-mono font-semibold text-ink">{{ r.no }}</td>
                <td class="py-1 text-ink">{{ r.name }}</td>
                <td class="py-1 text-ink-muted">{{ r.status }}</td>
                <td class="py-1 text-right text-ink">{{ r.total }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
