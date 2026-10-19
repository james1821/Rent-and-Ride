<template>
  <div>
    <!-- Thin progress bar for route changes; instant feedback while a page loads. -->
    <NuxtLoadingIndicator color="#C8FF2E" :height="3" :throttle="80" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UNotifications />
  </div>
</template>
