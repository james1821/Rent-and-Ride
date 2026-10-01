export interface AvailabilityCheckResult {
  productId: string
  totalQuantity: number
  reservedQuantity: number
  availableQuantity: number
  isAvailable: boolean
  requestedQuantity: number
}

export function useAvailability() {
  async function unwrap<T>(promise: Promise<any>): Promise<T> {
    const res = await promise
    if (!res.success) throw new Error(res.message)
    return res.data
  }

  const checkAvailability = (productId: string, startDate: string, endDate: string, quantity = 1) =>
    unwrap<AvailabilityCheckResult>(
      $fetch('/api/availability', { query: { productId, startDate, endDate, quantity } })
    )

  const fetchCalendar = (productId: string, from: string, to: string) =>
    unwrap<{ productId: string; totalQuantity: number; days: Record<string, number> }>(
      $fetch('/api/availability/calendar', { query: { productId, from, to } })
    )

  return { checkAvailability, fetchCalendar }
}
