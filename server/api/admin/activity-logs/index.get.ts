import { getAdminFirestore } from '../../../utils/firebaseAdmin'
import { requireAdmin } from '../../../utils/auth'
import { ok, fail } from '../../../utils/apiResponse'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  try {
    const snap = await getAdminFirestore().collection('activityLogs').orderBy('createdAt', 'desc').limit(200).get()
    return ok(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  } catch (err: any) {
    return fail(500, err.message ?? 'Failed to load activity logs')
  }
})
