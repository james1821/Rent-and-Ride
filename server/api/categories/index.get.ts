import { getAdminFirestore } from '../../utils/firebaseAdmin'
import { requireAdmin } from '../../utils/auth'
import { cachedResponse } from '../../utils/memoryCache'
import { ok, fail } from '../../utils/apiResponse'
import type { Category } from '~/types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  let includeInactive = false

  if (query.includeInactive === 'true') {
    // Only admins can see inactive categories.
    try {
      await requireAdmin(event)
      includeInactive = true
    } catch {
      includeInactive = false
    }
  }

  try {
    const categories = await cachedResponse(`categories:${includeInactive}`, includeInactive ? 0 : 20000, async () => {
      const db = getAdminFirestore()
      let ref = db.collection('categories').orderBy('sortOrder', 'asc') as FirebaseFirestore.Query
      if (!includeInactive) {
        ref = db.collection('categories').where('status', '==', 'active').orderBy('sortOrder', 'asc')
      }
      const snap = await ref.get()
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category))
    })
    return ok(categories)
  } catch (err: any) {
    return fail(500, err.message ?? 'Failed to load categories')
  }
})
