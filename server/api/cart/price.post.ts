import { calculatePricing } from '../../utils/pricing'
import { ok, fail } from '../../utils/apiResponse'
import { z } from 'zod'

const priceRequestSchema = z.object({
  lines: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1),
    startDate: z.string().min(1),
    endDate: z.string().min(1)
  })).min(1),
  couponCode: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = priceRequestSchema.safeParse(body)
  if (!parsed.success) return fail(400, parsed.error.issues.map((i) => i.message).join('; '))

  try {
    const pricing = await calculatePricing(parsed.data.lines, parsed.data.couponCode)
    return ok(pricing)
  } catch (err: any) {
    return fail(err.statusCode ?? 500, err.statusMessage ?? err.message ?? 'Pricing failed')
  }
})
