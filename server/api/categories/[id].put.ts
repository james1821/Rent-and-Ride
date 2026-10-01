import { getAdminFirestore, FieldValue } from '../../utils/firebaseAdmin'
import { requireAdmin } from '../../utils/auth'
import { ok, fail } from '../../utils/apiResponse'
import { categoryInputSchema } from '../../utils/validation'
import { buildCategorySearchIndex } from '../../utils/search'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!

  const body = await readBody(event)
  const parsed = categoryInputSchema.partial().safeParse(body)
  if (!parsed.success) {
    return fail(400, parsed.error.issues.map((i) => i.message).join('; '))
  }

  const db = getAdminFirestore()
  const ref = db.collection('categories').doc(id)
  const doc = await ref.get()
  if (!doc.exists) return fail(404, 'Category not found')

  if (parsed.data.slug && parsed.data.slug !== doc.data()!.slug) {
    const clash = await db.collection('categories').where('slug', '==', parsed.data.slug).limit(1).get()
    if (!clash.empty) return fail(409, `A category with slug "${parsed.data.slug}" already exists`)
  }

  const searchPatch = parsed.data.name ? { searchPrefixes: buildCategorySearchIndex(parsed.data.name) } : {}
  await ref.update({ ...parsed.data, ...searchPatch, updatedAt: FieldValue.serverTimestamp() })
  const updated = await ref.get()
  return ok({ id: ref.id, ...updated.data() }, 'Category updated')
})
