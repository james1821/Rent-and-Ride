import { getAdminFirestore, FieldValue } from '../../utils/firebaseAdmin'
import { requireAdmin } from '../../utils/auth'
import { ok, fail } from '../../utils/apiResponse'
import { categoryInputSchema } from '../../utils/validation'
import { buildCategorySearchIndex } from '../../utils/search'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  const parsed = categoryInputSchema.safeParse(body)
  if (!parsed.success) {
    return fail(400, parsed.error.issues.map((i) => i.message).join('; '))
  }

  const db = getAdminFirestore()

  const existing = await db.collection('categories').where('slug', '==', parsed.data.slug).limit(1).get()
  if (!existing.empty) {
    return fail(409, `A category with slug "${parsed.data.slug}" already exists`)
  }

  const ref = db.collection('categories').doc()
  const now = FieldValue.serverTimestamp()
  await ref.set({
    ...parsed.data,
    searchPrefixes: buildCategorySearchIndex(parsed.data.name),
    createdAt: now,
    updatedAt: now
  })

  const created = await ref.get()
  return ok({ id: ref.id, ...created.data() }, 'Category created')
})
