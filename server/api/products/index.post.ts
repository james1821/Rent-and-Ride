import { requireAdmin } from '../../utils/auth'
import { ok, fail } from '../../utils/apiResponse'
import { productInputSchema } from '../../utils/validation'
import { createProductRecord } from '../../utils/productWrite'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const parsed = productInputSchema.safeParse(body)
  if (!parsed.success) return fail(400, parsed.error.issues.map((i) => i.message).join('; '))

  const result = await createProductRecord(parsed.data)
  if (!result.ok) return fail(result.statusCode, result.message)

  return ok(result.product, 'Vehicle created')
})
