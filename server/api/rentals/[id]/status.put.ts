import { z } from 'zod'
import { getAdminFirestore } from '../../../utils/firebaseAdmin'
import { requireAuth } from '../../../utils/auth'
import { ok, fail } from '../../../utils/apiResponse'
import { transitionRentalStatus } from '../../../utils/rentalStatus'
import { RENTAL_STATUSES } from '~/types'

const statusSchema = z.object({
  status: z.enum(RENTAL_STATUSES),
  note: z.string().max(1000).optional()
})

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const rentalId = getRouterParam(event, 'id')!
  const isStaff = auth.role === 'admin' || auth.role === 'staff'

  const body = await readBody(event)
  const parsed = statusSchema.safeParse(body)
  if (!parsed.success) return fail(400, parsed.error.issues.map((i) => i.message).join('; '))

  if (!isStaff) {
    // Customers can only cancel their own still-pending rental.
    if (parsed.data.status !== 'CANCELLED') {
      return fail(403, 'Only staff can set this status')
    }
    const doc = await getAdminFirestore().collection('rentals').doc(rentalId).get()
    if (!doc.exists) return fail(404, 'Rental not found')
    const rental = doc.data()!
    if (rental.customerId !== auth.uid) return fail(403, 'You do not have access to this rental')
    if (rental.status !== 'PENDING') {
      return fail(400, 'This rental can no longer be cancelled — please contact support')
    }
  }

  try {
    const result = await transitionRentalStatus({
      rentalId,
      toStatus: parsed.data.status,
      changedBy: auth.uid,
      note: parsed.data.note
    })
    return ok(result, `Rental marked as ${parsed.data.status.replace(/_/g, ' ').toLowerCase()}`)
  } catch (err: any) {
    return fail(err.statusCode ?? 500, err.statusMessage ?? err.message ?? 'Status update failed')
  }
})
