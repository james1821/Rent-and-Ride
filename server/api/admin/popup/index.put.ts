import { getAdminFirestore, FieldValue } from '../../../utils/firebaseAdmin'
import { requireAdmin } from '../../../utils/auth'
import { ok, fail } from '../../../utils/apiResponse'
import { POPUP_COLLECTION, POPUP_DOC, DEFAULT_POPUP, popupInputSchema } from '../../../utils/popup'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const parsed = popupInputSchema.safeParse(body)
  if (!parsed.success) return fail(400, parsed.error.issues.map((i) => i.message).join('; '))

  const { resetDismissals, ...config } = parsed.data
  const ref = getAdminFirestore().collection(POPUP_COLLECTION).doc(POPUP_DOC)
  const current = (await ref.get()).data() as { version?: number } | undefined
  const version = resetDismissals || !current?.version ? Date.now() : current.version

  await ref.set({ ...config, version, updatedAt: FieldValue.serverTimestamp() })
  return ok({ ...DEFAULT_POPUP, ...config, version }, 'Popup saved')
})
