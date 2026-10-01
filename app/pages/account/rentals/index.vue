<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { listRentals } = useRentals()
const { format } = useCurrency()

const { data, pending } = await useAsyncData('my-rentals', () => listRentals({ pageSize: 50 }))

const statusColor: Record<string, string> = {
  PENDING: 'text-warn', CONFIRMED: 'text-ok', ACTIVE: 'text-ok',
  OVERDUE: 'text-danger', CANCELLED: 'text-ink-muted', COMPLETED: 'text-ink-muted'
}
</script>

<template>
  <div class="container-page py-10">
    <h1 class="text-4xl text-ink sm:text-5xl">Your Rentals</h1>

    <div v-if="pending" class="mt-10 text-ink-muted">Loading…</div>

    <div v-else-if="!data?.items.length" class="mt-16 rounded border border-dashed border-line py-20 text-center">
      <p class="text-ink-muted">You haven't made any rentals yet.</p>
      <NuxtLink to="/catalog" class="mt-3 inline-block text-sm font-semibold text-ink underline-offset-4 hover:underline">Browse vehicles →</NuxtLink>
    </div>

    <div v-else class="mt-8 space-y-3">
      <NuxtLink
        v-for="rental in data.items" :key="rental.id" :to="`/account/rentals/${rental.id}`"
        class="flex items-center justify-between rounded border border-line bg-surface p-4 transition hover:border-ink"
      >
        <div>
          <p class="font-mono text-sm text-ink">{{ rental.rentalNumber }}</p>
          <p class="text-xs text-ink-muted">{{ rental.startDate }} → {{ rental.endDate }}</p>
        </div>
        <div class="text-right">
          <p class="text-sm font-semibold" :class="statusColor[rental.status]">{{ rental.status.replace(/_/g, ' ') }}</p>
          <p class="text-xs text-ink-muted">{{ format(rental.pricing.total) }}</p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
