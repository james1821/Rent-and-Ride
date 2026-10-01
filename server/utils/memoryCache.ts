// Tiny in-process TTL cache for public, read-mostly Firestore queries
// (categories, subcategories, banners, product lists). Every uncached request
// is a network round-trip to Firestore, which dominates page load time.
// Only cache data that is identical for every visitor — never admin/inactive views.
const store = new Map<string, { exp: number; val: unknown }>()
const MAX_ENTRIES = 500

export async function cachedResponse<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  if (ttlMs <= 0) return fn()
  const hit = store.get(key)
  if (hit && hit.exp > Date.now()) return hit.val as T
  const val = await fn() // errors propagate and are never cached
  if (store.size >= MAX_ENTRIES) store.clear()
  store.set(key, { exp: Date.now() + ttlMs, val })
  return val
}
