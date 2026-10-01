import { getAdminFirestore } from '../../../utils/firebaseAdmin'
import { requireAdmin } from '../../../utils/auth'
import { ok, fail } from '../../../utils/apiResponse'
import type { Customer } from '~/types'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)
  const search = (query.search as string | undefined)?.toLowerCase().trim()
  const status = query.status as 'active' | 'disabled' | undefined
  const page = Math.max(1, Number(query.page ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 20)))

  try {
    const db = getAdminFirestore()
    let ref = db.collection('customers').orderBy('lastName', 'asc') as FirebaseFirestore.Query
    if (status) ref = ref.where('status', '==', status)

    const snap = await ref.limit(500).get()
    let customers: Customer[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer))

    if (search) {
      customers = customers.filter((c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.phone?.toLowerCase().includes(search)
      )
    }

    const total = customers.length
    const start = (page - 1) * pageSize
    const pageItems = customers.slice(start, start + pageSize)

    return ok({ items: pageItems, pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } })
  } catch (err: any) {
    return fail(500, err.message ?? 'Failed to load customers')
  }
})
