import { getAdminFirestore } from '../../utils/firebaseAdmin'
import { requireAdmin } from '../../utils/auth'
import { cachedResponse } from '../../utils/memoryCache'
import { ok, fail } from '../../utils/apiResponse'
import type { Banner } from '~/types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const placement = query.placement as 'hero' | 'promo' | undefined

  let includeInactive = false
  if (query.includeInactive === 'true') {
    try { await requireAdmin(event); includeInactive = true } catch { includeInactive = false }
  }

  try {
    const banners = await cachedResponse(`banners:${placement ?? ''}:${includeInactive}`, includeInactive ? 0 : 20000, async () => {
      const db = getAdminFirestore()
      let ref = db.collection('banners') as FirebaseFirestore.Query
      if (placement) ref = ref.where('placement', '==', placement)
      if (!includeInactive) ref = ref.where('status', '==', 'active')
      ref = ref.orderBy('sortOrder', 'asc')
      const snap = await ref.get()
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Banner))
    })
    return ok(banners)
  } catch (err: any) {
    return fail(500, err.message ?? 'Failed to load banners')
  }
})
