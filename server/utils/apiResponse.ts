import type { ApiSuccess } from '~/types'

export function ok<T>(data: T, message?: string): ApiSuccess<T> {
  return { success: true, data, message }
}

// Throws an H3 error carrying the standard { success: false, message } body.
export function fail(statusCode: number, message: string, code?: string): never {
  throw createError({
    statusCode,
    statusMessage: message,
    data: { success: false, message, code }
  })
}
