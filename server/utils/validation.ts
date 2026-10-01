import { z } from 'zod'

// Images are either an http(s) URL or a file uploaded through the admin
// (served from this app at /uploads/...).
export const imageUrlSchema = z.string().refine(
  (v) => v.startsWith('/uploads/') || /^https?:\/\/\S+$/.test(v),
  'Must be an http(s) URL or an uploaded image'
)

export const categoryInputSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(140).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string().max(2000).optional(),
  imageUrl: imageUrlSchema.optional(),
  sortOrder: z.number().int().default(0),
  status: z.enum(['active', 'inactive']).default('active')
})

export const subcategoryInputSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(140).regex(/^[a-z0-9-]+$/),
  sortOrder: z.number().int().default(0),
  status: z.enum(['active', 'inactive']).default('active')
})

export const productSpecSchema = z.object({
  label: z.string().min(1).max(80),
  value: z.string().min(1).max(200)
})

export const vehicleInfoSchema = z.object({
  type: z.enum(['car', 'motorcycle']),
  model: z.string().max(80).optional(),
  year: z.number().int().min(1950).max(2100).optional(),
  transmission: z.enum(['automatic', 'manual', 'semi-automatic']).optional(),
  fuelType: z.enum(['gasoline', 'diesel', 'hybrid', 'electric']).optional(),
  seats: z.number().int().min(1).max(60).optional(),
  engineDisplacement: z.number().int().min(1).max(20000).optional(),
  color: z.string().max(40).optional(),
  mileage: z.number().int().min(0).max(5000000).optional()
})

export const productInputSchema = z.object({
  sku: z.string().min(1).max(60),
  name: z.string().min(1).max(160),
  slug: z.string().min(1).max(180).regex(/^[a-z0-9-]+$/),
  brand: z.string().min(1).max(80),
  categoryId: z.string().min(1),
  subcategoryId: z.string().optional(),
  description: z.string().min(1).max(5000),
  vehicle: vehicleInfoSchema,
  specifications: z.array(productSpecSchema).default([]),
  images: z.array(imageUrlSchema).min(1, 'At least one image is required'),
  pricing: z.object({
    daily: z.number().positive(),
    weekly: z.number().positive().optional(),
    monthly: z.number().positive().optional(),
    deposit: z.number().min(0)
  }),
  quantityTotal: z.number().int().min(0),
  condition: z.enum(['excellent', 'good', 'fair']).default('excellent'),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  isRentable: z.boolean().default(true),
  isFeatured: z.boolean().default(false)
})

export const productUpdateSchema = productInputSchema.partial()

export type ProductInput = z.infer<typeof productInputSchema>
