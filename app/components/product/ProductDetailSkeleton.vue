<template>
  <div class="container-page py-8 sm:py-12">
    <div class="skeleton h-4 w-28" />

    <div class="mt-6 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
      <div>
        <div class="skeleton aspect-[4/3] w-full rounded-2xl" />
        <div class="mt-3 flex flex-wrap gap-3">
          <div v-for="i in 4" :key="i" class="skeleton h-16 w-24 rounded-lg" />
        </div>
        <div class="mt-10">
          <div class="skeleton h-8 w-24" />
          <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div v-for="i in 4" :key="i" class="skeleton h-24 rounded-xl" />
          </div>
        </div>
      </div>

      <div>
        <div class="skeleton h-3 w-24" />
        <div class="skeleton mt-3 h-10 w-3/4" />
        <div class="skeleton mt-4 h-6 w-32" />
        <div class="skeleton mt-4 h-9 w-40" />
        <div class="skeleton mt-6 h-64 w-full rounded-2xl" />
      </div>
    </div>
  </div>
</template>
