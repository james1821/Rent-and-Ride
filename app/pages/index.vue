<script setup lang="ts">
// Sales landing page: this platform is a product for sale, not a rental
// business we operate. The live storefront lives at /demo.
definePageMeta({ layout: 'marketing' })

const siteName = useRuntimeConfig().public.siteName

// Same contact details configured in Admin → Settings (settings/general).
const { data: general } = useAsyncData('site-general', async () => {
  try {
    const res = await $fetch<{ success: boolean; data: any }>('/api/settings/general')
    return res.success ? res.data : null
  } catch { return null }
})
const contact = computed(() => ({
  email: general.value?.contactEmail || 'hello@example.com',
  phone: general.value?.contactPhone || '09754652169'
}))

const steps = [
  { icon: 'i-heroicons-magnifying-glass', title: 'Explore the Platform', text: 'Click through the live storefront: catalog and filters, availability calendar, cart, checkout and customer accounts.' },
  { icon: 'i-heroicons-paint-brush', title: 'Customize for Your Business', text: 'Rebrand it, restructure the catalog, adjust pricing and workflows, and add the features your operation needs.' },
  { icon: 'i-heroicons-squares-2x2', title: 'Preview Admin Dashboard', text: 'See the dashboard your staff will actually use to manage bookings, fleet, customers and settings.' },
  { icon: 'i-heroicons-rocket-launch', title: 'Launch with Developer Support', text: 'I handle deployment, setup and handover, with optional maintenance once you go live.' }
]

// Only features that are implemented in this codebase.
const features = [
  { icon: 'i-heroicons-clipboard-document-list', title: 'Bookings', text: 'The full rental lifecycle, from pending through confirmed, active, overdue, returned and completed, with status transitions and notes.' },
  { icon: 'i-heroicons-truck', title: 'Fleet', text: 'Vehicles with specs, pricing and photos, organised by category and subcategory, plus optional per-unit inventory (plate / VIN and condition).' },
  { icon: 'i-heroicons-users', title: 'Customers', text: 'A customer directory with search, free-form notes and enable/disable controls, alongside each customer’s rental history.' },
  { icon: 'i-heroicons-chart-bar', title: 'Analytics', text: 'Dashboard totals for rentals, pending, active, overdue, customers and revenue, plus upcoming rentals and your most-rented vehicles.' },
  { icon: 'i-heroicons-cog-6-tooth', title: 'Settings', text: 'Company details, contact information and social links. Editable from the admin panel, no code changes required.' },
  { icon: 'i-heroicons-megaphone', title: 'Marketing', text: 'Hero banners, coupon codes with limits and validity, and a scheduled promotional popup for the storefront.' }
]

const customizations = [
  { title: 'Branding', text: 'Your name, logo, colours and typography across the storefront and admin.' },
  { title: 'Design', text: 'The storefront look can be restyled or rebuilt around your brand guidelines.' },
  { title: 'Catalog structure', text: 'Categories and subcategories shaped around your fleet, whether that is cars, scooters or something else.' },
  { title: 'Pricing & rules', text: 'Daily, weekly and monthly rates, deposits, and how availability is calculated.' },
  { title: 'Workflows', text: 'Rental statuses, pickup versus delivery, and who on your team can see or change what.' },
  { title: 'Features', text: 'Modules can be added or removed, so you only pay for what your business actually uses.' }
]

const support = [
  { icon: 'i-heroicons-cloud-arrow-up', title: 'Deployment', text: 'Hosting set up for your environment (Vercel, Netlify or your own server), with domains and configuration handled.' },
  { icon: 'i-heroicons-wrench-screwdriver', title: 'Setup', text: 'Project configuration, admin account creation and importing your existing fleet and data.' },
  { icon: 'i-heroicons-code-bracket', title: 'Custom development', text: 'New screens and workflows, and additional integrations built to your requirements.' },
  { icon: 'i-heroicons-lifebuoy', title: 'Optional maintenance', text: 'Ongoing updates, monitoring and support after launch. Available as a separate arrangement.' }
]

