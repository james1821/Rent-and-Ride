import type { ApiResponse } from '~/types'

// Attaches a Firebase ID token and unwraps the API envelope for every call.
export function useApi() {
  const { $auth } = useNuxtApp()

  async function authHeader(): Promise<Record<string, string>> {
    const user = $auth.currentUser
    if (!user) return {}
    const token = await user.getIdToken()
    return { Authorization: `Bearer ${token}` }
  }

  async function apiFetch<T>(path: string, options: Parameters<typeof $fetch>[1] = {}): Promise<T> {
    const headers = await authHeader()
    try {
      const res = await $fetch<ApiResponse<T>>(path, {
        ...options,
        headers: { ...headers, ...(options.headers as Record<string, string> | undefined) }
      })
      if (!res.success) throw new Error(res.message)
      return res.data
    } catch (err: any) {
      // Normalize Nitro's createError shape to a plain message.
      const message =
        err?.data?.message ?? err?.response?._data?.message ?? err?.statusMessage ?? err?.message ?? 'Request failed'
      throw new Error(message)
    }
  }

  return { apiFetch }
}
