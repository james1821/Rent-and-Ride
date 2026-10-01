import type { Category, Subcategory, Product, ApiResponse } from '~/types'

export interface ProductListParams {
  q?: string
  categoryId?: string
  subcategoryId?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  availableOnly?: boolean
  featuredOnly?: boolean
  vehicleType?: 'car' | 'motorcycle'
  transmission?: string
  fuelType?: string
  minSeats?: number
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc'
  page?: number
  pageSize?: number
}

export interface PaginatedProducts {
  items: Product[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

export function useCatalog() {
  async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
    const res = await promise
    if (!res.success) throw new Error(res.message)
    return res.data
  }

  const fetchCategories = (includeInactive = false) =>
    unwrap<Category[]>($fetch('/api/categories', { query: { includeInactive } }))

  const fetchSubcategories = (categoryId?: string, includeInactive = false) =>
    unwrap<Subcategory[]>($fetch('/api/subcategories', { query: { categoryId, includeInactive } }))

  const fetchProducts = (params: ProductListParams = {}) =>
    unwrap<PaginatedProducts>($fetch('/api/products', { query: params }))

  const fetchProductBySlug = (slug: string) =>
    unwrap<{ product: Product; related: Product[] }>($fetch(`/api/products/slug/${slug}`))

  const searchSuggestions = (q: string) =>
    unwrap<{ products: any[]; categories: any[] }>($fetch('/api/search', { query: { q } }))

  const fetchBrands = () => unwrap<string[]>($fetch('/api/products/facets')).catch(() => [] as string[])

  return { fetchBrands, fetchCategories, fetchSubcategories, fetchProducts, fetchProductBySlug, searchSuggestions }
}
