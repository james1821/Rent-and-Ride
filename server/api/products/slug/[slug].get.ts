import { getAdminFirestore } from '../../../utils/firebaseAdmin'
import { ok, fail } from '../../../utils/apiResponse'
import type { Product } from '~/types'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const db = getAdminFirestore()

  const snap = await db.collection('products').where('slug', '==', slug).limit(1).get()
  if (snap.empty) return fail(404, 'Vehicle not found')

  const doc = snap.docs[0]!
  const product = { id: doc.id, ...doc.data() } as Product

  if (product.status !== 'active') return fail(404, 'Vehicle not found')

  const relatedSnap = await db.collection('products')
    .where('status', '==', 'active')
    .where('categoryId', '==', product.categoryId)
    .limit(9)
    .get()

  const related = relatedSnap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Product))
    .filter((p) => p.id !== product.id)
    .slice(0, 4)

  return ok({ product, related })
})
