import { z } from 'zod'
import { getAdminFirestore, FieldValue } from '../../utils/firebaseAdmin'
import { requireAdmin } from '../../utils/auth'
import { ok, fail } from '../../utils/apiResponse'
import { imageUrlSchema } from '../../utils/validation'

const bannerSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(400),
  imageUrl: imageUrlSchema,
  ctaLabel: z.string().min(1).max(60),
  ctaHref: z.string().min(1),
  secondaryCtaLabel: z.string().max(60).optional(),
  secondaryCtaHref: z.string().optional(),
  sortOrder: z.number().int().default(0),
  placement: z.enum(['hero', 'promo']),
  status: z.enum(['active', 'inactive']).default('active')
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const parsed = bannerSchema.safeParse(body)
  if (!parsed.success) return fail(400, parsed.error.issues.map((i) => i.message).join('; '))

  const ref = getAdminFirestore().collection('banners').doc()
  const now = FieldValue.serverTimestamp()
  await ref.set({ ...parsed.data, createdAt: now, updatedAt: now })

  const created = await ref.get()
  return ok({ id: ref.id, ...created.data() }, 'Banner created')
})
