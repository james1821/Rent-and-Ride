import { getAdminFirestore, FieldValue } from '../../utils/firebaseAdmin'
import { requireAdmin } from '../../utils/auth'
import { ok, fail } from '../../utils/apiResponse'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const key = getRouterParam(event, 'key')!
  const body = await readBody(event)

  if (typeof body !== 'object' || body === null) {
    return fail(400, 'Request body must be an object')
  }

  await getAdminFirestore().collection('settings').doc(key).set(
    { ...body, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  )
  return ok(null, 'Settings updated')
})
