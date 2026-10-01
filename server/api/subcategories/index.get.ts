import { getAdminFirestore } from '../../utils/firebaseAdmin'
import { requireAdmin } from '../../utils/auth'
import { cachedResponse } from '../../utils/memoryCache'
import { ok, fail } from '../../utils/apiResponse'
import type { Subcategory } from '~/types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const categoryId = query.categoryId as string | undefined

  let includeInactive = false
  if (query.includeInactive === 'true') {
    try { await requireAdmin(event); includeInactive = true } catch { includeInactive = false }
  }

  try {
    const subcategories = await cachedResponse(`subcategories:${categoryId ?? ''}:${includeInactive}`, includeInactive ? 0 : 20000, async () => {
      const db = getAdminFirestore()
      let ref = db.collection('subcategories') as FirebaseFirestore.Query
      if (categoryId) ref = ref.where('categoryId', '==', categoryId)
      if (!includeInactive) ref = ref.where('status', '==', 'active')
      ref = ref.orderBy('sortOrder', 'asc')
      const snap = await ref.get()
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Subcategory))
    })
    return ok(subcategories)
  } catch (err: any) {
    return fail(500, err.message ?? 'Failed to load subcategories')
  }
})
