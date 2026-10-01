<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { apiFetch } = useApi()
const { format } = useCurrency()
const search = ref('')

const { data, refresh, pending } = await useAsyncData(
  'admin-customers',
  () => apiFetch<any>('/api/admin/customers', { query: { search: search.value || undefined, pageSize: 100 } }),
  { watch: [search], server: false }
)
</script>

<template>
  <div>
    <AdminTopbar>
      <template #title><h1 class="font-display text-lg font-bold text-ink">Customers</h1></template>
    </AdminTopbar>

    <div class="p-6">
      <input v-model="search" placeholder="Search name, email, or phone…" class="mb-4 w-full max-w-sm rounded border border-line bg-surface px-3 py-2 text-sm text-ink">

      <div v-if="pending" class="text-ink-muted">Loading…</div>

      <table v-else class="w-full overflow-hidden rounded border border-line bg-surface text-sm">
        <thead>
          <tr class="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
            <th class="p-3">Name</th><th class="p-3">Email</th><th class="p-3">Rentals</th>
            <th class="p-3">Total Spend</th><th class="p-3">Status</th><th class="p-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-for="c in data?.items" :key="c.id">
            <td class="p-3 text-ink">{{ c.firstName }} {{ c.lastName }}</td>
            <td class="p-3 text-ink-muted">{{ c.email }}</td>
            <td class="p-3 text-ink">{{ c.stats?.totalRentals ?? 0 }}</td>
            <td class="p-3 text-ink">{{ format(c.stats?.totalSpend ?? 0) }}</td>
            <td class="p-3"><span :class="c.status === 'active' ? 'text-ok' : 'text-danger'">{{ c.status }}</span></td>
            <td class="p-3 text-right"><NuxtLink :to="`/admin/customers/${c.id}`" class="font-semibold text-ink underline-offset-4 hover:underline">View</NuxtLink></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
