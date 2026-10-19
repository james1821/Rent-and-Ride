import type { AsyncDataOptions } from 'nuxt/app'

// Page-level data fetching tuned for perceived speed:
//   - On the server: block, so the first HTML render already contains the data
//     (SEO + no blank flash when landing directly on a page).
//   - On the client: never block the route change. The new page mounts
//     immediately and renders `pending`-driven skeletons while data loads.
//
// Callers still `await` this: on the server the promise resolves once data is
// ready; on the client it resolves immediately (useLazyAsyncData defers the
// fetch to `onBeforeMount`).
export function usePageData<T>(
  key: string | (() => string),
  handler: () => Promise<T>,
  options: AsyncDataOptions<T> = {}
) {
  return import.meta.server
    ? useAsyncData<T>(key, handler, options)
    : useLazyAsyncData<T>(key, handler, options)
}
