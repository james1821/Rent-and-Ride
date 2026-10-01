import type { H3Event } from 'h3'
import { getAdminAuth, getAdminFirestore } from './firebaseAdmin'
import type { AppUser, UserRole } from '~/types'

export interface AuthContext {
  uid: string
  email: string | undefined
  role: UserRole
}

// Verifies the Firebase ID token and returns the caller's uid/role.
export async function requireAuth(event: H3Event): Promise<AuthContext> {
  const header = getHeader(event, 'authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Missing Authorization header' })
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token)

    // Role comes from the users collection, not custom claims, so
    // disabling/downgrading an account takes effect immediately.
    const userDoc = await getAdminFirestore().collection('users').doc(decoded.uid).get()
    const userData = userDoc.data() as AppUser | undefined

    if (!userDoc.exists || !userData) {
      throw createError({ statusCode: 401, statusMessage: 'User record not found' })
    }
    if (userData.status === 'disabled') {
      throw createError({ statusCode: 403, statusMessage: 'This account has been disabled' })
    }

    return { uid: decoded.uid, email: decoded.email, role: userData.role }
  } catch (err: any) {
    if (err?.statusCode) throw err
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired session' })
  }
}

// Requires an admin or staff role.
export async function requireAdmin(event: H3Event): Promise<AuthContext> {
  const ctx = await requireAuth(event)
  if (ctx.role !== 'admin' && ctx.role !== 'staff') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }
  return ctx
}

// Requires auth, any role — for "my own data" endpoints.
export async function requireCustomer(event: H3Event): Promise<AuthContext> {
  return requireAuth(event)
}
