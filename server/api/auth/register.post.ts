import { z } from 'zod'
import { getAdminAuth, getAdminFirestore, FieldValue } from '../../utils/firebaseAdmin'
import { ok, fail } from '../../utils/apiResponse'

const registerSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: z.string().min(1).max(30)
})

// Creates users/customers docs after Firebase Auth signup. Doesn't use
// requireAuth() since no users doc exists yet — role is hardcoded to 'customer'.
export default defineEventHandler(async (event) => {
  const header = getHeader(event, 'authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return fail(401, 'Missing Authorization header')

  let decoded
  try {
    decoded = await getAdminAuth().verifyIdToken(token)
  } catch {
    return fail(401, 'Invalid or expired session')
  }

  const body = await readBody(event)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) return fail(400, parsed.error.issues.map((i) => i.message).join('; '))

  const db = getAdminFirestore()
  const userRef = db.collection('users').doc(decoded.uid)
  const existing = await userRef.get()
  if (existing.exists) return fail(409, 'This account is already registered')

  const now = FieldValue.serverTimestamp()
  const displayName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim()

  const batch = db.batch()
  batch.set(userRef, {
    uid: decoded.uid,
    email: decoded.email ?? '',
    displayName,
    role: 'customer',
    phone: parsed.data.phone,
    status: 'active',
    createdAt: now,
    updatedAt: now
  })
  batch.set(db.collection('customers').doc(decoded.uid), {
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    email: decoded.email ?? '',
    phone: parsed.data.phone,
    addresses: [],
    stats: { totalRentals: 0, totalSpend: 0, outstandingDeposit: 0 },
    notes: null,
    status: 'active',
    createdAt: now,
    updatedAt: now
  })
  await batch.commit()

  return ok({ uid: decoded.uid, role: 'customer' }, 'Account created')
})
