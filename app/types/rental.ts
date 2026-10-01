export const RENTAL_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'ACTIVE',
  'RETURN_PENDING',
  'RETURNED',
  'COMPLETED',
  'CANCELLED',
  'OVERDUE'
] as const

export type RentalStatus = typeof RENTAL_STATUSES[number]

export type FulfillmentMethod = 'pickup' | 'delivery'

export interface FulfillmentInfo {
  method: FulfillmentMethod
  address?: {
    line1: string
    line2?: string
    city: string
    province: string
    postalCode: string
  }
}

export interface RentalPricing {
  subtotal: number
  discount: number
  deposit: number
  total: number
}

export interface RentalStatusHistoryEntry {
  status: RentalStatus
  changedBy: string
  changedAt: string
  note?: string
}

export interface CustomerSnapshot {
  name: string
  email: string
  phone: string
}

export interface Rental {
  id: string
  rentalNumber: string
  customerId: string
  customerSnapshot: CustomerSnapshot
  startDate: string
  endDate: string
  durationDays: number
  fulfillment: FulfillmentInfo
  status: RentalStatus
  pricing: RentalPricing
  couponId?: string
  notes?: string
  internalNotes?: string
  statusHistory: RentalStatusHistoryEntry[]
  createdAt: string
  updatedAt: string
}

export interface ProductSnapshot {
  name: string
  sku: string
  image: string
}

export interface RentalItem {
  id: string
  rentalId: string
  productId: string
  productSnapshot: ProductSnapshot
  quantity: number
  unitIds?: string[]
  pricePerDay: number
  lineTotal: number
  // Denormalized from the parent rental for join-free availability queries.
  startDate: string
  endDate: string
  rentalStatus: RentalStatus
}

export interface RentalWithItems extends Rental {
  items: RentalItem[]
}

// Valid forward transitions per status. Enforced server-side in rentalStatus.ts.
export const RENTAL_STATUS_TRANSITIONS: Record<RentalStatus, RentalStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  READY_FOR_PICKUP: ['ACTIVE', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['RETURN_PENDING', 'OVERDUE'],
  RETURN_PENDING: ['RETURNED'],
  OVERDUE: ['RETURN_PENDING', 'RETURNED'],
  RETURNED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: []
}
