import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth, type Auth } from 'firebase-admin/auth'

let adminApp: App | null = null

// Lazily initializes the Firebase Admin SDK from server-only credentials.
// The only code path allowed to bypass Firestore security rules.
function getAdminApp(): App {
  if (adminApp) return adminApp
  if (getApps().length) {
    adminApp = getApps()[0]!
    return adminApp
  }

  const config = useRuntimeConfig()
  const { projectId, clientEmail, privateKey } = config.firebaseAdmin

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      '[firebaseAdmin] Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY. ' +
      'Set these in .env — see .env.example.'
    )
  }

  adminApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n') // .env stores literal \n
    })
  })

  return adminApp
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp())
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp())
}

export { FieldValue, Timestamp } from 'firebase-admin/firestore'
