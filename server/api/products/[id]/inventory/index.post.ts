import { getAdminFirestore, FieldValue } from '../../../../utils/firebaseAdmin'
import { requireAdmin } from '../../../../utils/auth'
import { ok, fail } from '../../../../utils/apiResponse'
import { z } from 'zod'

const unitSchema = z.object({
  serialNumber: z.string().min(1).max(80),
  condition: z.enum(['excellent', 'good', 'fair', 'needs-repair']).default('excellent'),
  notes: z.string().max(1000).optional()
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const productId = getRouterParam(event, 'id')!

  const body = await readBody(event)
  const parsed = unitSchema.safeParse(body)
  if (!parsed.success) return fail(400, parsed.error.issues.map((i) => i.message).join('; '))

  const db = getAdminFirestore()
  const productRef = db.collection('products').doc(productId)
  const productDoc = await productRef.get()
  if (!productDoc.exists) return fail(404, 'Product not found')

  const clash = await db.collection('inventory')
    .where('productId', '==', productId)
    .where('serialNumber', '==', parsed.data.serialNumber)
    .limit(1).get()
  if (!clash.empty) return fail(409, `Serial "${parsed.data.serialNumber}" already exists for this product`)

  const ref = db.collection('inventory').doc()
  const now = FieldValue.serverTimestamp()

  await db.runTransaction(async (tx) => {
    tx.set(ref, {
      productId,
      serialNumber: parsed.data.serialNumber,
      condition: parsed.data.condition,
      notes: parsed.data.notes ?? null,
      status: 'available',
      createdAt: now,
      updatedAt: now
    })
    tx.update(productRef, {
      quantityTotal: FieldValue.increment(1),
      quantityAvailable: FieldValue.increment(1),
      updatedAt: now
    })
  })

  const created = await ref.get()
  return ok({ id: ref.id, ...created.data() }, 'Unit added')
})
