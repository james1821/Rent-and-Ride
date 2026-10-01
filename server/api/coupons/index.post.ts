import { z } from 'zod'
import { getAdminFirestore, FieldValue } from '../../utils/firebaseAdmin'
import { requireAdmin } from '../../utils/auth'
import { ok, fail } from '../../utils/apiResponse'

const couponSchema = z.object({
  code: z.string().min(3).max(30),
  type: z.enum(['percent', 'fixed']),
  value: z.number().positive(),
  minSubtotal: z.number().min(0).optional(),
  maxUses: z.number().int().positive().optional(),
  validFrom: z.string().min(1),
  validTo: z.string().min(1),
  status: z.enum(['active', 'inactive']).default('active')
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const parsed = couponSchema.safeParse(body)
  if (!parsed.success) return fail(400, parsed.error.issues.map((i) => i.message).join('; '))

  const code = parsed.data.code.toUpperCase()
  const db = getAdminFirestore()
  const clash = await db.collection('coupons').where('code', '==', code).limit(1).get()
  if (!clash.empty) return fail(409, `Coupon code "${code}" already exists`)

  const ref = db.collection('coupons').doc()
  const now = FieldValue.serverTimestamp()
  await ref.set({ ...parsed.data, code, usedCount: 0, createdAt: now, updatedAt: now })

  const created = await ref.get()
  return ok({ id: ref.id, ...created.data() }, 'Coupon created')
})