// Honest comparison. Shopify can run rentals with third-party apps, so the
// wording focuses on what each option includes by default and what you own.
const comparison = [
  {
    label: 'Built for rentals',
    custom: 'Date ranges, daily, weekly and monthly rates, deposits and the rental lifecycle are included.',
    shopify: 'A product store. Rental logic comes from third-party apps.'
  },
  {
    label: 'Source code',
    custom: 'You get the full codebase and can change any part of it.',
    shopify: 'You customize themes and install apps. The platform code stays closed.'
  },
  {
    label: 'Ongoing cost',
    custom: 'Buy the codebase once. You pay hosting, database and image storage directly.',
    shopify: 'A monthly subscription, plus subscriptions for the apps you add.'
  },
  {
    label: 'Your data',
    custom: 'Lives in your own Firebase project, under your account and access rules.',
    shopify: 'Stored on Shopify and reached through their admin and export tools.'
  },
  {
    label: 'Custom features',
    custom: 'New screens, statuses and workflows can be built for how you work.',
    shopify: 'Limited to what the platform and available apps support.'
  },
  {
    label: 'Hosting',
    custom: 'Deploy to Vercel, Netlify or any Node host you choose.',
    shopify: 'Runs only on Shopify.'
  }
]

// --- Contact form -----------------------------------------------------------
// There is no mail backend in this project, so the form composes a pre-filled
// email to the address configured in Admin → Settings. No new dependency.
const form = reactive({ name: '', email: '', company: '', topic: 'Book a demo', message: '' })
const error = ref('')
const sent = ref(false)

