<script setup lang="ts">
// First-visit promotional popup. Configuration comes from the backend
// (/api/popup, managed at Admin → Promotional Popup); nothing is hard-coded.
// Mounted once in the storefront layout. Renders nothing until (and unless)
// an eligible popup has been loaded, so failures are invisible to visitors.
import type { PromoPopupConfig } from '~/composables/usePromoPopup'

const { loadEligiblePopup, markDismissed } = usePromoPopup()
const route = useRoute()

// Don't interrupt these flows.
const SUPPRESSED = ['/checkout', '/cart', '/login', '/register']

const popup = ref<{ config: PromoPopupConfig; imageOk: boolean } | null>(null)
const open = ref(false)
const dialog = ref<HTMLElement | null>(null)
let showTimer: ReturnType<typeof setTimeout> | null = null
let previousFocus: HTMLElement | null = null
const titleId = 'promo-popup-title'

onMounted(async () => {
  const eligible = await loadEligiblePopup()
  if (!eligible) return
  popup.value = eligible
  showTimer = setTimeout(show, Math.max(0, eligible.config.delaySeconds) * 1000)
})
onBeforeUnmount(() => {
  if (showTimer) clearTimeout(showTimer)
  unlock()
})

function show() {
  if (SUPPRESSED.some((p) => route.path.startsWith(p))) return // try again on next page load
  previousFocus = document.activeElement as HTMLElement | null
  open.value = true
  lock()
  nextTick(() => dialog.value?.querySelector<HTMLElement>('[data-popup-close]')?.focus())
}

function close() {
  if (!open.value) return
  open.value = false
  unlock()
  if (popup.value) markDismissed(popup.value.config)
  previousFocus?.focus?.()
}

function lock() { document.documentElement.style.overflow = 'hidden' }
function unlock() { document.documentElement.style.overflow = '' }

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') { e.preventDefault(); close(); return }
  if (e.key !== 'Tab' || !dialog.value) return
  // Keep keyboard focus inside the dialog.
  const focusables = dialog.value.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
  if (!focusables.length) return
  const first = focusables[0]!
  const last = focusables[focusables.length - 1]!
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <div
        v-if="open && popup"
        class="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm animate-fade-in sm:items-center sm:p-6"
        @click.self="close"
        @keydown="onKeydown"
      >
        <div
          ref="dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="popup.config.title ? titleId : undefined"
          aria-label="Promotion"
          class="my-auto w-full max-w-3xl animate-pop-in"
        >
          <PromoPopupCard
            :title="popup.config.title"
            :description="popup.config.description"
            :secondary-text="popup.config.secondaryText"
            :image-url="popup.config.imageUrl"
            :show-image="popup.imageOk"
            :cta-label="popup.config.ctaLabel"
            :cta-href="popup.config.ctaHref"
            :title-id="titleId"
            @close="close"
            @cta="close"
          />
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>
