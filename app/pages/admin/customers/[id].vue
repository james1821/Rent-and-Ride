<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const id = route.params.id as string
const { apiFetch } = useApi()
const { format } = useCurrency()
const toast = useToast()

const { data, refresh, pending } = await useAsyncData(`admin-customer-${id}`, () =>
  apiFetch<any>(`/api/admin/customers/${id}`),
  { server: false }
)

const notes = ref('')
watch(data, (d) => { if (d) notes.value = d.customer.notes ?? '' }, { immediate: true })

const saving = ref(false)
async function saveNotes() {
  saving.value = true
  try {
    await apiFetch(`/api/admin/customers/${id}`, { method: 'PUT', body: { notes: notes.value } })
    toast.add({ title: 'Notes saved', color: 'green' })
  } catch (err: any) {
    toast.add({ title: err.message ?? 'Could not save notes', color: 'red' })
  } finally {
    saving.value = false
  }
}

async function toggleStatus() {
  const next = data.value.customer.status === 'active' ? 'disabled' : 'active'
  if (!confirm(`${next === 'disabled' ? 'Disable' : 'Re-enable'} this customer's account?`)) return
  await apiFetch(`/api/admin/customers/${id}`, { method: 'PUT', body: { status: next } })
  await refresh()
}
</script>

<template>
  <div v-if="data">
    <AdminTopbar>
      <template #title><h1 class="font-display text-lg font-bold text-ink">{{ data.customer.firstName }} {{ data.customer.lastName }}</h1></template>
    </AdminTopbar>

    <div class="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
      <div class="space-y-6">
        <section class="rounded border border-line bg-surface p-5">
          <h2 class="font-display text-base font-semibold text-ink">Rental History</h2>
          <table class="mt-3 w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wide text-ink-muted">
                <th class="pb-2">Rental #</th><th class="pb-2">Dates</th><th class="pb-2">Status</th><th class="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              <tr v-for="r in data.rentals" :key="r.id">
                <td class="py-2"><NuxtLink :to="`/admin/rentals/${r.id}`" class="font-mono font-semibold text-ink underline-offset-4 hover:underline">{{ r.rentalNumber }}</NuxtLink></td>
                <td class="py-2 text-ink-muted">{{ r.startDate }} → {{ r.endDate }}</td>
                <td class="py-2 text-ink-muted">{{ r.status.replace(/_/g, ' ') }}</td>
                <td class="py-2 text-right text-ink">{{ format(r.pricing.total) }}</td>
              </tr>
              <tr v-if="!data.rentals.length"><td colspan="4" class="py-4 text-ink-muted">No rentals yet.</td></tr>
            </tbody>
          </table>
        </section>

        <section class="rounded border border-line bg-surface p-5">
          <h2 class="font-display text-base font-semibold text-ink">Internal Notes</h2>
          <textarea v-model="notes" rows="4" class="mt-2 w-full rounded border border-line bg-canvas px-3 py-2 text-sm text-ink" />
          <button class="mt-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink-soft disabled:opacity-50" :disabled="saving" @click="saveNotes">
            Save Notes
          </button>
        </section>
      </div>

      <aside class="h-fit space-y-4 rounded border border-line bg-surface p-5 text-sm">
        <div><p class="text-ink-muted">Email</p><p class="text-ink">{{ data.customer.email }}</p></div>
        <div><p class="text-ink-muted">Phone</p><p class="text-ink">{{ data.customer.phone }}</p></div>
        <div><p class="text-ink-muted">Total Rentals</p><p class="text-ink">{{ data.customer.stats.totalRentals }}</p></div>
        <div><p class="text-ink-muted">Total Spend</p><p class="text-ink">{{ format(data.customer.stats.totalSpend) }}</p></div>
        <div><p class="text-ink-muted">Outstanding Deposit</p><p class="text-ink">{{ format(data.customer.stats.outstandingDeposit) }}</p></div>
        <div><p class="text-ink-muted">Active Rentals</p><p class="text-ok">{{ data.activeRentals.length }}</p></div>
        <div><p class="text-ink-muted">Overdue Rentals</p><p class="text-danger">{{ data.overdueRentals.length }}</p></div>

        <button
          class="mt-2 w-full rounded border px-3 py-2 text-sm font-semibold"
          :class="data.customer.status === 'active' ? 'border-danger text-danger hover:bg-danger/10' : 'border-ink text-ink hover:bg-ink/5'"
          @click="toggleStatus"
        >
          {{ data.customer.status === 'active' ? 'Disable Account' : 'Re-enable Account' }}
        </button>
      </aside>
    </div>
  </div>
</template>
