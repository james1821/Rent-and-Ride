import { doc, setDoc, onSnapshot, arrayUnion, arrayRemove } from 'firebase/firestore'

const productIds = ref<string[]>([])
let unsubscribe: (() => void) | null = null

export function useFavorites() {
  const { $firestore } = useNuxtApp()
  const { currentUser } = useAuth()

  function favRef(uid: string) {
    return doc($firestore, 'favorites', uid)
  }

  function watchFavorites() {
    if (unsubscribe) return
    const uid = currentUser.value?.uid
    if (!uid) return
    unsubscribe = onSnapshot(
      favRef(uid),
      (snap) => {
        productIds.value = snap.exists() ? (snap.data().productIds ?? []) : []
      },
      (err) => {
        console.warn('[favorites] listener stopped:', err.code ?? err.message)
        unsubscribe = null
        productIds.value = []
      }
    )
  }

  /** Stops the Firestore listener and clears local state (call on sign-out). */
  function stopWatching() {
    if (unsubscribe) { unsubscribe(); unsubscribe = null }
    productIds.value = []
  }

  const isFavorite = (productId: string) => productIds.value.includes(productId)

  async function toggleFavorite(productId: string) {
    const uid = currentUser.value?.uid
    if (!uid) throw new Error('Sign in to save favorites')

    // Optimistic update — flip immediately, Firestore write happens after.
    const wasFavorite = isFavorite(productId)
    productIds.value = wasFavorite
      ? productIds.value.filter((id) => id !== productId)
      : [...productIds.value, productId]

    try {
      await setDoc(
        favRef(uid),
        { customerId: uid, productIds: wasFavorite ? arrayRemove(productId) : arrayUnion(productId), updatedAt: new Date().toISOString() },
        { merge: true }
      )
    } catch (err) {
      // Roll back on failure.
      productIds.value = wasFavorite
        ? [...productIds.value, productId]
        : productIds.value.filter((id) => id !== productId)
      if ((err as any)?.code === 'permission-denied') {
        throw new Error('Could not save favorite: permission denied. Make sure the Firestore rules are deployed and your account is active.')
      }
      throw err
    }
  }

  return { productIds, watchFavorites, stopWatching, isFavorite, toggleFavorite }
}
