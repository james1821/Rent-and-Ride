import { getAdminFirestore, FieldValue } from '../../utils/firebaseAdmin'
import { requireAdmin } from '../../utils/auth'
import { ok, fail } from '../../utils/apiResponse'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!

  const ref = getAdminFirestore().collection('subcategories').doc(id)
  const doc = await ref.get()
  if (!doc.exists) return fail(404, 'Subcategory not found')

  await ref.update({ status: 'inactive', updatedAt: FieldValue.serverTimestamp() })
  return ok({ id }, 'Subcategory deactivated')
})
