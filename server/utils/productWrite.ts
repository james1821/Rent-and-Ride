import { getAdminFirestore, FieldValue } from './firebaseAdmin'
import { buildProductSearchIndex } from './search'
import type { ProductInput } from './validation'

export type CreateProductResult =
  | { ok: true; id: string; product: Record<string, unknown> }
  | { ok: false; statusCode: number; message: string }

/**
 * Single source of truth for "create a vehicle" (a product document) —
 * validates SKU/slug uniqueness and category references, then writes the
 * record with its search index. Returns a result object instead of throwing.
 */
export async function createProductRecord(data: ProductInput): Promise<CreateProductResult> {
  const db = getAdminFirestore()

  const [skuClash, slugClash, category, subcategory] = await Promise.all([
    db.collection('products').where('sku', '==', data.sku).limit(1).get(),
    db.collection('products').where('slug', '==', data.slug).limit(1).get(),
    db.collection('categories').doc(data.categoryId).get(),
    data.subcategoryId ? db.collection('subcategories').doc(data.subcategoryId).get() : Promise.resolve(null)
  ])

  if (!skuClash.empty) return { ok: false, statusCode: 409, message: `SKU "${data.sku}" is already in use` }
  if (!slugClash.empty) return { ok: false, statusCode: 409, message: `Slug "${data.slug}" is already in use` }
  if (!category.exists) return { ok: false, statusCode: 404, message: 'Category not found' }
  if (data.subcategoryId && !subcategory?.exists) return { ok: false, statusCode: 404, message: 'Subcategory not found' }

  const ref = db.collection('products').doc()
  const now = FieldValue.serverTimestamp()

  await ref.set({
    ...data,
    quantityAvailable: data.quantityTotal, // no rentals exist yet for a brand-new product
    rating: { average: 0, count: 0 },
    searchPrefixes: buildProductSearchIndex({
      name: data.name,
      brand: data.brand,
      sku: data.sku,
      model: data.vehicle.model,
      vehicleType: data.vehicle.type,
      categoryName: category.data()?.name,
      subcategoryName: subcategory?.data()?.name
    }),
    createdAt: now,
    updatedAt: now
  })

  const created = await ref.get()
  return { ok: true, id: ref.id, product: { id: ref.id, ...created.data() } }
}
