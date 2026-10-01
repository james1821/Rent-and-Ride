// Waits for Firebase's initial auth check (client-only), then either lets the
// navigation through or sends guests to /login with a redirect back.
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return // Firebase auth state only resolves client-side

  const { isAuthenticated, authReady } = useAuth()

  const decide = () =>
    isAuthenticated.value ? undefined : navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)

  // Auth already resolved (the normal case for in-app link clicks): decide now.
  if (authReady.value) return decide()

  // Otherwise wait for it. NOTE: no `immediate: true` here — calling the stop
  // handle from inside an immediate callback hits a temporal-dead-zone error
  // and silently kills the navigation.
  return new Promise((resolve) => {
    const stop = watch(authReady, (ready) => {
      if (!ready) return
      stop()
      resolve(decide())
    })
  })
})
