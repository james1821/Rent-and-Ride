<script setup lang="ts">
// Marketing/sales shell used by the landing page (app/pages/index.vue).
// The rental storefront keeps using layouts/default.vue.
const siteName = useRuntimeConfig().public.siteName
const year = new Date().getFullYear()
const open = ref(false)

// Contact details are the same ones configured in Admin → Settings (settings/general).
const { data: general } = useAsyncData('site-general', async () => {
  try {
    const res = await $fetch<{ success: boolean; data: any }>('/api/settings/general')
    return res.success ? res.data : null
  } catch { return null }
})
const contact = computed(() => ({
  email: general.value?.contactEmail || 'hello@example.com',
  phone: general.value?.contactPhone || '+63 917 000 0000'
}))

const links = [
  { label: 'How it works', to: '/#how-it-works' },
  { label: 'Admin dashboard', to: '/#admin' },
  { label: 'Customization', to: '/#customization' },
  { label: 'vs Shopify', to: '/#comparison' },
  { label: 'Support', to: '/#support' }
]

watch(() => open.value, (isOpen) => {
  if (import.meta.client) document.documentElement.style.overflow = isOpen ? 'hidden' : ''
})
onUnmounted(() => { if (import.meta.client) document.documentElement.style.overflow = '' })
</script>

<template>
  <div class="flex min-h-screen flex-col bg-canvas">
    <header class="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-md">
      <div class="container-page flex h-16 items-center gap-4">
        <NuxtLink to="/" class="flex shrink-0 items-center gap-2.5 font-display text-xl font-black tracking-tight text-ink">
          <span class="brand-dot" /> {{ siteName }}
        </NuxtLink>

        <nav class="ml-4 hidden items-center gap-1 text-sm font-semibold lg:flex" aria-label="Main">
          <NuxtLink
            v-for="link in links" :key="link.label" :to="link.to"
            class="rounded-full px-3.5 py-2 text-ink-muted transition hover:bg-sunken hover:text-ink"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <div class="ml-auto flex items-center gap-2">
          <NuxtLink to="/demo" class="hidden rounded-full px-3.5 py-2 text-sm font-semibold text-ink-muted transition hover:text-ink sm:block">
            Live demo
          </NuxtLink>
          <NuxtLink to="/#contact" class="btn-primary !px-5 !py-2.5">Book a Demo</NuxtLink>
          <button class="rounded-full p-2 text-ink transition hover:bg-sunken lg:hidden" aria-label="Open menu" @click="open = true">
            <UIcon name="i-heroicons-bars-3" class="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="on-dark mt-24 bg-ink text-white">
      <div class="container-page py-16">
        <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div class="lg:col-span-2">
            <NuxtLink to="/" class="flex items-center gap-2.5 font-display text-xl font-black">
              <span class="brand-dot" /> {{ siteName }}
            </NuxtLink>
            <p class="mt-3 max-w-sm text-sm text-white/60">
              A complete car &amp; motorcycle rental platform with a storefront, bookings and an admin dashboard.
              Buy it as-is or have it customized for your business.
            </p>
          </div>

          <div>
            <h3 class="eyebrow !text-white/40">Platform</h3>
            <ul class="mt-4 space-y-2.5 text-sm">
              <li><NuxtLink to="/#how-it-works" class="text-white/70 transition hover:text-white">How it works</NuxtLink></li>
              <li><NuxtLink to="/#admin" class="text-white/70 transition hover:text-white">Admin dashboard</NuxtLink></li>
              <li><NuxtLink to="/#customization" class="text-white/70 transition hover:text-white">Customization</NuxtLink></li>
              <li><NuxtLink to="/#comparison" class="text-white/70 transition hover:text-white">Compared to Shopify</NuxtLink></li>
              <li><NuxtLink to="/#support" class="text-white/70 transition hover:text-white">Developer support</NuxtLink></li>
            </ul>
          </div>

          <div>
            <h3 class="eyebrow !text-white/40">Try it &amp; contact</h3>
            <ul class="mt-4 space-y-2.5 text-sm">
              <li><NuxtLink to="/demo" class="text-white/70 transition hover:text-white">Live storefront demo</NuxtLink></li>
              <li><NuxtLink to="/catalog" class="text-white/70 transition hover:text-white">Browse the catalog</NuxtLink></li>
              <li><NuxtLink to="/#contact" class="text-white/70 transition hover:text-white">Book a demo</NuxtLink></li>
              <li><a :href="`mailto:${contact.email}`" class="text-white/70 transition hover:text-white">{{ contact.email }}</a></li>
              <li class="text-white/70">{{ contact.phone }}</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="border-t border-white/10 py-6">
        <div class="container-page flex flex-col items-center justify-between gap-2 text-xs text-white/40 sm:flex-row">
          <p>© {{ year }} {{ siteName }}. All rights reserved.</p>
          <p class="font-mono">Built with Nuxt · Firebase · Cloudinary</p>
        </div>
      </div>
    </footer>

    <!-- Mobile menu -->
    <Teleport to="body">
      <div v-if="open" class="fixed inset-0 z-[60] flex flex-col bg-ink text-white animate-fade-in lg:hidden">
        <div class="flex h-16 items-center justify-between px-4">
          <span class="flex items-center gap-2.5 font-display text-xl font-black"><span class="brand-dot" /> {{ siteName }}</span>
          <button class="rounded-full p-2 hover:bg-white/10" aria-label="Close menu" @click="open = false">
            <UIcon name="i-heroicons-x-mark" class="h-6 w-6" />
          </button>
        </div>
        <nav class="flex-1 space-y-1 overflow-y-auto px-4 pt-6" aria-label="Mobile">
          <NuxtLink
            v-for="link in links" :key="link.label" :to="link.to" @click="open = false"
            class="block border-b border-white/10 py-4 font-display text-3xl font-extrabold uppercase tracking-tight transition hover:text-volt"
          >
            {{ link.label }}
          </NuxtLink>
          <div class="grid gap-3 pt-8 text-lg font-semibold text-white/80">
            <NuxtLink to="/demo" @click="open = false">Live demo</NuxtLink>
            <NuxtLink to="/#contact" class="text-volt" @click="open = false">Book a Demo</NuxtLink>
          </div>
        </nav>
      </div>
    </Teleport>
  </div>
</template>
