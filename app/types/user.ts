export type UserRole = 'customer' | 'admin' | 'staff'

export interface AppUser {
  uid: string
  email: string
  displayName: string
  role: UserRole
  phone?: string
  status: 'active' | 'disabled'
  createdAt: string
  updatedAt: string
}

export interface Address {
  label: string
  line1: string
  line2?: string
  city: string
  province: string
  postalCode: string
  isDefault: boolean
}

export interface CustomerStats {
  totalRentals: number
  totalSpend: number
  outstandingDeposit: number
}

export interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  addresses: Address[]
  idVerification?: {
    status: 'unverified' | 'pending' | 'verified'
    documentUrl?: string
  }
  stats: CustomerStats
  notes?: string
  status: 'active' | 'disabled'
  createdAt: string
  updatedAt: string
}
