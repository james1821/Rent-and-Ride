import { getAdminFirestore } from '../../utils/firebaseAdmin'
import { requireAuth } from '../../utils/auth'
import { ok, fail } from '../../utils/apiResponse'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const doc = await getAdminFirestore().collection('customers').doc(auth.uid).get()

  if (!doc.exists) {
    // Admin/staff accounts (e.g. the seeded admin) have a users record but no customers record.
    if (auth.role === 'admin' || auth.role === 'staff') {
      return ok({ id: auth.uid, email: auth.email, role: auth.role })
    }
    return fail(404, 'Customer profile not found')
  }

  // The role lives in the users collection, not on the customer document.
  return ok({ id: doc.id, ...doc.data(), role: auth.role })
})
