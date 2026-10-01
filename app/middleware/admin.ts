// Same auth wait as middleware/auth.ts, plus an admin/staff role check.
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const { isAuthenticated, isAdmin, authReady } = useAuth()

  const decide = () => {
    if (!isAuthenticated.value) return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    if (!isAdmin.value) return navigateTo('/')
    return undefined
  }

  if (authReady.value) return decide()

  return new Promise((resolve) => {
    const stop = watch(authReady, (ready) => {
      if (!ready) return
      stop()
      resolve(decide())
    })
  })
})
