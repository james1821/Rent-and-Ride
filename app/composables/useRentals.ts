import type { Rental, RentalWithItems, RentalStatus, FulfillmentInfo } from '~/types'

export interface CheckoutInput {
  items: Array<{ productId: string; quantity: number; startDate: string; endDate: string }>
  fulfillment: FulfillmentInfo
  notes?: string
  couponCode?: string
}

export function useRentals() {
  const { apiFetch } = useApi()

  const checkout = (input: CheckoutInput) =>
    apiFetch<Rental>('/api/rentals', { method: 'POST', body: input })

  const listRentals = (params: { status?: RentalStatus; search?: string; from?: string; to?: string; page?: number; pageSize?: number } = {}) =>
    apiFetch<{ items: Rental[]; pagination: any }>('/api/rentals', { query: params })

  const getRental = (id: string) =>
    apiFetch<RentalWithItems>(`/api/rentals/${id}`)

  const setStatus = (id: string, status: RentalStatus, note?: string) =>
    apiFetch(`/api/rentals/${id}/status`, { method: 'PUT', body: { status, note } })

  const cancelRental = (id: string, note?: string) => setStatus(id, 'CANCELLED', note)

  return { checkout, listRentals, getRental, setStatus, cancelRental }
}
