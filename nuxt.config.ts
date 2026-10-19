import { fileURLToPath } from 'node:url'

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
    // A short cross-fade between routes/layouts so navigation feels responsive
    // even while data is still loading (the new page shows its skeleton).
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'page', mode: 'out-in' },
    head: {
      title: `${process.env.NUXT_PUBLIC_SITE_NAME || 'RentRide'} - Cars & Motorcycles for Rent`,
      meta: [
        { name: 'description', content: 'Rent cars and motorcycles by the day, week or month. Live availability, transparent rates, pickup or delivery.' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        // Preconnect + load fonts from the document head instead of a
        // render-blocking @import inside the stylesheet.
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap'
        }
      ]
    }
  },

  // Cache public, rarely-changing GET endpoints on the server. Firestore reads
  // are the main source of latency; SWR serves them from cache while
  // revalidating in the background. Write endpoints (POST/PUT/DELETE) and
  // admin routes are never cached.
  routeRules: {
    '/api/categories': { swr: 300 },
    '/api/subcategories': { swr: 300 },
    '/api/banners': { swr: 300 },
    '/api/popup': { swr: 300 },
    '/api/settings/**': { swr: 600 },
    '/api/products/facets': { swr: 300 },
    '/api/search': { swr: 30 }
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

    // Cloudinary (server-only). Admin uploads are sent here via an *unsigned*
    // upload preset and the returned HTTPS URL is stored in Firestore. Works
    // from any environment, including serverless hosts (Vercel/Netlify/Cloud
    // Run) whose filesystem is ephemeral. Free tier; no API key/secret needed.
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
      folder: process.env.CLOUDINARY_FOLDER || 'rentandride'
    },

    // Legacy: directory where pre-Cloudinary uploads live (served at /uploads/*).
    // Kept only so previously-uploaded images still resolve in local dev.
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
    },

    // Pre-Cloudinary images committed at ./uploads were saved to Firestore as
    // "/uploads/..." paths, but only the build output is deployed — so on
    // Vercel/Netlify (whose filesystem is ephemeral and never ships the repo's
    // ./uploads dir) those images 404ed. Exposing ./uploads as a public asset
    // copies it to .output/public/uploads/** so the platform's CDN serves the
    // exact same URLs, with no per-request filesystem access.
    publicAssets: [
      {
        dir: fileURLToPath(new URL('./uploads', import.meta.url)),
        baseURL: '/uploads',
        maxAge: 60 * 60 * 24 * 365
      }
    ]
  }
})
