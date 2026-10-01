import { getAdminFirestore } from '../../utils/firebaseAdmin'
import { requireAuth } from '../../utils/auth'
import { ok, fail } from '../../utils/apiResponse'
import type { Rental, RentalItem } from '~/types'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const isStaff = auth.role === 'admin' || auth.role === 'staff'

  const db = getAdminFirestore()
  const doc = await db.collection('rentals').doc(id).get()
  if (!doc.exists) return fail(404, 'Rental not found')

  const rental = { id: doc.id, ...doc.data() } as Rental
  if (!isStaff && rental.customerId !== auth.uid) {
    return fail(403, 'You do not have access to this rental')
  }

  const itemsSnap = await db.collection('rentalItems').where('rentalId', '==', id).get()
  const items: RentalItem[] = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as RentalItem))

  return ok({ ...rental, items })
})
