import { z } from 'zod'
import { getAdminFirestore, FieldValue } from '../../utils/firebaseAdmin'
import { requireAdmin } from '../../utils/auth'
import { ok, fail } from '../../utils/apiResponse'
import { imageUrlSchema } from '../../utils/validation'

const bannerUpdateSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  description: z.string().min(1).max(400).optional(),
  imageUrl: imageUrlSchema.optional(),
  ctaLabel: z.string().min(1).max(60).optional(),
  ctaHref: z.string().min(1).optional(),
  secondaryCtaLabel: z.string().max(60).optional(),
  secondaryCtaHref: z.string().optional(),
  sortOrder: z.number().int().optional(),
  placement: z.enum(['hero', 'promo']).optional(),
  status: z.enum(['active', 'inactive']).optional()
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const parsed = bannerUpdateSchema.safeParse(body)
  if (!parsed.success) return fail(400, parsed.error.issues.map((i) => i.message).join('; '))

  const ref = getAdminFirestore().collection('banners').doc(id)
  const doc = await ref.get()
  if (!doc.exists) return fail(404, 'Banner not found')

  await ref.update({ ...parsed.data, updatedAt: FieldValue.serverTimestamp() })
  const updated = await ref.get()
  return ok({ id: ref.id, ...updated.data() }, 'Banner updated')
})
