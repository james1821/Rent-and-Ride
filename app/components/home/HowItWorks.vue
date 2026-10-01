<script setup lang="ts">
const steps = [
  { icon: 'i-heroicons-magnifying-glass', title: 'Pick your ride', description: 'Browse cars and motorcycles, filter by type, transmission or seats.' },
  { icon: 'i-heroicons-calendar-days', title: 'Choose your dates', description: 'Select pickup and return dates — availability is checked live.' },
  { icon: 'i-heroicons-check-circle', title: 'Confirm your booking', description: 'Review the rate and deposit, then send your booking request.' },
  { icon: 'i-heroicons-key', title: 'Pick up & return', description: 'Collect it in store or have it delivered, and bring it back on time.' }
]
</script>

<template>
  <section class="on-dark bg-ink py-20 text-white sm:py-28">
    <div class="container-page">
      <p class="eyebrow !text-volt">How it works</p>
      <h2 class="mt-3 max-w-2xl text-4xl sm:text-6xl">Four steps to the open road</h2>
      <div class="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="(step, i) in steps" :key="step.title" class="group bg-ink p-7 transition hover:bg-white/[0.04]">
          <div class="flex items-center justify-between">
            <span class="font-display text-5xl font-black text-white/15 transition group-hover:text-volt">0{{ i + 1 }}</span>
            <UIcon :name="step.icon" class="h-7 w-7 text-white/80" />
          </div>
          <h3 class="mt-8 text-xl">{{ step.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-white/60">{{ step.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
