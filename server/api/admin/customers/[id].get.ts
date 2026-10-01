import { getAdminFirestore } from '../../../utils/firebaseAdmin'
import { requireAdmin } from '../../../utils/auth'
import { ok, fail } from '../../../utils/apiResponse'
import type { Customer, Rental } from '~/types'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const db = getAdminFirestore()

  const customerDoc = await db.collection('customers').doc(id).get()
  if (!customerDoc.exists) return fail(404, 'Customer not found')
  const customer = { id: customerDoc.id, ...customerDoc.data() } as Customer

  const rentalsSnap = await db.collection('rentals')
    .where('customerId', '==', id)
    .orderBy('createdAt', 'desc')
    .get()
  const rentals: Rental[] = rentalsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Rental))

  return ok({
    customer,
    rentals,
    activeRentals: rentals.filter((r) => r.status === 'ACTIVE'),
    overdueRentals: rentals.filter((r) => r.status === 'OVERDUE')
  })
})
