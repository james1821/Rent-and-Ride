import { getAdminFirestore } from '../../../utils/firebaseAdmin'
import { requireAdmin } from '../../../utils/auth'
import { ok, fail } from '../../../utils/apiResponse'
import { POPUP_COLLECTION, POPUP_DOC, DEFAULT_POPUP } from '../../../utils/popup'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  try {
    const doc = await getAdminFirestore().collection(POPUP_COLLECTION).doc(POPUP_DOC).get()
    const { updatedAt, ...data } = (doc.data() ?? {}) as Record<string, unknown>
    return ok({ ...DEFAULT_POPUP, ...data })
  } catch (err: any) {
    return fail(500, err.message ?? 'Failed to load popup settings')
  }
})
