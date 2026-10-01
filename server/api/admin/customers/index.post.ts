import { z } from 'zod'
import { getAdminAuth, getAdminFirestore, FieldValue } from '../../../utils/firebaseAdmin'
import { requireAdmin } from '../../../utils/auth'
import { ok, fail } from '../../../utils/apiResponse'

const createCustomerSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().min(1).max(30),
  temporaryPassword: z.string().min(8).max(100)
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const parsed = createCustomerSchema.safeParse(body)
  if (!parsed.success) return fail(400, parsed.error.issues.map((i) => i.message).join('; '))

  const { firstName, lastName, email, phone, temporaryPassword } = parsed.data
  const auth = getAdminAuth()
  const db = getAdminFirestore()

  let userRecord
  try {
    userRecord = await auth.createUser({
      email,
      password: temporaryPassword,
      displayName: `${firstName} ${lastName}`.trim()
    })
  } catch (err: any) {
    return fail(409, err.message ?? 'Could not create the account (email may already be in use)')
  }

  const now = FieldValue.serverTimestamp()
  const batch = db.batch()
  batch.set(db.collection('users').doc(userRecord.uid), {
    uid: userRecord.uid,
    email,
    displayName: `${firstName} ${lastName}`.trim(),
    role: 'customer',
    phone,
    status: 'active',
    createdAt: now,
    updatedAt: now
  })
  batch.set(db.collection('customers').doc(userRecord.uid), {
    firstName,
    lastName,
    email,
    phone,
    addresses: [],
    stats: { totalRentals: 0, totalSpend: 0, outstandingDeposit: 0 },
    notes: null,
    status: 'active',
    createdAt: now,
    updatedAt: now
  })
  await batch.commit()

  return ok({ id: userRecord.uid }, 'Customer account created')
})
