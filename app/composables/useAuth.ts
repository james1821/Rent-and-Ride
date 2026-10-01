import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'
import type { UserRole } from '~/types'

const currentUser = ref<User | null>(null)
const currentRole = ref<UserRole | null>(null)
const authReady = ref(false)
// True while register() is running: the Firebase Auth user exists before the
// server has created users/{uid}, so the auth listener must not look up the
// profile (and sign the user out) during that window.
const registering = ref(false)
let listenerAttached = false

export function useAuth() {
  const { $auth } = useNuxtApp()
  const { apiFetch } = useApi()

  // $auth is only provided on the client (firebase.client.ts), so never touch
  // it during SSR — doing so threw and left listenerAttached stuck on true.
  if (import.meta.client && $auth && !listenerAttached) {
    listenerAttached = true
    onAuthStateChanged($auth, async (user) => {
      currentUser.value = user
      if (user && registering.value) return // register() sets the role itself when done
      if (user) {
        // `currentRole` stays null until the account's profile is confirmed, so
        // the cart/favorites listeners (which need it) never start too early.
        currentRole.value = null
        try {
          const profile = await apiFetch<{ role: UserRole }>('/api/customers/me')
          currentRole.value = profile?.role ?? 'customer'
        } catch (err: any) {
          if (/user record not found/i.test(err?.message ?? '')) {
            // Signed in with Firebase Auth, but no users/{uid} document exists in Firestore
            // (registration never completed, or the database was reset). Nothing else can
            // work for this account, so sign out with an explanation instead of erroring.
            console.warn('[auth] Signed-in account has no users/' + user.uid + ' record — signing out.')
            useToast().add({
              title: 'Account setup is incomplete',
              description: 'This login has no profile record. Please register a new account, or contact support.',
              color: 'red'
            })
            await firebaseSignOut($auth)
            return
          }
          currentRole.value = 'customer' // e.g. customers record missing or a temporary API error
        }
      } else {
        currentRole.value = null
      }
      authReady.value = true
    })
  }

  async function register(input: { firstName: string; lastName: string; phone: string; email: string; password: string }) {
    registering.value = true
    let credential: Awaited<ReturnType<typeof createUserWithEmailAndPassword>> | null = null
    try {
      credential = await createUserWithEmailAndPassword($auth, input.email, input.password)
      // Firestore users/customers docs are created server-side so `role` is
      // never something the client dictates — see server/api/auth/register.post.ts
      const token = await credential.user.getIdToken()
      await $fetch('/api/auth/register', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: { firstName: input.firstName, lastName: input.lastName, phone: input.phone }
      })
      currentRole.value = 'customer'
      authReady.value = true
      return credential.user
    } catch (err) {
      // Don't leave a half-created login behind (Auth user without a profile),
      // so the person can retry with the same email.
      if (credential) {
        try { await credential.user.delete() } catch { await firebaseSignOut($auth) }
      }
      throw err
    } finally {
      registering.value = false
    }
  }

  async function login(email: string, password: string) {
    const credential = await signInWithEmailAndPassword($auth, email, password)
    return credential.user
  }

  async function logout() {
    await firebaseSignOut($auth)
  }

  const isAdmin = computed(() => currentRole.value === 'admin' || currentRole.value === 'staff')
  const isAuthenticated = computed(() => !!currentUser.value)

  return { currentUser, currentRole, authReady, isAdmin, isAuthenticated, register, login, logout }
}