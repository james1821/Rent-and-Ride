import { getAdminFirestore } from '../../utils/firebaseAdmin'
import { requireAuth } from '../../utils/auth'
import { ok, fail } from '../../utils/apiResponse'
import type { Rental, RentalStatus } from '~/types'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const query = getQuery(event)
  const isStaff = auth.role === 'admin' || auth.role === 'staff'

  const status = query.status as RentalStatus | undefined
  const fromDate = query.from as string | undefined
  const toDate = query.to as string | undefined
  const page = Math.max(1, Number(query.page ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 20)))

  try {
    const db = getAdminFirestore()
    let ref = db.collection('rentals') as FirebaseFirestore.Query

    if (!isStaff) {
      // Customers only ever see their own rentals.
      ref = ref.where('customerId', '==', auth.uid)
    }
    if (status) ref = ref.where('status', '==', status)

    ref = ref.orderBy('createdAt', 'desc')
    const snap = await ref.limit(500).get()

    let rentals: Rental[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Rental))

    if (fromDate) rentals = rentals.filter((r) => r.endDate >= fromDate)
    if (toDate) rentals = rentals.filter((r) => r.startDate <= toDate)

    if (isStaff && query.search) {
      const term = (query.search as string).toLowerCase()
      rentals = rentals.filter((r) =>
        r.rentalNumber.toLowerCase().includes(term) ||
        r.customerSnapshot.name.toLowerCase().includes(term) ||
        r.customerSnapshot.email.toLowerCase().includes(term)
      )
    }

    const total = rentals.length
    const start = (page - 1) * pageSize
    const pageItems = rentals.slice(start, start + pageSize)

    return ok({ items: pageItems, pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } })
  } catch (err: any) {
    return fail(500, err.message ?? 'Failed to load rentals')
  }
})
