import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import type { CartItem } from '~/types'

const items = ref<CartItem[]>([])
const pricingPreview = ref<{ subtotal: number; deposit: number; discount: number; total: number; lines: any[] } | null>(null)
const loadingPricing = ref(false)
let unsubscribe: (() => void) | null = null

export function useCart() {
  const { $firestore } = useNuxtApp()
  const { currentUser } = useAuth()
  const { apiFetch } = useApi()

  function cartRef(uid: string) {
    return doc($firestore, 'cart', uid)
  }

  function watchCart() {
    if (unsubscribe) return
    const uid = currentUser.value?.uid
    if (!uid) return
    unsubscribe = onSnapshot(
      cartRef(uid),
      (snap) => {
        items.value = snap.exists() ? (snap.data().items ?? []) : []
        refreshPricing()
      },
      (err) => {
        // e.g. permission-denied; don't leave an uncaught listener error behind.
        console.warn('[cart] listener stopped:', err.code ?? err.message)
        unsubscribe = null
        items.value = []
      }
    )
  }

  /** Stops the Firestore listener and clears local state (call on sign-out). */
  function stopWatching() {
    if (unsubscribe) { unsubscribe(); unsubscribe = null }
    items.value = []
    pricingPreview.value = null
  }

  async function persist() {
    const uid = currentUser.value?.uid
    if (!uid) throw new Error('You must be signed in to use the cart')
    await setDoc(cartRef(uid), { customerId: uid, items: items.value, updatedAt: new Date().toISOString() })
  }

  async function addItem(item: CartItem) {
    const existingIndex = items.value.findIndex(
      (i) => i.productId === item.productId && i.startDate === item.startDate && i.endDate === item.endDate
    )
    if (existingIndex >= 0) {
      items.value[existingIndex]!.quantity += item.quantity
    } else {
      items.value.push(item)
    }
    await persist()
  }

  async function removeItem(productId: string, startDate: string, endDate: string) {
    items.value = items.value.filter(
      (i) => !(i.productId === productId && i.startDate === startDate && i.endDate === endDate)
    )
    await persist()
  }

  async function updateQuantity(productId: string, startDate: string, endDate: string, quantity: number) {
    const line = items.value.find((i) => i.productId === productId && i.startDate === startDate && i.endDate === endDate)
    if (line) line.quantity = Math.max(1, quantity)
    await persist()
  }

  async function updateDates(productId: string, oldStart: string, oldEnd: string, newStart: string, newEnd: string) {
    const line = items.value.find((i) => i.productId === productId && i.startDate === oldStart && i.endDate === oldEnd)
    if (line) { line.startDate = newStart; line.endDate = newEnd }
    await persist()
  }

  async function clear() {
    items.value = []
    await persist()
  }

  /** Always re-derives totals from the server — never trusts anything computed client-side. */
  async function refreshPricing(couponCode?: string) {
    if (items.value.length === 0) {
      pricingPreview.value = null
      return
    }
    loadingPricing.value = true
    try {
      pricingPreview.value = await apiFetch('/api/cart/price', {
        method: 'POST',
        body: { lines: items.value, couponCode }
      })
    } catch {
      pricingPreview.value = null
    } finally {
      loadingPricing.value = false
    }
  }

  const itemCount = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0))

  return {
    items, pricingPreview, loadingPricing, itemCount,
    watchCart, stopWatching, addItem, removeItem, updateQuantity, updateDates, clear, refreshPricing
  }
}
