<script setup lang="ts">
const { data: general } = useAsyncData('site-general', async () => {
  try {
    const res = await $fetch<{ success: boolean; data: any }>('/api/settings/general')
    return res.success ? res.data : null
  } catch { return null }
})
const email = computed(() => general.value?.contactEmail || 'hello@example.com')
const phone = computed(() => general.value?.contactPhone || '+63 917 000 0000')
const address = computed(() => general.value?.address || '')
</script>

<template>
  <div class="container-page max-w-2xl py-16">
    <p class="eyebrow">Get in touch</p>
    <h1 class="mt-3 text-5xl sm:text-6xl">Contact us</h1>
    <dl class="mt-10 divide-y divide-line rounded-xl border border-line bg-surface text-sm shadow-card">
      <div class="p-5"><dt class="eyebrow">Email</dt><dd class="mt-1 text-base font-semibold text-ink">{{ email }}</dd></div>
      <div class="p-5"><dt class="eyebrow">Phone</dt><dd class="mt-1 text-base font-semibold text-ink">{{ phone }}</dd></div>
      <div v-if="address" class="p-5"><dt class="eyebrow">Address</dt><dd class="mt-1 text-base font-semibold text-ink">{{ address }}</dd></div>
    </dl>
  </div>
</template>
