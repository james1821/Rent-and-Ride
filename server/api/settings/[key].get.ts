import { getAdminFirestore } from '../../utils/firebaseAdmin'
import { ok, fail } from '../../utils/apiResponse'

export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key')!
  const doc = await getAdminFirestore().collection('settings').doc(key).get()
  if (!doc.exists) return fail(404, `Setting "${key}" not found`)
  return ok(doc.data())
})
