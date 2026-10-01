import { getAdminFirestore } from '../../utils/firebaseAdmin'
import { matchesAllWords } from '../../utils/search'
import { ok, fail } from '../../utils/apiResponse'

// Powers the header search dropdown: matching products and categories.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = (query.q as string | undefined)?.trim()
  if (!q || q.length < 2) return ok({ products: [], categories: [] })

  try {
    const db = getAdminFirestore()
    const firstWord = q.toLowerCase().split(/\s+/)[0]

    const [productSnap, categorySnap, subcategorySnap] = await Promise.all([
      db.collection('products')
        .where('status', '==', 'active')
        .where('searchPrefixes', 'array-contains', firstWord)
        .limit(50).get(),
      db.collection('categories')
        .where('status', '==', 'active')
        .where('searchPrefixes', 'array-contains', firstWord)
        .limit(20).get(),
      db.collection('subcategories')
        .where('status', '==', 'active')
        .where('searchPrefixes', 'array-contains', firstWord)
        .limit(20).get()
    ])

    const products = productSnap.docs
      .map((d) => ({ id: d.id, ...d.data() } as any))
      .filter((p) => matchesAllWords(p.searchPrefixes ?? [], q))
      .slice(0, 6)
      .map((p) => ({ id: p.id, name: p.name, slug: p.slug, brand: p.brand, image: p.images?.[0], dailyPrice: p.pricing.daily }))

    const categoryDocs = [
      ...categorySnap.docs.map((d) => ({ id: d.id, ...d.data() } as any)),
      ...subcategorySnap.docs.map((d) => ({ id: d.id, ...d.data() } as any))
    ]

    const categories = categoryDocs
      .filter((c) => matchesAllWords(c.searchPrefixes ?? [], q))
      .slice(0, 6)
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug }))

    return ok({ products, categories })
  } catch (err: any) {
    return fail(500, err.message ?? 'Search failed')
  }
})
