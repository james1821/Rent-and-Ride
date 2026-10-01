import type { ApiResponse } from '~/types'

export type PopupFrequency = 'once' | 'session' | 'daily' | 'weekly'

export interface PromoPopupConfig {
  title: string
  description: string
  secondaryText: string
  imageUrl: string
  ctaLabel: string
  ctaHref: string
  frequency: PopupFrequency
  firstVisitOnly: boolean
  delaySeconds: number
  startDate: string
  endDate: string
  /** Changes whenever the admin saves with "show again to everyone". */
  version: number
}

const LS_FIRST_SEEN = 'rr:first-seen'
const SS_FIRST_SESSION = 'rr:first-session'
const LS_DISMISSED = 'rr:popup-dismissed'
const SS_SESSION_DISMISSED = 'rr:popup-session-dismissed'
const DAY = 86400000

// Storage can throw (private mode, blocked cookies) — treat that as "empty".
function read(store: Storage | undefined, key: string): string | null {
  try { return store?.getItem(key) ?? null } catch { return null }
}
function write(store: Storage | undefined, key: string, value: string) {
  try { store?.setItem(key, value) } catch { /* ignore */ }
}

/** Same rule as the server: site-relative path or http(s) URL only. */
export function isSafeLink(value: string): boolean {
  if (!value) return false
  if (value.startsWith('/') && !value.startsWith('//')) return true
  try {
    const u = new URL(value)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch { return false }
}

/** Preloads the banner image so the popup doesn't jump; gives up after `ms`. */
function preloadImage(url: string, ms = 3500): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url) return resolve(false)
    const img = new Image()
    const timer = setTimeout(() => resolve(false), ms)
    img.onload = () => { clearTimeout(timer); resolve(true) }
    img.onerror = () => { clearTimeout(timer); resolve(false) }
    img.src = url
  })
}

export function usePromoPopup() {
  /** Client-only. Returns the popup to show, or null (disabled, expired, dismissed, failed…). */
  async function loadEligiblePopup(): Promise<{ config: PromoPopupConfig; imageOk: boolean } | null> {
    if (!import.meta.client) return null

    // First-visit tracking: the whole first browsing session counts as "first visit",
    // so navigating between pages (or a delayed popup) doesn't lose the first-timer.
    let firstSeen = read(localStorage, LS_FIRST_SEEN)
    if (!firstSeen) {
      write(localStorage, LS_FIRST_SEEN, String(Date.now()))
      write(sessionStorage, SS_FIRST_SESSION, '1')
      firstSeen = null
    }
    const isFirstVisit = read(sessionStorage, SS_FIRST_SESSION) === '1'

    let config: PromoPopupConfig | null = null
    try {
      const res = await $fetch<ApiResponse<PromoPopupConfig | null>>('/api/popup', { timeout: 6000 })
      config = res.success ? res.data : null
    } catch {
      return null // fail gracefully: no popup
    }
    if (!config) return null
    if (!config.title && !config.description && !config.imageUrl) return null

    const now = Date.now()
    if (config.startDate && now < Date.parse(config.startDate)) return null
    if (config.endDate && now > Date.parse(config.endDate)) return null
    if (config.firstVisitOnly && !isFirstVisit) return null

    if (isDismissed(config, now)) return null

    const imageOk = config.imageUrl && isSafeLink(config.imageUrl) ? await preloadImage(config.imageUrl) : false
    return { config, imageOk }
  }

  function isDismissed(config: PromoPopupConfig, now: number): boolean {
    if (config.frequency === 'session') {
      return read(sessionStorage, SS_SESSION_DISMISSED) === String(config.version)
    }
    const raw = read(localStorage, LS_DISMISSED)
    if (!raw) return false
    try {
      const d = JSON.parse(raw) as { version: number; at: number }
      if (d.version !== config.version) return false // admin changed the popup → show again
      if (config.frequency === 'once') return true
      const window = config.frequency === 'daily' ? DAY : 7 * DAY
      return now - d.at < window
    } catch { return false }
  }

  function markDismissed(config: PromoPopupConfig) {
    write(localStorage, LS_DISMISSED, JSON.stringify({ version: config.version, at: Date.now() }))
    write(sessionStorage, SS_SESSION_DISMISSED, String(config.version))
  }

  return { loadEligiblePopup, markDismissed }
}
