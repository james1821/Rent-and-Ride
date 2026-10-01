// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-06-01',
  future: { compatibilityVersion: 4 },

  modules: ['@nuxt/ui'],

  devtools: { enabled: false },

  // Pre-bundle heavy deps up front so Vite doesn't discover them mid-session and reload the page.
  vite: {
    optimizeDeps: {
      include: ['firebase/app', 'firebase/auth', 'firebase/firestore']
    }
  },

  css: ['~/assets/css/main.css'],

  ui: {
    global: true,
    icons: ['heroicons', 'simple-icons'],
    safelistColors: ['primary', 'green', 'red']
  },

  // The UI is a light black-and-white design; don't follow the OS dark mode.
  colorMode: { preference: 'light', fallback: 'light' },

  app: {
    head: {
      title: `${process.env.NUXT_PUBLIC_SITE_NAME || 'RentRide'} — Cars & Motorcycles for Rent`,
      meta: [
        { name: 'description', content: 'Rent cars and motorcycles by the day, week or month. Live availability, transparent rates, pickup or delivery.' }
      ]
    }
  },

  typescript: {
    strict: true,
    typeCheck: false // set true once deps are installed locally; slows dev cold-start otherwise
  },

  runtimeConfig: {
    // Server-only. Never exposed to the client.
    firebaseAdmin: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY
    },

    // Where admin-uploaded images are stored on the server's disk (served at /uploads/*).
    // Must be a persistent directory in production.
    uploadDir: process.env.UPLOAD_DIR || './uploads',

    // Exposed to the client via useRuntimeConfig().public
    public: {
      firebase: {
        apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
        messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID
      },
      siteName: process.env.NUXT_PUBLIC_SITE_NAME || 'RentRide',
      currency: 'PHP',
      useFirebaseEmulators: process.env.NUXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true'
    }
  },

  nitro: {
    experimental: {
      asyncContext: true
    }
  }
})
