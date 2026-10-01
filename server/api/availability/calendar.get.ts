import { getAdminFirestore } from '../../utils/firebaseAdmin'
import { ok, fail } from '../../utils/apiResponse'

const BLOCKING_STATUSES = [
  'PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY', 'ACTIVE', 'RETURN_PENDING', 'RETURNED', 'COMPLETED', 'OVERDUE'
]

// Returns per-day available quantity for [from, to] so the date picker
// can grey out fully-booked days.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const productId = query.productId as string
  const from = (query.from as string) ?? new Date().toISOString().slice(0, 10)
  const to = query.to as string

  if (!productId || !to) return fail(400, 'productId and to are required')

  try {
    const db = getAdminFirestore()
    const productDoc = await db.collection('products').doc(productId).get()
    if (!productDoc.exists) return fail(404, 'Product not found')
    const totalQuantity: number = productDoc.data()!.quantityTotal ?? 0

    const itemsSnap = await db.collection('rentalItems')
      .where('productId', '==', productId)
      .where('rentalStatus', 'in', BLOCKING_STATUSES)
      .get()

    const reservations = itemsSnap.docs.map((d) => {
      const item = d.data()
      return { start: item.startDate as string, end: item.endDate as string, quantity: item.quantity as number }
    })

    const dayMap: Record<string, number> = {}
    const cursor = new Date(from + 'T00:00:00Z')
    const end = new Date(to + 'T00:00:00Z')

    while (cursor <= end) {
      const iso = cursor.toISOString().slice(0, 10)
      const reserved = reservations
        .filter((r) => iso >= r.start && iso <= r.end)
        .reduce((sum, r) => sum + r.quantity, 0)
      dayMap[iso] = Math.max(0, totalQuantity - reserved)
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }

    return ok({ productId, totalQuantity, days: dayMap })
  } catch (err: any) {
    return fail(500, err.message ?? 'Failed to load availability calendar')
  }
})
