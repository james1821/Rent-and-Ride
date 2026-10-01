import { getAdminFirestore } from '../../utils/firebaseAdmin'
import { requireAdmin } from '../../utils/auth'
import { ok, fail } from '../../utils/apiResponse'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!

  const ref = getAdminFirestore().collection('banners').doc(id)
  const doc = await ref.get()
  if (!doc.exists) return fail(404, 'Banner not found')

  await ref.delete()
  return ok({ id }, 'Banner deleted')
})
