import { getAdminFirestore } from '../../utils/firebaseAdmin'
import { requireAdmin } from '../../utils/auth'
import { ok, fail } from '../../utils/apiResponse'
import type { Coupon } from '~/types'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  try {
    const snap = await getAdminFirestore().collection('coupons').orderBy('validFrom', 'desc').get()
    const coupons: Coupon[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Coupon))
    return ok(coupons)
  } catch (err: any) {
    return fail(500, err.message ?? 'Failed to load coupons')
  }
})
