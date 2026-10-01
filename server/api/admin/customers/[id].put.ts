import { z } from 'zod'
import { getAdminAuth, getAdminFirestore, FieldValue } from '../../../utils/firebaseAdmin'
import { requireAdmin } from '../../../utils/auth'
import { ok, fail } from '../../../utils/apiResponse'

const addressSchema = z.object({
  label: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  province: z.string().min(1),
  postalCode: z.string().min(1),
  isDefault: z.boolean().default(false)
})

const adminUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  addresses: z.array(addressSchema).optional(),
  notes: z.string().max(5000).optional(),
  status: z.enum(['active', 'disabled']).optional()
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!

  const body = await readBody(event)
  const parsed = adminUpdateSchema.safeParse(body)
  if (!parsed.success) return fail(400, parsed.error.issues.map((i) => i.message).join('; '))

  const db = getAdminFirestore()
  const ref = db.collection('customers').doc(id)
  const doc = await ref.get()
  if (!doc.exists) return fail(404, 'Customer not found')

  await ref.update({ ...parsed.data, updatedAt: FieldValue.serverTimestamp() })

  if (parsed.data.status) {
    // Keep the users doc and Firebase Auth in sync with status.
    await db.collection('users').doc(id).update({ status: parsed.data.status, updatedAt: FieldValue.serverTimestamp() })
    await getAdminAuth().updateUser(id, { disabled: parsed.data.status === 'disabled' })
  }

  const updated = await ref.get()
  return ok({ id: ref.id, ...updated.data() }, 'Customer updated')
})
