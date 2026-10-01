import { z } from 'zod'
import { getAdminFirestore, FieldValue } from '../../utils/firebaseAdmin'
import { requireAuth } from '../../utils/auth'
import { ok, fail } from '../../utils/apiResponse'

const addressSchema = z.object({
  label: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  province: z.string().min(1),
  postalCode: z.string().min(1),
  isDefault: z.boolean().default(false)
})

// Excludes stats/notes — those are admin/server-only.
const selfUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  addresses: z.array(addressSchema).optional()
})

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody(event)
  const parsed = selfUpdateSchema.safeParse(body)
  if (!parsed.success) return fail(400, parsed.error.issues.map((i) => i.message).join('; '))

  const ref = getAdminFirestore().collection('customers').doc(auth.uid)
  const doc = await ref.get()
  if (!doc.exists) return fail(404, 'Customer profile not found')

  await ref.update({ ...parsed.data, updatedAt: FieldValue.serverTimestamp() })
  const updated = await ref.get()
  return ok({ id: ref.id, ...updated.data() }, 'Profile updated')
})
