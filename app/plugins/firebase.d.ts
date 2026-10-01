import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

declare module '#app' {
  interface NuxtApp {
    $auth: Auth
    $firestore: Firestore
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $auth: Auth
    $firestore: Firestore
  }
}

export {}
