import { z } from 'zod'
import { getAdminFirestore, FieldValue } from '../../utils/firebaseAdmin'
import { requireCustomer } from '../../utils/auth'
import { ok, fail } from '../../utils/apiResponse'
import { checkAvailabilityBatch, calculateDurationDays } from '../../utils/rentalAvailability'
import { calculatePricing } from '../../utils/pricing'
import { nextRentalNumber } from '../../utils/rentalNumber'

const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1),
    startDate: z.string().min(1),
    endDate: z.string().min(1)
  })).min(1, 'At least one item is required'),
  fulfillment: z.object({
    method: z.enum(['pickup', 'delivery']),
    address: z.object({
      line1: z.string().min(1),
      line2: z.string().optional(),
      city: z.string().min(1),
      province: z.string().min(1),
      postalCode: z.string().min(1)
    }).optional()
  }),
  notes: z.string().max(1000).optional(),
  couponCode: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const auth = await requireCustomer(event)

  const body = await readBody(event)
  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) return fail(400, parsed.error.issues.map((i) => i.message).join('; '))
  const input = parsed.data

  if (input.fulfillment.method === 'delivery' && !input.fulfillment.address) {
    return fail(400, 'Delivery address is required for delivery fulfillment')
  }

  const today = new Date().toISOString().slice(0, 10)
  for (const item of input.items) {
    if (item.endDate < item.startDate) {
      return fail(400, `Invalid date range for one of the items: end date is before start date`)
    }
    if (item.startDate < today) {
      return fail(400, `Rental dates cannot start in the past`)
    }
  }

  const db = getAdminFirestore()

  // Re-verify availability server-side.
  const availability = await checkAvailabilityBatch(input.items)
  if (!availability.allAvailable) {
    const unavailable = availability.results.filter((r) => !r.isAvailable)
    return fail(409, `Vehicle is not available for the selected dates: ${
      unavailable.map((r) => r.productId).join(', ')
    }`, 'AVAILABILITY_CONFLICT')
  }

  // Server-computed pricing — client-submitted numbers are ignored.
  const pricing = await calculatePricing(input.items, input.couponCode)

  const customerDoc = await db.collection('customers').doc(auth.uid).get()
  if (!customerDoc.exists) {
    return fail(400, 'Complete your customer profile before booking a rental')
  }
  const customer = customerDoc.data()!
  const customerSnapshot = {
    name: `${customer.firstName} ${customer.lastName}`.trim(),
    email: customer.email,
    phone: customer.phone
  }

  const overallStart = input.items.reduce((min, i) => (i.startDate < min ? i.startDate : min), input.items[0]!.startDate)
  const overallEnd = input.items.reduce((max, i) => (i.endDate > max ? i.endDate : max), input.items[0]!.endDate)

  // Create rental + rentalItems atomically.
  const rentalRef = db.collection('rentals').doc()

  try {
    await db.runTransaction(async (tx) => {
      // Re-check availability inside the transaction to close the race window.
      for (const item of input.items) {
        const conflictSnap = await tx.get(
          db.collection('rentalItems')
            .where('productId', '==', item.productId)
            .where('rentalStatus', 'in', [
              'PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP',
              'OUT_FOR_DELIVERY', 'ACTIVE', 'RETURN_PENDING', 'RETURNED', 'COMPLETED', 'OVERDUE'
            ])
        )
        const productSnap = await tx.get(db.collection('products').doc(item.productId))
        if (!productSnap.exists) throw createError({ statusCode: 404, statusMessage: 'Product no longer exists' })
        const product = productSnap.data()!

        let reserved = 0
        for (const d of conflictSnap.docs) {
          const it = d.data()
          if (item.startDate <= it.endDate && item.endDate >= it.startDate) reserved += it.quantity
        }
        const available = (product.quantityTotal ?? 0) - reserved
        if (available < item.quantity) {
          throw createError({
            statusCode: 409,
            statusMessage: `${product.name} became unavailable for the selected dates`,
            data: { success: false, message: `${product.name} became unavailable for the selected dates`, code: 'AVAILABILITY_CONFLICT' }
          })
        }
      }

      const rentalNumber = await nextRentalNumber(tx)
      const now = FieldValue.serverTimestamp()
      const nowIso = new Date().toISOString()

      tx.set(rentalRef, {
        rentalNumber,
        customerId: auth.uid,
        customerSnapshot,
        startDate: overallStart,
        endDate: overallEnd,
        durationDays: calculateDurationDays(overallStart, overallEnd),
        fulfillment: input.fulfillment,
        status: 'PENDING',
        pricing: {
          subtotal: pricing.subtotal,
          discount: pricing.discount,
          deposit: pricing.deposit,
          total: pricing.total
        },
        couponId: pricing.appliedCoupon?.id ?? null,
        notes: input.notes ?? null,
        internalNotes: null,
        statusHistory: [{ status: 'PENDING', changedBy: auth.uid, changedAt: nowIso, note: null }],
        createdAt: now,
        updatedAt: now
      })

      for (const line of pricing.lines) {
        const itemRef = db.collection('rentalItems').doc()
        tx.set(itemRef, {
          rentalId: rentalRef.id,
          productId: line.productId,
          productSnapshot: { name: line.productName, sku: line.productSku, image: line.productImage },
          quantity: line.quantity,
          pricePerDay: line.pricePerDay,
          lineTotal: line.lineTotal,
          startDate: line.startDate,
          endDate: line.endDate,
          rentalStatus: 'PENDING'
        })

        // Keep the display-only quantityAvailable cache roughly in sync.
        tx.update(db.collection('products').doc(line.productId), {
          quantityAvailable: FieldValue.increment(-line.quantity)
        })
      }

      if (pricing.appliedCoupon) {
        tx.update(db.collection('coupons').doc(pricing.appliedCoupon.id), {
          usedCount: FieldValue.increment(1)
        })
      }

      tx.set(db.collection('activityLogs').doc(), {
        actorId: auth.uid,
        action: 'rental.created',
        targetType: 'rental',
        targetId: rentalRef.id,
        metadata: { rentalNumber, total: pricing.total },
        createdAt: now
      })
    })
  } catch (err: any) {
    return fail(err.statusCode ?? 500, err.statusMessage ?? err.message ?? 'Failed to create rental', err.data?.code)
  }

  const created = await rentalRef.get()
  return ok({ id: rentalRef.id, ...created.data() }, 'Rental created successfully')
})
