import { getAdminFirestore } from '../../../utils/firebaseAdmin'
import { requireAdmin } from '../../../utils/auth'
import { ok, fail } from '../../../utils/apiResponse'
import type { Rental } from '~/types'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  try {
    const db = getAdminFirestore()

    const [rentalsSnap, customersSnap, productsSnap] = await Promise.all([
      db.collection('rentals').get(),
      db.collection('customers').get(),
      db.collection('products').where('status', '==', 'active').get()
    ])

    const rentals = rentalsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Rental))

    const pending = rentals.filter((r) => r.status === 'PENDING').length
    const active = rentals.filter((r) => r.status === 'ACTIVE').length
    const overdue = rentals.filter((r) => r.status === 'OVERDUE').length
    const completedRentals = rentals.filter((r) => r.status === 'COMPLETED')
    const revenue = completedRentals.reduce((sum, r) => sum + (r.pricing?.total ?? 0), 0)

    const todayIso = new Date().toISOString().slice(0, 10)
    const in7DaysIso = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    const upcoming = rentals
      .filter((r) => ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(r.status))
      .filter((r) => r.startDate >= todayIso && r.startDate <= in7DaysIso)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, 10)

    const recent = [...rentals]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)

    // Popular vehicles: count rentalItems per product across all rentals.
    const itemsSnap = await db.collection('rentalItems').get()
    const countByProduct = new Map<string, { name: string; count: number }>()
    for (const doc of itemsSnap.docs) {
      const item = doc.data()
      const key = item.productId as string
      const entry = countByProduct.get(key) ?? { name: item.productSnapshot?.name ?? 'Unknown', count: 0 }
      entry.count += item.quantity ?? 1
      countByProduct.set(key, entry)
    }
    const popularVehicles = Array.from(countByProduct.entries())
      .map(([productId, v]) => ({ productId, name: v.name, timesRented: v.count }))
      .sort((a, b) => b.timesRented - a.timesRented)
      .slice(0, 5)

    return ok({
      totals: {
        totalRentals: rentals.length,
        pendingRentals: pending,
        activeRentals: active,
        overdueRentals: overdue,
        totalCustomers: customersSnap.size,
        totalProducts: productsSnap.size,
        revenue
      },
      upcomingRentals: upcoming,
      recentRentals: recent,
      popularVehicles
    })
  } catch (err: any) {
    return fail(500, err.message ?? 'Failed to load dashboard stats')
  }
})
