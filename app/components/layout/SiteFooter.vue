<script setup lang="ts">
const year = new Date().getFullYear()
const siteName = useRuntimeConfig().public.siteName

// Contact details come from Admin → Settings (settings/general); safe fallbacks if unset.
const { data: general } = useAsyncData('site-general', async () => {
  try {
    const res = await $fetch<{ success: boolean; data: any }>('/api/settings/general')
    return res.success ? res.data : null
  } catch { return null }
})
const contact = computed(() => ({
  email: general.value?.contactEmail || 'hello@example.com',
  phone: general.value?.contactPhone || '+63 917 000 0000',
  address: general.value?.address || ''
}))
const socials = computed(() => general.value?.socials ?? {})
</script>

<template>
  <footer class="on-dark mt-24 bg-ink text-white">
    <div class="container-page py-16">
      <p class="font-display text-[clamp(3rem,12vw,9rem)] font-black uppercase leading-[0.9] tracking-tightest">
        Ride <span class="text-volt">further.</span>
      </p>

      <div class="mt-14 grid gap-10 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <NuxtLink to="/" class="flex items-center gap-2.5 font-display text-xl font-black">
            <span class="brand-dot" /> {{ siteName }}
          </NuxtLink>
          <p class="mt-3 max-w-xs text-sm text-white/60">
            Cars and motorcycles for rent — by the day, week or month. Pick up in store or have it delivered.
          </p>
          <div class="mt-5 flex gap-3">
            <a v-if="socials.facebook" :href="socials.facebook" target="_blank" rel="noopener noreferrer" aria-label="Facebook" class="rounded-full border border-white/20 p-2.5 text-white/70 transition hover:border-volt hover:text-volt"><UIcon name="i-simple-icons-facebook" class="h-4 w-4" /></a>
            <a v-if="socials.instagram" :href="socials.instagram" target="_blank" rel="noopener noreferrer" aria-label="Instagram" class="rounded-full border border-white/20 p-2.5 text-white/70 transition hover:border-volt hover:text-volt"><UIcon name="i-simple-icons-instagram" class="h-4 w-4" /></a>
          </div>
        </div>

        <div>
          <h3 class="eyebrow !text-white/40">Rent</h3>
          <ul class="mt-4 space-y-2.5 text-sm">
            <li><NuxtLink to="/catalog?vehicleType=car" class="text-white/70 transition hover:text-white">Cars</NuxtLink></li>
            <li><NuxtLink to="/catalog?vehicleType=motorcycle" class="text-white/70 transition hover:text-white">Motorcycles</NuxtLink></li>
            <li><NuxtLink to="/catalog" class="text-white/70 transition hover:text-white">All vehicles</NuxtLink></li>
            <li><NuxtLink to="/faq" class="text-white/70 transition hover:text-white">FAQ</NuxtLink></li>
          </ul>
        </div>

        <div>
          <h3 class="eyebrow !text-white/40">Company</h3>
          <ul class="mt-4 space-y-2.5 text-sm">
            <li><NuxtLink to="/about" class="text-white/70 transition hover:text-white">About Us</NuxtLink></li>
            <li><NuxtLink to="/contact" class="text-white/70 transition hover:text-white">Contact</NuxtLink></li>
            <li><NuxtLink to="/policies/rental" class="text-white/70 transition hover:text-white">Rental Policy</NuxtLink></li>
            <li><NuxtLink to="/policies/terms" class="text-white/70 transition hover:text-white">Terms of Service</NuxtLink></li>
            <li><NuxtLink to="/policies/privacy" class="text-white/70 transition hover:text-white">Privacy Policy</NuxtLink></li>
          </ul>
        </div>

        <div>
          <h3 class="eyebrow !text-white/40">Contact</h3>
          <ul class="mt-4 space-y-2.5 text-sm text-white/70">
            <li>{{ contact.email }}</li>
            <li>{{ contact.phone }}</li>
            <li v-if="contact.address">{{ contact.address }}</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="border-t border-white/10 py-6 text-center text-xs text-white/40">
      © {{ year }} {{ siteName }}. All rights reserved.
    </div>
  </footer>
</template>
