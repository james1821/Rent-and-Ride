import { getAdminFirestore, FieldValue } from '../../utils/firebaseAdmin'
import { requireAdmin } from '../../utils/auth'
import { ok, fail } from '../../utils/apiResponse'
import { subcategoryInputSchema } from '../../utils/validation'
import { buildCategorySearchIndex } from '../../utils/search'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const parsed = subcategoryInputSchema.partial().safeParse(body)
  if (!parsed.success) return fail(400, parsed.error.issues.map((i) => i.message).join('; '))

  const db = getAdminFirestore()
  const ref = db.collection('subcategories').doc(id)
  const doc = await ref.get()
  if (!doc.exists) return fail(404, 'Subcategory not found')

  const searchPatch = parsed.data.name ? { searchPrefixes: buildCategorySearchIndex(parsed.data.name) } : {}
  await ref.update({ ...parsed.data, ...searchPatch, updatedAt: FieldValue.serverTimestamp() })
  const updated = await ref.get()
  return ok({ id: ref.id, ...updated.data() }, 'Subcategory updated')
})
