<script setup lang="ts">
const faqs = [
  { q: 'What do I need to rent a vehicle?', a: 'A valid driver\u2019s license (and a government ID) plus a completed customer profile. Some vehicles require a refundable security deposit.' },
  { q: 'How are security deposits handled?', a: 'Deposits are set per vehicle and shown before checkout. They are refunded after the vehicle is returned in the condition it was received.' },
  { q: 'Can I extend my rental?', a: 'Contact us before your return date \u2014 extensions depend on availability for the following days.' },
  { q: 'What happens if I return a vehicle late?', a: 'Rentals not returned by the end date are marked overdue and may incur additional daily charges.' },
  { q: 'Do you deliver vehicles?', a: 'Yes \u2014 choose delivery at checkout and provide your address. Delivery availability varies by location.' }
]
</script>

<template>
  <div class="container-page max-w-3xl py-16">
    <p class="eyebrow">Help</p>
    <h1 class="mt-3 text-5xl sm:text-6xl">FAQ</h1>
    <div class="mt-10 divide-y divide-line rounded-xl border border-line bg-surface shadow-card">
      <details v-for="f in faqs" :key="f.q" class="group p-5">
        <summary class="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
          {{ f.q }}
          <UIcon name="i-heroicons-plus" class="h-5 w-5 shrink-0 transition group-open:rotate-45" />
        </summary>
        <p class="mt-3 text-sm text-ink-muted">{{ f.a }}</p>
      </details>
    </div>
  </div>
</template>
