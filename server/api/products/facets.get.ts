import { getAdminFirestore } from '../../utils/firebaseAdmin'
import { cachedResponse } from '../../utils/memoryCache'
import { ok, fail } from '../../utils/apiResponse'

// Distinct brands across active vehicles, for the catalog brand filter.
export default defineEventHandler(async () => {
  try {
    const brands = await cachedResponse('products:facets:brands', 60000, async () => {
      const snap = await getAdminFirestore().collection('products').where('status', '==', 'active').select('brand').get()
      const set = new Set<string>()
      snap.docs.forEach((d) => { const b = d.data().brand; if (typeof b === 'string' && b) set.add(b) })
      return Array.from(set).sort((a, b) => a.localeCompare(b))
    })
    return ok(brands)
  } catch (err: any) {
    return fail(500, err.message ?? 'Failed to load brands')
  }
})
