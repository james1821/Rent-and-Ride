import { z } from 'zod'

/**
 * Firestore document: popups/promo. Deliberately NOT under `settings` (which is
 * publicly readable) so a disabled/draft popup is never exposed — the public
 * /api/popup endpoint is the only reader, and it applies the schedule.
 */
export const POPUP_COLLECTION = 'popups'
export const POPUP_DOC = 'promo'

export const POPUP_FREQUENCIES = ['once', 'session', 'daily', 'weekly'] as const
export type PopupFrequency = typeof POPUP_FREQUENCIES[number]

// CTA / image links must be site-relative paths or http(s) URLs — never
// javascript:, data: or protocol-relative URLs.
export function isSafeLink(value: string): boolean {
  if (value.startsWith('/') && !value.startsWith('//')) return true
  try {
    const u = new URL(value)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

const safeLink = z.string().max(600).refine(isSafeLink, 'Must be a site path like /catalog or an http(s) URL')
const optionalDate = z.string().max(40).refine((v) => v === '' || !Number.isNaN(Date.parse(v)), 'Invalid date')

export const popupInputSchema = z.object({
  enabled: z.boolean().default(false),
  title: z.string().trim().max(120).default(''),
  description: z.string().trim().max(600).default(''),
  secondaryText: z.string().trim().max(200).default(''),
  imageUrl: z.union([z.literal(''), safeLink]).default(''),
  ctaLabel: z.string().trim().max(40).default(''),
  ctaHref: z.union([z.literal(''), safeLink]).default(''),
  frequency: z.enum(POPUP_FREQUENCIES).default('once'),
  firstVisitOnly: z.boolean().default(true),
  delaySeconds: z.number().int().min(0).max(120).default(2),
  startDate: optionalDate.default(''),
  endDate: optionalDate.default(''),
  // When true (default), bumps `version` so visitors who dismissed an older
  // version see the updated popup again.
  resetDismissals: z.boolean().default(true)
}).superRefine((v, ctx) => {
  if (v.enabled && !v.title && !v.description && !v.imageUrl) {
    ctx.addIssue({ code: 'custom', message: 'An enabled popup needs at least a title, description or image' })
  }
  if (v.ctaLabel && !v.ctaHref) {
    ctx.addIssue({ code: 'custom', path: ['ctaHref'], message: 'Add a CTA link for the button, or clear the button text' })
  }
  if (v.startDate && v.endDate && Date.parse(v.endDate) < Date.parse(v.startDate)) {
    ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'End date must be after the start date' })
  }
})

export type PopupInput = z.infer<typeof popupInputSchema>

export const DEFAULT_POPUP = {
  enabled: false,
  title: '',
  description: '',
  secondaryText: '',
  imageUrl: '',
  ctaLabel: '',
  ctaHref: '',
  frequency: 'once' as PopupFrequency,
  firstVisitOnly: true,
  delaySeconds: 2,
  startDate: '',
  endDate: '',
  version: 0
}

/** True when the popup is enabled and "now" falls inside its schedule window. */
export function isPopupLive(p: { enabled?: boolean; startDate?: string; endDate?: string }, now = Date.now()): boolean {
  if (!p.enabled) return false
  if (p.startDate && now < Date.parse(p.startDate)) return false
  if (p.endDate && now > Date.parse(p.endDate)) return false
  return true
}
