export interface CartItem {
  productId: string
  quantity: number
  startDate: string
  endDate: string
  addedAt: string
}

export interface Cart {
  customerId: string
  items: CartItem[]
  updatedAt: string
}

/** Cart line item enriched with product data for display — server-derived, never trusted for pricing. */
export interface CartLineDisplay extends CartItem {
  product: {
    id: string
    name: string
    brand: string
    image: string
    dailyPrice: number
    deposit: number
  }
  durationDays: number
  lineSubtotal: number
}

export interface Favorites {
  customerId: string
  productIds: string[]
  updatedAt: string
}

export type CouponType = 'percent' | 'fixed'

export interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  minSubtotal?: number
  maxUses?: number
  usedCount: number
  validFrom: string
  validTo: string
  status: 'active' | 'inactive'
}

export type OrderStatus = 'unpaid' | 'paid' | 'partially_refunded' | 'refunded'

export interface Order {
  id: string
  rentalId: string
  customerId: string
  amounts: {
    subtotal: number
    discount: number
    deposit: number
    total: number
    refundedDeposit?: number
  }
  status: OrderStatus
  createdAt: string
  updatedAt: string
}

export type PaymentType = 'charge' | 'deposit_hold' | 'deposit_refund' | 'refund'

export interface Payment {
  id: string
  orderId: string
  type: PaymentType
  amount: number
  method: string
  reference?: string
  createdAt: string
}

export interface Banner {
  id: string
  title: string
  description: string
  imageUrl: string
  ctaLabel: string
  ctaHref: string
  secondaryCtaLabel?: string
  secondaryCtaHref?: string
  sortOrder: number
  placement: 'hero' | 'promo'
  status: 'active' | 'inactive'
}

/** Standard API envelope used by every Nitro route (Section 21). */
export interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
}

export interface ApiError {
  success: false
  message: string
  code?: string
  errors?: Record<string, string>
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
