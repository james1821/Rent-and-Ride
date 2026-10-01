<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { listRentals, setStatus } = useRentals()
const { format } = useCurrency()
const toast = useToast()

const { data, refresh, pending } = await useAsyncData('admin-pending-rentals', () => listRentals({ status: 'PENDING', pageSize: 100 }), { server: false })

const acting = ref<string | null>(null)
async function approve(id: string) {
  acting.value = id
  try {
    await setStatus(id, 'CONFIRMED')
    await refresh()
    toast.add({ title: 'Rental confirmed', color: 'green' })
  } catch (err: any) {
    toast.add({ title: err.message ?? 'Could not confirm rental', color: 'red' })
  } finally {
    acting.value = null
  }
}
async function reject(id: string) {
  if (!confirm('Reject and cancel this rental request?')) return
  acting.value = id
  try {
    await setStatus(id, 'CANCELLED', 'Rejected by admin')
    await refresh()
    toast.add({ title: 'Rental rejected', color: 'green' })
  } catch (err: any) {
    toast.add({ title: err.message ?? 'Could not reject rental', color: 'red' })
  } finally {
    acting.value = null
  }
}
</script>

<template>
  <div>
    <AdminTopbar>
      <template #title><h1 class="font-display text-lg font-bold text-ink">Pending Rentals</h1></template>
    </AdminTopbar>

    <div class="p-6">
      <div v-if="pending" class="text-ink-muted">Loading…</div>

      <div v-else-if="!data?.items.length" class="rounded border border-dashed border-line p-10 text-center text-ink-muted">
        No pending rentals right now.
      </div>

      <div v-else class="space-y-3">
        <div v-for="r in data.items" :key="r.id" class="flex flex-wrap items-center justify-between gap-4 rounded border border-line bg-surface p-4">
          <div>
            <p class="font-mono text-sm text-ink">{{ r.rentalNumber }}</p>
            <p class="text-sm text-ink">{{ r.customerSnapshot.name }} · {{ r.customerSnapshot.email }}</p>
            <p class="text-xs text-ink-muted">{{ r.startDate }} → {{ r.endDate }} · Created {{ new Date(r.createdAt).toLocaleDateString() }}</p>
          </div>
          <div class="text-right">
            <p class="font-semibold text-ink">{{ format(r.pricing.total) }}</p>
            <p class="text-xs text-ink-muted">Deposit: {{ format(r.pricing.deposit) }}</p>
          </div>
          <div class="flex gap-2">
            <NuxtLink :to="`/admin/rentals/${r.id}`" class="rounded border border-line px-3 py-1.5 text-xs text-ink hover:border-ink">View</NuxtLink>
            <button class="rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-white hover:bg-ink-soft disabled:opacity-50" :disabled="acting === r.id" @click="approve(r.id)">Approve</button>
            <button class="rounded border border-danger px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/10 disabled:opacity-50" :disabled="acting === r.id" @click="reject(r.id)">Reject</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
