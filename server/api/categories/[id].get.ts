import { getAdminFirestore } from '../../utils/firebaseAdmin'
import { ok, fail } from '../../utils/apiResponse'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const doc = await getAdminFirestore().collection('categories').doc(id).get()
  if (!doc.exists) return fail(404, 'Category not found')
  return ok({ id: doc.id, ...doc.data() })
})
