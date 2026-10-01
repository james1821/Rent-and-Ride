import { getAdminFirestore, FieldValue } from '../../../../utils/firebaseAdmin'
import { requireAdmin } from '../../../../utils/auth'
import { ok, fail } from '../../../../utils/apiResponse'
import { z } from 'zod'

const updateSchema = z.object({
  condition: z.enum(['excellent', 'good', 'fair', 'needs-repair']).optional(),
  status: z.enum(['available', 'rented', 'maintenance', 'retired']).optional(),
  notes: z.string().max(1000).optional()
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const unitId = getRouterParam(event, 'unitId')!

  const body = await readBody(event)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return fail(400, parsed.error.issues.map((i) => i.message).join('; '))

  const ref = getAdminFirestore().collection('inventory').doc(unitId)
  const doc = await ref.get()
  if (!doc.exists) return fail(404, 'Inventory unit not found')

  await ref.update({ ...parsed.data, updatedAt: FieldValue.serverTimestamp() })
  const updated = await ref.get()
  return ok({ id: ref.id, ...updated.data() }, 'Unit updated')
})
