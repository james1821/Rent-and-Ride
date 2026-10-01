import { getAdminFirestore, FieldValue } from '../../utils/firebaseAdmin'
import { requireAdmin } from '../../utils/auth'
import { ok, fail } from '../../utils/apiResponse'
import { productUpdateSchema } from '../../utils/validation'
import { buildProductSearchIndex } from '../../utils/search'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!

  const body = await readBody(event)
  const parsed = productUpdateSchema.safeParse(body)
  if (!parsed.success) return fail(400, parsed.error.issues.map((i) => i.message).join('; '))

  const db = getAdminFirestore()
  const ref = db.collection('products').doc(id)
  const doc = await ref.get()
  if (!doc.exists) return fail(404, 'Vehicle not found')
  const current = doc.data()!

  const data = parsed.data

  if (data.sku && data.sku !== current.sku) {
    const clash = await db.collection('products').where('sku', '==', data.sku).limit(1).get()
    if (!clash.empty) return fail(409, `SKU "${data.sku}" is already in use`)
  }
  if (data.slug && data.slug !== current.slug) {
    const clash = await db.collection('products').where('slug', '==', data.slug).limit(1).get()
    if (!clash.empty) return fail(409, `Slug "${data.slug}" is already in use`)
  }

  const patch: Record<string, unknown> = { ...data, updatedAt: FieldValue.serverTimestamp() }

  // Shift availableQuantity by the delta rather than overwriting it.
  if (data.quantityTotal !== undefined && data.quantityTotal !== current.quantityTotal) {
    const delta = data.quantityTotal - current.quantityTotal
    patch.quantityAvailable = Math.max(0, (current.quantityAvailable ?? 0) + delta)
  }

  if (data.name || data.brand || data.sku || data.vehicle) {
    const [category, subcategory] = await Promise.all([
      db.collection('categories').doc(data.categoryId ?? current.categoryId).get(),
      (data.subcategoryId ?? current.subcategoryId)
        ? db.collection('subcategories').doc(data.subcategoryId ?? current.subcategoryId).get()
        : Promise.resolve(null)
    ])
    patch.searchPrefixes = buildProductSearchIndex({
      name: data.name ?? current.name,
      brand: data.brand ?? current.brand,
      sku: data.sku ?? current.sku,
      model: data.vehicle?.model ?? current.vehicle?.model,
      vehicleType: data.vehicle?.type ?? current.vehicle?.type,
      categoryName: category.data()?.name,
      subcategoryName: subcategory?.data()?.name
    })
  }

  await ref.update(patch)
  const updated = await ref.get()
  return ok({ id: ref.id, ...updated.data() }, 'Vehicle updated')
})
