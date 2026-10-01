<template>
  <div class="flex min-h-screen flex-col bg-canvas">
    <a href="#main" class="sr-only z-[200] rounded-full bg-ink px-4 py-2 text-sm font-bold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
      Skip to content
    </a>
    <LayoutSiteHeader />
    <main id="main" class="flex-1">
      <slot />
    </main>
    <LayoutSiteFooter />
    <!-- First-visit promotional popup — configured in Admin → Promotional Popup -->
    <PromoPopupBanner />
  </div>
</template>
