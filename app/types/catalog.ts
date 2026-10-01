export type EntityStatus = 'active' | 'inactive' | 'archived'

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  sortOrder: number
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface Subcategory {
  id: string
  categoryId: string
  name: string
  slug: string
  sortOrder: number
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface ProductSpec {
  label: string
  value: string
}

export interface ProductPricing {
  daily: number
  weekly?: number
  monthly?: number
  deposit: number
}

export interface ProductRating {
  average: number
  count: number
}

export type ProductCondition = 'excellent' | 'good' | 'fair'

export type VehicleType = 'car' | 'motorcycle'
export type VehicleTransmission = 'automatic' | 'manual' | 'semi-automatic'
export type VehicleFuelType = 'gasoline' | 'diesel' | 'hybrid' | 'electric'

/**
 * Vehicle-specific attributes. Brand, condition, pricing, quantity and
 * free-form `specifications` stay on the Product itself; this block only
 * holds the fields that are filterable/structured for cars and motorcycles.
 * Optional on the type so legacy documents without it still render.
 */
export interface VehicleInfo {
  type: VehicleType
  model?: string
  year?: number
  transmission?: VehicleTransmission
  fuelType?: VehicleFuelType
  seats?: number
  /** Engine displacement in cc. */
  engineDisplacement?: number
  color?: string
  /** Odometer reading in km. */
  mileage?: number
}

export interface Product {
  id: string
  sku: string
  name: string
  slug: string
  brand: string
  categoryId: string
  subcategoryId?: string
  description: string
  vehicle?: VehicleInfo
  specifications: ProductSpec[]
  images: string[]
  pricing: ProductPricing
  quantityTotal: number
  quantityAvailable: number
  condition: ProductCondition
  status: EntityStatus
  isRentable: boolean
  isFeatured: boolean
  rating?: ProductRating
  createdAt: string
  updatedAt: string
}

export interface ProductVariant {
  id: string
  productId: string
  name: string
  priceModifier: number
  status: 'active' | 'inactive'
}

export type InventoryCondition = 'excellent' | 'good' | 'fair' | 'needs-repair'
export type InventoryStatus = 'available' | 'rented' | 'maintenance' | 'retired'

export interface InventoryUnit {
  id: string
  productId: string
  serialNumber: string
  condition: InventoryCondition
  status: InventoryStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

/** Shape returned by the catalog listing API — product plus derived fields. */
export interface ProductListItem extends Product {
  categoryName?: string
  subcategoryName?: string
}
