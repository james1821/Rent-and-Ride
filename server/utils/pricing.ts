import { getAdminFirestore } from './firebaseAdmin'
import { calculateDurationDays } from './rentalAvailability'
import type { Coupon } from '~/types'

export interface PricingLineInput {
  productId: string
  quantity: number
  startDate: string
  endDate: string
}

export interface PricedLine extends PricingLineInput {
  productName: string
  productSku: string
  productImage: string
  pricePerDay: number
  durationDays: number
  lineTotal: number
  deposit: number
}

export interface PricingResult {
  lines: PricedLine[]
  subtotal: number
  deposit: number
  discount: number
  total: number
  appliedCoupon?: { id: string; code: string }
}

// Picks the cheapest applicable rate (daily, or weekly/monthly once
// duration clears their threshold).
function resolveDailyEquivalentRate(
  pricing: { daily: number; weekly?: number; monthly?: number },
  durationDays: number
): number {
  const candidates: number[] = [pricing.daily]

  if (pricing.weekly && durationDays >= 7) {
    const weeks = Math.floor(durationDays / 7)
    const remainderDays = durationDays % 7
    const weeklyEquivalent = (weeks * pricing.weekly + remainderDays * pricing.daily) / durationDays
    candidates.push(weeklyEquivalent)
  }
  if (pricing.monthly && durationDays >= 30) {
    const months = Math.floor(durationDays / 30)
    const remainderDays = durationDays % 30
    const monthlyEquivalent = (months * pricing.monthly + remainderDays * pricing.daily) / durationDays
    candidates.push(monthlyEquivalent)
  }

  return Math.min(...candidates)
}

// Recomputes full pricing from live product data. Used at cart display and
// checkout; client-submitted prices are never trusted.
export async function calculatePricing(
  lines: PricingLineInput[],
  couponCode?: string
): Promise<PricingResult> {
  if (lines.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot price an empty rental' })
  }

  const db = getAdminFirestore()

  const pricedLines: PricedLine[] = await Promise.all(
    lines.map(async (line) => {
      const productDoc = await db.collection('products').doc(line.productId).get()
      if (!productDoc.exists) {
        throw createError({ statusCode: 404, statusMessage: `Product ${line.productId} not found` })
      }
      const product = productDoc.data()!

      if (product.status !== 'active' || product.isRentable === false) {
        throw createError({
          statusCode: 400,
          statusMessage: `${product.name} is not currently available for rent`
        })
      }
      if (line.quantity < 1) {
        throw createError({ statusCode: 400, statusMessage: 'Quantity must be at least 1' })
      }

      const durationDays = calculateDurationDays(line.startDate, line.endDate)
      const effectiveDailyRate = resolveDailyEquivalentRate(product.pricing, durationDays)
      const lineTotal = Math.round(effectiveDailyRate * durationDays * line.quantity)

      return {
        ...line,
        productName: product.name,
        productSku: product.sku,
        productImage: product.images?.[0] ?? '',
        pricePerDay: Math.round(effectiveDailyRate),
        durationDays,
        lineTotal,
        deposit: (product.pricing.deposit ?? 0) * line.quantity
      }
    })
  )

  const subtotal = pricedLines.reduce((sum, l) => sum + l.lineTotal, 0)
  const deposit = pricedLines.reduce((sum, l) => sum + l.deposit, 0)

  let discount = 0
  let appliedCoupon: PricingResult['appliedCoupon']

  if (couponCode) {
    const couponSnap = await db
      .collection('coupons')
      .where('code', '==', couponCode.trim().toUpperCase())
      .limit(1)
      .get()

    if (couponSnap.empty) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid coupon code' })
    }
    const couponDoc = couponSnap.docs[0]!
    const coupon = couponDoc.data() as Coupon
    const now = new Date()

    if (coupon.status !== 'active') {
      throw createError({ statusCode: 400, statusMessage: 'This coupon is no longer active' })
    }
    if (now < new Date(coupon.validFrom) || now > new Date(coupon.validTo)) {
      throw createError({ statusCode: 400, statusMessage: 'This coupon has expired' })
    }
    if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
      throw createError({
        statusCode: 400,
        statusMessage: `This coupon requires a subtotal of at least ₱${coupon.minSubtotal.toLocaleString()}`
      })
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw createError({ statusCode: 400, statusMessage: 'This coupon has reached its usage limit' })
    }

    discount = coupon.type === 'percent'
      ? Math.round(subtotal * (coupon.value / 100))
      : Math.min(coupon.value, subtotal)

    appliedCoupon = { id: couponDoc.id, code: coupon.code }
  }

  const total = subtotal - discount + deposit

  return { lines: pricedLines, subtotal, deposit, discount, total, appliedCoupon }
}
