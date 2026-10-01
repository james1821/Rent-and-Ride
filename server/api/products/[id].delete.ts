import { getAdminFirestore, FieldValue } from '../../utils/firebaseAdmin'
import { requireAdmin } from '../../utils/auth'
import { ok, fail } from '../../utils/apiResponse'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!

  const ref = getAdminFirestore().collection('products').doc(id)
  const doc = await ref.get()
  if (!doc.exists) return fail(404, 'Vehicle not found')

  // Archived, not deleted — past rentalItems still reference this product.
  await ref.update({ status: 'archived', isRentable: false, updatedAt: FieldValue.serverTimestamp() })
  return ok({ id }, 'Product archived')
})
