import { getAdminFirestore } from '../../../../utils/firebaseAdmin'
import { requireAdmin } from '../../../../utils/auth'
import { ok } from '../../../../utils/apiResponse'
import type { InventoryUnit } from '~/types'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const productId = getRouterParam(event, 'id')!

  const snap = await getAdminFirestore()
    .collection('inventory')
    .where('productId', '==', productId)
    .get()

  const units: InventoryUnit[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryUnit))
  return ok(units)
})
