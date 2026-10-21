<script setup lang="ts">
interface Slide {
  title: string
  description: string
  imageUrl?: string
  ctaLabel: string
  ctaHref: string
  secondaryCtaLabel?: string
  secondaryCtaHref?: string
}

const props = defineProps<{ slides: Slide[] }>()

const active = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function go(index: number) {
  active.value = (index + props.slides.length) % props.slides.length
}

onMounted(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (props.slides.length > 1 && !reduce) timer = setInterval(() => go(active.value + 1), 7000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<template>
  <section class="on-dark relative w-full overflow-hidden bg-ink text-white">
    <div class="relative min-h-[560px] sm:min-h-[640px]">
      <TransitionGroup name="fade">
        <div v-for="(slide, i) in slides" v-show="i === active" :key="i" class="absolute inset-0">
          <template v-if="slide.imageUrl">
            <img :src="slide.imageUrl" :alt="slide.title" class="absolute inset-0 h-full w-full object-cover opacity-60">
            <div class="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/40" />
          </template>

          <div class="container-page relative flex h-full flex-col items-center justify-center py-20 text-center">
            <p class="eyebrow !text-volt animate-fade-up">Cars &amp; motorcycles for rent</p>
            <h1 class="mt-5 max-w-4xl text-[clamp(2.75rem,9vw,5rem)] animate-fade-up" style="animation-delay: .08s">{{ slide.title }}</h1>
            <p class="mt-6 max-w-xl text-base text-white/70 sm:text-lg animate-fade-up" style="animation-delay: .16s">{{ slide.description }}</p>
            <div class="mt-9 flex flex-wrap justify-center gap-3 animate-fade-up" style="animation-delay: .24s">
              <NuxtLink :to="slide.ctaHref" class="btn-light !px-8 !py-4 text-base">
                {{ slide.ctaLabel }} <UIcon name="i-heroicons-arrow-right" class="h-4 w-4" />
              </NuxtLink>
              <NuxtLink v-if="slide.secondaryCtaLabel" :to="slide.secondaryCtaHref ?? '/catalog'" class="btn-outline-light !px-8 !py-4 text-base">
                {{ slide.secondaryCtaLabel }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <div v-if="slides.length > 1" class="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
      <button
        v-for="(slide, i) in slides" :key="i"
        class="h-1.5 rounded-full transition-all"
        :class="i === active ? 'w-8 bg-volt' : 'w-2 bg-white/30 hover:bg-white/60'"
        :aria-label="`Go to slide ${i + 1}`"
        @click="go(i)"
      />
    </div>
  </section>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.6s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
