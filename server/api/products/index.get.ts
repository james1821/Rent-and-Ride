import { getAdminFirestore } from '../../utils/firebaseAdmin'
import { matchesAllWords } from '../../utils/search'
import { cachedResponse } from '../../utils/memoryCache'
import { ok, fail } from '../../utils/apiResponse'
import type { Product } from '~/types'

const SORT_OPTIONS = ['newest', 'price_asc', 'price_desc', 'name_asc'] as const
type SortOption = typeof SORT_OPTIONS[number]

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const search = (query.q as string | undefined)?.trim()
  const categoryId = query.categoryId as string | undefined
  const subcategoryId = query.subcategoryId as string | undefined
  const brand = query.brand as string | undefined
  const minPrice = query.minPrice ? Number(query.minPrice) : undefined
  const maxPrice = query.maxPrice ? Number(query.maxPrice) : undefined
  const availableOnly = query.availableOnly === 'true'
  const featuredOnly = query.featuredOnly === 'true'
  const vehicleType = ['car', 'motorcycle'].includes(query.vehicleType as string) ? (query.vehicleType as string) : undefined
  const transmission = query.transmission as string | undefined
  const fuelType = query.fuelType as string | undefined
  const minSeats = query.minSeats ? Number(query.minSeats) : undefined
  const sort: SortOption = SORT_OPTIONS.includes(query.sort as SortOption) ? (query.sort as SortOption) : 'newest'
  const page = Math.max(1, Number(query.page ?? 1))
  const pageSize = Math.min(48, Math.max(1, Number(query.pageSize ?? 12)))

  try {
    return ok(await cachedResponse(`products:${event.path}`, 20000, async () => {
    const db = getAdminFirestore()

    // Indexed equality filters only; search/price range applied in-memory below.
    let ref = db.collection('products').where('status', '==', 'active') as FirebaseFirestore.Query

    if (search) {
      const firstWord = search.toLowerCase().split(/\s+/)[0]
      ref = ref.where('searchPrefixes', 'array-contains', firstWord)
    } else {
      if (categoryId) ref = ref.where('categoryId', '==', categoryId)
      if (subcategoryId) ref = ref.where('subcategoryId', '==', subcategoryId)
      if (brand) ref = ref.where('brand', '==', brand)
      if (featuredOnly) ref = ref.where('isFeatured', '==', true)
    }

    const snap = await ref.limit(300).get()
    let products: Product[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product))

    // In-memory refinement: confirm search words and apply remaining filters.
    if (search) {
      products = products.filter((p: any) => matchesAllWords(p.searchPrefixes ?? [], search))
      if (categoryId) products = products.filter((p) => p.categoryId === categoryId)
      if (subcategoryId) products = products.filter((p) => p.subcategoryId === subcategoryId)
      if (brand) products = products.filter((p) => p.brand === brand)
      if (featuredOnly) products = products.filter((p) => p.isFeatured)
    }
    if (minPrice !== undefined) products = products.filter((p) => p.pricing.daily >= minPrice)
    if (maxPrice !== undefined) products = products.filter((p) => p.pricing.daily <= maxPrice)
    if (vehicleType) products = products.filter((p) => p.vehicle?.type === vehicleType)
    if (transmission) products = products.filter((p) => p.vehicle?.transmission === transmission)
    if (fuelType) products = products.filter((p) => p.vehicle?.fuelType === fuelType)
    if (minSeats !== undefined && !Number.isNaN(minSeats)) products = products.filter((p) => (p.vehicle?.seats ?? 0) >= minSeats)
    if (availableOnly) products = products.filter((p) => p.quantityAvailable > 0)

    switch (sort) {
      case 'price_asc': products.sort((a, b) => a.pricing.daily - b.pricing.daily); break
      case 'price_desc': products.sort((a, b) => b.pricing.daily - a.pricing.daily); break
      case 'name_asc': products.sort((a, b) => a.name.localeCompare(b.name)); break
      default: products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    const total = products.length
    const start = (page - 1) * pageSize
    const pageItems = products.slice(start, start + pageSize)

    return {
      items: pageItems,
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
    }
    }))
  } catch (err: any) {
    return fail(500, err.message ?? 'Failed to load products')
  }
})
