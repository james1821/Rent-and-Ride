import { checkAvailability } from '../../utils/rentalAvailability'
import { ok, fail } from '../../utils/apiResponse'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const productId = query.productId as string
  const startDate = query.startDate as string
  const endDate = query.endDate as string
  const quantity = query.quantity ? Number(query.quantity) : 1

  if (!productId || !startDate || !endDate) {
    return fail(400, 'productId, startDate, and endDate are required')
  }

  try {
    const result = await checkAvailability(productId, { startDate, endDate }, quantity)
    return ok(result)
  } catch (err: any) {
    return fail(err.statusCode ?? 500, err.statusMessage ?? err.message ?? 'Availability check failed')
  }
})
