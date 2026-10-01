<script setup lang="ts">
// Presentational popup card — shared by the storefront modal and the admin live preview.
import { isSafeLink } from '~/composables/usePromoPopup'

const props = defineProps<{
  title?: string
  description?: string
  secondaryText?: string
  imageUrl?: string
  ctaLabel?: string
  ctaHref?: string
  /** Set false when the image failed to load / was removed → text-only layout. */
  showImage?: boolean
  titleId?: string
  /** Always use the stacked (image on top) layout, e.g. in the admin preview. */
  stacked?: boolean
}>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'cta'): void }>()

const imageBroken = ref(false)
watch(() => props.imageUrl, () => { imageBroken.value = false })
const hasImage = computed(() => !!props.imageUrl && props.showImage !== false && !imageBroken.value && isSafeLink(props.imageUrl))
const hasCta = computed(() => !!props.ctaLabel && !!props.ctaHref && isSafeLink(props.ctaHref))
const isExternal = computed(() => !!props.ctaHref && !props.ctaHref.startsWith('/'))
</script>

<template>
  <div
    class="relative w-full overflow-hidden rounded-2xl shadow-pop"
    :class="hasImage ? ['bg-white text-ink', !stacked && 'md:grid md:grid-cols-[1fr_1fr]'] : 'on-dark speed-lines bg-ink text-white'"
  >
    <button
      type="button"
      class="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-card transition hover:scale-105 hover:bg-volt"
      aria-label="Close"
      data-popup-close
      @click="emit('close')"
    >
      <UIcon name="i-heroicons-x-mark" class="h-5 w-5" />
    </button>

    <div v-if="hasImage" :class="['relative aspect-[16/10] w-full overflow-hidden bg-ink', !stacked && 'md:aspect-auto md:min-h-[360px]']">
      <img :src="imageUrl" alt="" class="absolute inset-0 h-full w-full object-cover" @error="imageBroken = true">
    </div>

    <div class="flex flex-col justify-center p-6 sm:p-8 md:p-10" :class="!hasImage && 'min-h-[260px] pr-14'">
      <p v-if="secondaryText" class="eyebrow" :class="hasImage ? '' : '!text-volt'">{{ secondaryText }}</p>
      <h2 v-if="title" :id="titleId" class="mt-3 break-words text-3xl sm:text-4xl" :class="!stacked && 'md:text-[2.6rem]'">{{ title }}</h2>
      <p v-if="description" class="mt-4 text-sm leading-relaxed sm:text-base" :class="hasImage ? 'text-ink-muted' : 'text-white/70'">{{ description }}</p>

      <div v-if="hasCta" class="mt-7">
        <a
          v-if="isExternal" :href="ctaHref" target="_blank" rel="noopener noreferrer"
          :class="hasImage ? 'btn-primary' : 'btn-light'" @click="emit('cta')"
        >
          {{ ctaLabel }} <UIcon name="i-heroicons-arrow-up-right" class="h-4 w-4" />
        </a>
        <NuxtLink v-else :to="ctaHref" :class="hasImage ? 'btn-primary' : 'btn-light'" @click="emit('cta')">
          {{ ctaLabel }} <UIcon name="i-heroicons-arrow-right" class="h-4 w-4" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
