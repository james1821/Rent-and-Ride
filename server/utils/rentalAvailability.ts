import { getAdminFirestore } from './firebaseAdmin'
import type { RentalStatus } from '~/types'

// Statuses that hold a claim on inventory for their date range. Everything
// except CANCELLED blocks, including PENDING, to prevent double-booking
// while a request awaits approval.
const BLOCKING_STATUSES: RentalStatus[] = [
  'PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY', 'ACTIVE', 'RETURN_PENDING', 'RETURNED',
  'COMPLETED', 'OVERDUE'
]

export interface DateRange {
  startDate: string // ISO date, e.g. '2026-09-20'
  endDate: string
}

export interface AvailabilityResult {
  productId: string
  totalQuantity: number
  reservedQuantity: number
  availableQuantity: number
  isAvailable: boolean
  requestedQuantity: number
}

// Normalizes to midnight UTC for stable date-only comparisons.
function toUTCDate(iso: string): Date {
  const d = new Date(iso)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

// True if two inclusive date ranges overlap.
function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart <= bEnd && aEnd >= bStart
}

// Sums quantity reserved by other rentals overlapping the given date range.
// excludeRentalId skips a rental's own items when re-checking on edit.
export async function getReservedQuantity(
  productId: string,
  range: DateRange,
  excludeRentalId?: string
): Promise<number> {
  const db = getAdminFirestore()
  const requestedStart = toUTCDate(range.startDate)
  const requestedEnd = toUTCDate(range.endDate)

  // Firestore can't query date-range overlap directly, so filter by status
  // here and check the overlap in memory.
  const snapshot = await db
    .collection('rentalItems')
    .where('productId', '==', productId)
    .where('rentalStatus', 'in', BLOCKING_STATUSES)
    .get()

  let reserved = 0
  for (const doc of snapshot.docs) {
    const item = doc.data()
    if (excludeRentalId && item.rentalId === excludeRentalId) continue

    const itemStart = toUTCDate(item.startDate)
    const itemEnd = toUTCDate(item.endDate)

    if (rangesOverlap(requestedStart, requestedEnd, itemStart, itemEnd)) {
      reserved += item.quantity as number
    }
  }

  return reserved
}

// Authoritative availability check — use this, not products.quantityAvailable
// (a display-only cache), for any real booking decision.
export async function checkAvailability(
  productId: string,
  range: DateRange,
  requestedQuantity: number = 1,
  excludeRentalId?: string
): Promise<AvailabilityResult> {
  if (toUTCDate(range.endDate) < toUTCDate(range.startDate)) {
    throw createError({ statusCode: 400, statusMessage: 'endDate must not be before startDate' })
  }

  const db = getAdminFirestore()
  const productDoc = await db.collection('products').doc(productId).get()
  if (!productDoc.exists) {
    throw createError({ statusCode: 404, statusMessage: `Product ${productId} not found` })
  }
  const product = productDoc.data()!

  if (product.status !== 'active' || product.isRentable === false) {
    return {
      productId,
      totalQuantity: product.quantityTotal ?? 0,
      reservedQuantity: 0,
      availableQuantity: 0,
      isAvailable: false,
      requestedQuantity
    }
  }

  const totalQuantity: number = product.quantityTotal ?? 0
  const reservedQuantity = await getReservedQuantity(productId, range, excludeRentalId)
  const availableQuantity = Math.max(0, totalQuantity - reservedQuantity)

  return {
    productId,
    totalQuantity,
    reservedQuantity,
    availableQuantity,
    isAvailable: availableQuantity >= requestedQuantity,
    requestedQuantity
  }
}

// Checks availability for multiple line items at once (cart/checkout).
export async function checkAvailabilityBatch(
  lines: Array<{ productId: string; quantity: number; startDate: string; endDate: string }>,
  excludeRentalId?: string
): Promise<{ allAvailable: boolean; results: AvailabilityResult[] }> {
  const results = await Promise.all(
    lines.map((line) =>
      checkAvailability(
        line.productId,
        { startDate: line.startDate, endDate: line.endDate },
        line.quantity,
        excludeRentalId
      )
    )
  )
  return { allAvailable: results.every((r) => r.isAvailable), results }
}

// Inclusive day count between two ISO dates.
export function calculateDurationDays(startDate: string, endDate: string): number {
  const start = toUTCDate(startDate)
  const end = toUTCDate(endDate)
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.round((end.getTime() - start.getTime()) / msPerDay) + 1
}
