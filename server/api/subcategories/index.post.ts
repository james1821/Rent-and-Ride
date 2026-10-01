import { getAdminFirestore, FieldValue } from '../../utils/firebaseAdmin'
import { requireAdmin } from '../../utils/auth'
import { ok, fail } from '../../utils/apiResponse'
import { subcategoryInputSchema } from '../../utils/validation'
import { buildCategorySearchIndex } from '../../utils/search'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const parsed = subcategoryInputSchema.safeParse(body)
  if (!parsed.success) return fail(400, parsed.error.issues.map((i) => i.message).join('; '))

  const db = getAdminFirestore()

  const parentDoc = await db.collection('categories').doc(parsed.data.categoryId).get()
  if (!parentDoc.exists) return fail(404, 'Parent category not found')

  const clash = await db.collection('subcategories')
    .where('categoryId', '==', parsed.data.categoryId)
    .where('slug', '==', parsed.data.slug)
    .limit(1).get()
  if (!clash.empty) return fail(409, `A subcategory with slug "${parsed.data.slug}" already exists in this category`)

  const ref = db.collection('subcategories').doc()
  const now = FieldValue.serverTimestamp()
  await ref.set({
    ...parsed.data,
    searchPrefixes: buildCategorySearchIndex(parsed.data.name),
    createdAt: now,
    updatedAt: now
  })

  const created = await ref.get()
  return ok({ id: ref.id, ...created.data() }, 'Subcategory created')
})
