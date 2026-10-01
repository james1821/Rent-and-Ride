<script setup lang="ts">
// `mobile` renders the same nav as an always-visible panel (used inside the
// slide-over in layouts/admin.vue); desktop mode is hidden below `lg`.
defineProps<{ mobile?: boolean }>()
const emit = defineEmits<{ (e: 'navigate'): void }>()

const route = useRoute()
const siteName = useRuntimeConfig().public.siteName

const sections = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: '/admin', icon: 'i-heroicons-squares-2x2' }]
  },
  {
    label: 'Rentals',
    items: [
      { label: 'All Rentals', to: '/admin/rentals', icon: 'i-heroicons-clipboard-document-list' },
      { label: 'Pending', to: '/admin/rentals/pending', icon: 'i-heroicons-clock' },
      { label: 'Active', to: '/admin/rentals?status=ACTIVE', icon: 'i-heroicons-bolt' },
      { label: 'Overdue', to: '/admin/rentals?status=OVERDUE', icon: 'i-heroicons-exclamation-triangle' }
    ]
  },
  {
    label: 'Customers',
    items: [{ label: 'All Customers', to: '/admin/customers', icon: 'i-heroicons-users' }]
  },
  {
    label: 'Catalog',
    items: [
      { label: 'Categories', to: '/admin/categories', icon: 'i-heroicons-tag' },
      { label: 'Vehicles', to: '/admin/products', icon: 'i-heroicons-truck' }
    ]
  },
  {
    label: 'Marketing',
    items: [
      { label: 'Promotional Popup', to: '/admin/popup', icon: 'i-heroicons-megaphone' },
      { label: 'Banners', to: '/admin/banners', icon: 'i-heroicons-photo' },
      { label: 'Coupons', to: '/admin/coupons', icon: 'i-heroicons-ticket' }
    ]
  },
  {
    label: 'System',
    items: [
      { label: 'Settings', to: '/admin/settings', icon: 'i-heroicons-cog-6-tooth' },
      { label: 'Activity Logs', to: '/admin/activity-logs', icon: 'i-heroicons-document-text' }
    ]
  }
]

function isActive(to: string) {
  const path = to.split('?')[0]
  return route.path === path
}
</script>

<template>
  <aside
    class="on-dark w-64 shrink-0 bg-ink text-white"
    :class="mobile ? 'block h-full overflow-y-auto' : 'hidden lg:block'"
  >
    <div class="flex h-16 items-center gap-2.5 border-b border-white/10 px-6 font-display text-lg font-extrabold tracking-tight">
      <span class="brand-dot" /> {{ siteName }} <span class="rounded-full bg-volt px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-widest text-ink">Admin</span>
    </div>
    <nav class="space-y-6 px-4 py-6">
      <div v-for="section in sections" :key="section.label">
        <p class="px-2 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">{{ section.label }}</p>
        <ul class="mt-2 space-y-1">
          <li v-for="item in section.items" :key="item.to">
            <NuxtLink
              :to="item.to"
              @click="emit('navigate')"
              class="flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition"
              :class="isActive(item.to) ? 'bg-volt text-ink' : 'text-white/70 hover:bg-white/10 hover:text-white'"
            >
              <UIcon :name="item.icon" class="h-5 w-5" />
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </nav>
  </aside>
</template>
