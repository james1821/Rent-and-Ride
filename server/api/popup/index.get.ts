import { getAdminFirestore } from '../../utils/firebaseAdmin'
import { ok } from '../../utils/apiResponse'
import { POPUP_COLLECTION, POPUP_DOC, DEFAULT_POPUP, isPopupLive } from '../../utils/popup'

// Public: returns the promotional popup only when it is enabled and inside
// its schedule; otherwise `null`. Never throws — the storefront treats any
// failure as "no popup".
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  try {
    const doc = await getAdminFirestore().collection(POPUP_COLLECTION).doc(POPUP_DOC).get()
    if (!doc.exists) return ok(null)
    const p = { ...DEFAULT_POPUP, ...doc.data() }
    if (!isPopupLive(p)) return ok(null)
    return ok({
      title: p.title, description: p.description, secondaryText: p.secondaryText,
      imageUrl: p.imageUrl, ctaLabel: p.ctaLabel, ctaHref: p.ctaHref,
      frequency: p.frequency, firstVisitOnly: p.firstVisitOnly, delaySeconds: p.delaySeconds,
      startDate: p.startDate, endDate: p.endDate, version: p.version
    })
  } catch {
    return ok(null)
  }
})