function submit() {
  error.value = ''
  if (!form.name.trim() || !form.email.trim()) { error.value = 'Please add your name and email.'; return }
  const subject = `${form.topic}: ${siteName} platform`
  const body = [
    `Name: ${form.name}`,
    `Email: ${form.email}`,
    form.company ? `Business: ${form.company}` : '',
    `Interested in: ${form.topic}`,
    '',
    form.message
  ].filter(Boolean).join('\n')
  if (import.meta.client) {
    window.location.href = `mailto:${contact.value.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }
  sent.value = true
}
</script>

<template>
  <div>
    <!-- ================= HERO ================= -->
    <section class="on-dark relative overflow-hidden bg-ink text-white">
      <div class="container-page relative py-20 text-center sm:py-28">
        <p class="eyebrow !text-volt animate-fade-up">Car &amp; motorcycle rental software</p>
        <h1 class="mx-auto mt-5 max-w-4xl text-[clamp(2.5rem,7vw,4.75rem)] animate-fade-up" style="animation-delay:.06s">
          Your Rental Business.<br>Your Rules.<br><span class="text-volt">Your Platform.</span>
        </h1>
        <p class="mx-auto mt-7 max-w-xl text-lg text-white/70 animate-fade-up" style="animation-delay:.12s">
          A complete rental platform with a storefront, bookings and an admin dashboard.
          Buy it, brand it and customize it for your business.
        </p>

        <div class="mt-9 flex flex-wrap justify-center gap-3 animate-fade-up" style="animation-delay:.18s">
          <a href="#contact" class="btn-light !px-8 !py-4 text-base">
            Book a Demo <UIcon name="i-heroicons-arrow-right" class="h-4 w-4" />
          </a>
          <NuxtLink to="/demo" class="btn-outline-light !px-8 !py-4 text-base">
            Explore Website
          </NuxtLink>
        </div>

        <ul class="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs font-medium text-white/60">
          <li class="flex items-center gap-2"><UIcon name="i-heroicons-check-circle" class="h-4 w-4 text-volt" /> Storefront &amp; admin in one codebase</li>
          <li class="flex items-center gap-2"><UIcon name="i-heroicons-check-circle" class="h-4 w-4 text-volt" /> Role-based admin &amp; customer accounts</li>
          <li class="flex items-center gap-2"><UIcon name="i-heroicons-check-circle" class="h-4 w-4 text-volt" /> Live availability &amp; coupon support</li>
        </ul>
      </div>
    </section>

    <!-- ================= STOREFRONT PREVIEW ================= -->
    <section class="container-page relative z-10 -mt-10 sm:-mt-16">
      <div class="mx-auto max-w-4xl">
        <MarketingBrowserFrame url="your-business.com/catalog">
          <MarketingStorefrontMock />
        </MarketingBrowserFrame>
        <p class="mt-3 text-center text-xs text-ink-muted">
          The customer-facing storefront: catalog, filters and vehicle pages. Fully responsive.
        </p>
      </div>
    </section>

    <!-- ================= HOW IT WORKS ================= -->
    <section id="how-it-works" class="container-page scroll-mt-20 py-20 sm:py-28">
      <div class="max-w-2xl">
        <p class="eyebrow">How it works</p>
        <h2 class="mt-3 text-4xl sm:text-5xl">From demo to your own platform</h2>
        <p class="mt-4 text-ink-muted">Four steps. You decide what gets built.</p>
      </div>

      <ol class="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <li v-for="(step, i) in steps" :key="step.title" class="card-lift rounded-xl border border-line bg-surface p-6">
          <div class="flex items-center justify-between">
            <span class="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-volt"><UIcon :name="step.icon" class="h-5 w-5" /></span>
            <span class="font-display text-3xl font-black text-sunken">0{{ i + 1 }}</span>
          </div>
          <h3 class="mt-5 text-lg text-ink">{{ step.title }}</h3>
          <p class="mt-2 text-sm text-ink-muted">{{ step.text }}</p>
        </li>
      </ol>
    </section>

    <!-- ================= ADMIN DASHBOARD ================= -->
    <section id="admin" class="on-dark scroll-mt-20 bg-ink py-20 text-white sm:py-28">
      <div class="container-page">
        <div class="max-w-2xl">
          <p class="eyebrow !text-volt">Admin dashboard</p>
          <h2 class="mt-3 text-4xl sm:text-5xl">Everything your team needs, in one place</h2>
          <p class="mt-4 text-white/70">
            The admin panel is included. This is the dashboard as it looks today.
          </p>
        </div>

        <div class="mt-12">
          <MarketingBrowserFrame url="your-business.com/admin">
            <MarketingAdminDashboardMock />
          </MarketingBrowserFrame>
          <p class="mt-3 text-center text-xs text-white/40">Dashboard preview. Sample data.</p>
        </div>

        <div class="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="f in features" :key="f.title" class="rounded-xl border border-white/10 bg-white/5 p-6 transition hover:border-volt/60">
            <span class="flex h-11 w-11 items-center justify-center rounded-full bg-volt text-ink"><UIcon :name="f.icon" class="h-5 w-5" /></span>
            <h3 class="mt-5 text-lg text-white">{{ f.title }}</h3>
            <p class="mt-2 text-sm text-white/60">{{ f.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= CUSTOMIZATION ================= -->
    <section id="customization" class="container-page scroll-mt-20 py-20 sm:py-28">
      <div class="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <div class="lg:sticky lg:top-24">
          <p class="eyebrow">Customization</p>
          <h2 class="mt-3 text-4xl sm:text-5xl">Made to be tailored</h2>
          <p class="mt-4 text-ink-muted">
            Every rental business runs differently. The platform can be adapted to match how you work.
          </p>
          <NuxtLink to="/#contact" class="btn-primary mt-8">Discuss your requirements</NuxtLink>
        </div>

        <ul class="grid gap-4 sm:grid-cols-2">
          <li v-for="c in customizations" :key="c.title" class="rounded-xl border border-line bg-surface p-5">
            <h3 class="text-base text-ink">{{ c.title }}</h3>
            <p class="mt-1.5 text-sm text-ink-muted">{{ c.text }}</p>
          </li>
        </ul>
      </div>
    </section>

    <!-- ================= COMPARISON ================= -->
    <section id="comparison" class="scroll-mt-20 bg-sunken/60 py-20 sm:py-28">
      <div class="container-page">
        <div class="max-w-2xl">
          <p class="eyebrow">Why custom</p>
          <h2 class="mt-3 text-4xl sm:text-5xl">Built for rentals, not general retail</h2>
          <p class="mt-4 text-ink-muted">
            Shopify is a good e-commerce platform. It is not built around date-based rentals.
            Here is how the two differ for a rental business.
          </p>
        </div>

        <div class="mt-12 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <div class="hidden gap-4 border-b border-line bg-sunken/70 px-6 py-4 text-xs font-bold uppercase tracking-wide text-ink-muted md:grid md:grid-cols-[0.9fr_1.15fr_1.15fr]">
            <span>Compare</span>
            <span class="text-ink">This platform</span>
            <span>Shopify</span>
          </div>

          <div
            v-for="row in comparison" :key="row.label"
            class="grid gap-3 border-b border-line px-5 py-5 last:border-0 md:grid-cols-[0.9fr_1.15fr_1.15fr] md:items-start md:gap-4 md:px-6"
          >
            <p class="font-display text-sm font-bold text-ink">{{ row.label }}</p>

            <div class="flex gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 h-4 w-4 shrink-0 text-ok" />
              <p class="text-sm text-ink"><span class="font-semibold md:hidden">This platform: </span>{{ row.custom }}</p>
            </div>

            <div class="flex gap-2">
              <UIcon name="i-heroicons-minus-circle" class="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
              <p class="text-sm text-ink-muted"><span class="font-semibold md:hidden">Shopify: </span>{{ row.shopify }}</p>
            </div>
          </div>
        </div>

        <p class="mt-4 max-w-3xl text-xs text-ink-muted">
          Shopify can run rentals with third-party apps. This comparison is about what each option
          includes by default and what you own. Subscription and app pricing is set by Shopify,
          so check their current plans for exact costs.
        </p>

        <div class="mt-8 flex flex-wrap gap-3">
          <NuxtLink to="/#contact" class="btn-primary">Book a Demo</NuxtLink>
          <NuxtLink to="/demo" class="btn-outline">Explore Website</NuxtLink>
        </div>
      </div>
    </section>

    <!-- ================= DEVELOPER SUPPORT ================= -->
    <section id="support" class="scroll-mt-20 bg-sunken/60 py-20 sm:py-28">
      <div class="container-page">
        <div class="max-w-2xl">
          <p class="eyebrow">Developer support</p>
          <h2 class="mt-3 text-4xl sm:text-5xl">You buy the platform. I help you run it</h2>
          <p class="mt-4 text-ink-muted">
            I handle the technical work, from deployment to later changes.
          </p>
        </div>

        <div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="s in support" :key="s.title" class="card-lift rounded-xl border border-line bg-surface p-6">
            <span class="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-volt"><UIcon :name="s.icon" class="h-5 w-5" /></span>
            <h3 class="mt-5 text-lg text-ink">{{ s.title }}</h3>
            <p class="mt-2 text-sm text-ink-muted">{{ s.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= FINAL CTA + CONTACT ================= -->
    <section id="contact" class="container-page scroll-mt-20 py-20 sm:py-28">
      <div class="on-dark overflow-hidden rounded-2xl bg-ink text-white">
        <div class="grid gap-12 p-8 sm:p-12 lg:grid-cols-2 lg:p-16">
          <div>
            <p class="eyebrow !text-volt">Get started</p>
            <h2 class="mt-3 text-4xl sm:text-5xl">See it on your own fleet</h2>
            <p class="mt-4 text-white/70">
              Tell me about your business. I will walk you through the storefront and admin
              dashboard, then send a quote for the customization you need.
            </p>

            <div class="mt-8 space-y-3 text-sm">
              <a :href="`mailto:${contact.email}`" class="flex items-center gap-3 text-white/80 transition hover:text-volt">
                <UIcon name="i-heroicons-envelope" class="h-5 w-5" /> {{ contact.email }}
              </a>
              <p class="flex items-center gap-3 text-white/80">
                <UIcon name="i-heroicons-phone" class="h-5 w-5" /> {{ contact.phone }}
              </p>
              <NuxtLink to="/demo" class="flex items-center gap-3 text-white/80 transition hover:text-volt">
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="h-5 w-5" /> Take a look at the live demo
              </NuxtLink>
            </div>
          </div>

          <form class="space-y-4 rounded-xl bg-white p-6 text-ink shadow-pop sm:p-8" @submit.prevent="submit">
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-full px-4 py-2 text-sm font-bold transition"
                :class="form.topic === 'Book a demo' ? 'bg-ink text-white' : 'border border-line text-ink-muted hover:text-ink'"
                @click="form.topic = 'Book a demo'"
              >Book a Demo</button>
              <button
                type="button"
                class="rounded-full px-4 py-2 text-sm font-bold transition"
                :class="form.topic === 'Request a quote' ? 'bg-ink text-white' : 'border border-line text-ink-muted hover:text-ink'"
                @click="form.topic = 'Request a quote'"
              >Request a Quote</button>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="eyebrow">Name</span>
                <input v-model="form.name" type="text" required class="input mt-1.5" placeholder="Your name">
              </label>
              <label class="block">
                <span class="eyebrow">Email</span>
                <input v-model="form.email" type="email" required class="input mt-1.5" placeholder="you@company.com">
              </label>
            </div>

            <label class="block">
              <span class="eyebrow">Business name <span class="normal-case tracking-normal">(optional)</span></span>
              <input v-model="form.company" type="text" class="input mt-1.5" placeholder="Your rental business">
            </label>

            <label class="block">
              <span class="eyebrow">What do you need?</span>
              <textarea v-model="form.message" rows="4" class="input mt-1.5" placeholder="Fleet size, the features you need, timelines…" />
            </label>

            <p v-if="error" class="text-sm text-danger">{{ error }}</p>
            <p v-else-if="sent" class="text-sm text-ok">
              Your email client should have opened with the details. If it did not, email
              <a :href="`mailto:${contact.email}`" class="font-semibold underline">{{ contact.email }}</a>.
            </p>

            <button type="submit" class="btn-primary w-full !py-3.5">
              {{ form.topic }} <UIcon name="i-heroicons-arrow-right" class="h-4 w-4" />
            </button>
            <p class="text-center text-xs text-ink-muted">Opens your email app with the details filled in.</p>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>
