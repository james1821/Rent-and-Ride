import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// Initializes the Firebase Web SDK for auth, catalog reads, and direct
// cart/favorites writes. Pricing- and security-sensitive operations go
// through the Nitro API instead (see server/utils/firebaseAdmin.ts).
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const firebaseConfig = {
    apiKey: config.public.firebase.apiKey,
    authDomain: config.public.firebase.authDomain,
    projectId: config.public.firebase.projectId,
    messagingSenderId: config.public.firebase.messagingSenderId,
    appId: config.public.firebase.appId
  }

  const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const firestore = getFirestore(app)

  // Optional local emulators: set NUXT_PUBLIC_USE_FIREBASE_EMULATORS=true.
  if (import.meta.dev && config.public.useFirebaseEmulators) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080)
  }

  return {
    provide: { auth, firestore }
  }
})
