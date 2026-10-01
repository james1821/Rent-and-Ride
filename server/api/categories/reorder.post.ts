import { getAdminFirestore, FieldValue } from '../../utils/firebaseAdmin'
import { requireAdmin } from '../../utils/auth'
import { ok, fail } from '../../utils/apiResponse'
import { z } from 'zod'

const reorderSchema = z.object({
  order: z.array(z.object({ id: z.string(), sortOrder: z.number().int() })).min(1)
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const parsed = reorderSchema.safeParse(body)
  if (!parsed.success) return fail(400, parsed.error.issues.map((i) => i.message).join('; '))

  const db = getAdminFirestore()
  const batch = db.batch()
  for (const { id, sortOrder } of parsed.data.order) {
    batch.update(db.collection('categories').doc(id), { sortOrder, updatedAt: FieldValue.serverTimestamp() })
  }
  await batch.commit()
  return ok(null, 'Category order updated')
})
