// Seeds Firestore with sample data and creates one admin account.
// Standalone script (not part of Nitro) — run with: npm run seed
import 'dotenv/config'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { buildProductSearchIndex, buildCategorySearchIndex } from '../server/utils/search'

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

if (!projectId || !clientEmail || !privateKey) {
  console.error('Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY in .env — see .env.example.')
  process.exit(1)
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
const db = getFirestore(app)
const auth = getAuth(app)

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!'

// Placeholder photos (black tile with the vehicle name). Replace them with real
// photos from Admin → Vehicles → Edit → Photos → Upload image.
const img = (label: string) =>
  `https://placehold.co/1200x900/0a0a0a/ffffff/png?text=${encodeURIComponent(label).replace(/%20/g, '+')}`

interface SeedCategory { key: string; name: string; description: string }
interface SeedSubcategory { key: string; categoryKey: string; name: string }
interface SeedVehicle {
  sku: string; name: string; brand: string; categoryKey: string; subcategoryKey?: string
  type: 'car' | 'motorcycle'; model: string; year: number
  transmission: 'automatic' | 'manual' | 'semi-automatic'
  fuelType: 'gasoline' | 'diesel' | 'hybrid' | 'electric'
  seats: number; engineCc?: number; color: string; mileage: number
  description: string; specs?: [string, string][]
  daily: number; weekly?: number; monthly?: number; deposit: number
  quantity: number; featured?: boolean
}

// Categories are fully admin-managed (Admin → Categories); these are just samples.
const categories: SeedCategory[] = [
  { key: 'sedans', name: 'Sedans', description: 'Comfortable sedans for city driving and road trips.' },
  { key: 'suvs', name: 'SUVs', description: 'Higher ground clearance and room for the whole crew.' },
  { key: 'mpvs', name: 'MPVs', description: 'Family-size people movers.' },
  { key: 'vans', name: 'Vans', description: 'Group travel and cargo.' },
  { key: 'scooters', name: 'Scooters', description: 'Automatic scooters — easy to ride around town.' },
  { key: 'underbone', name: 'Underbone Motorcycles', description: 'Fuel-efficient semi-automatic everyday bikes.' },
  { key: 'sport-bikes', name: 'Sport Bikes', description: 'Higher-performance motorcycles for experienced riders.' }
]

const subcategories: SeedSubcategory[] = []

const vehicles: SeedVehicle[] = [
  { sku: 'MC-HONDA-CLICK125', name: 'Honda Click 125', brand: 'Honda', categoryKey: 'scooters', type: 'motorcycle', model: 'Click 125', year: 2025,
    transmission: 'automatic', fuelType: 'gasoline', seats: 2, engineCc: 125, color: 'Matte Black', mileage: 3200,
    description: 'Automatic scooter available for daily rental.', specs: [['Storage', 'Under-seat compartment']],
    daily: 800, weekly: 4800, monthly: 16000, deposit: 3000, quantity: 4, featured: true },
  { sku: 'MC-HONDA-BEAT', name: 'Honda Beat 110', brand: 'Honda', categoryKey: 'scooters', type: 'motorcycle', model: 'Beat', year: 2024,
    transmission: 'automatic', fuelType: 'gasoline', seats: 2, engineCc: 110, color: 'White', mileage: 8100,
    description: 'Lightweight, fuel-sipping scooter that is easy to handle in traffic.',
    daily: 600, weekly: 3600, monthly: 12000, deposit: 2500, quantity: 4 },
  { sku: 'MC-YAMAHA-NMAX', name: 'Yamaha NMAX 155', brand: 'Yamaha', categoryKey: 'scooters', type: 'motorcycle', model: 'NMAX', year: 2025,
    transmission: 'automatic', fuelType: 'gasoline', seats: 2, engineCc: 155, color: 'Grey', mileage: 2400,
    description: 'Comfortable maxi-scooter with ABS, great for longer rides.', specs: [['Features', 'ABS, keyless ignition']],
    daily: 1200, weekly: 7200, monthly: 24000, deposit: 5000, quantity: 3, featured: true },
  { sku: 'MC-SUZUKI-RAIDER150', name: 'Suzuki Raider R150', brand: 'Suzuki', categoryKey: 'underbone', type: 'motorcycle', model: 'Raider R150', year: 2023,
    transmission: 'semi-automatic', fuelType: 'gasoline', seats: 2, engineCc: 150, color: 'Red', mileage: 14500,
    description: 'Sporty underbone with a punchy 150cc engine.',
    daily: 900, weekly: 5400, deposit: 3500, quantity: 2 },
  { sku: 'MC-HONDA-CBR150R', name: 'Honda CBR150R', brand: 'Honda', categoryKey: 'sport-bikes', type: 'motorcycle', model: 'CBR150R', year: 2024,
    transmission: 'manual', fuelType: 'gasoline', seats: 2, engineCc: 150, color: 'Red / Black', mileage: 5200,
    description: 'Fully-faired sport bike for experienced riders. Riding license required.',
    daily: 1800, weekly: 10800, deposit: 8000, quantity: 2, featured: true },
  { sku: 'CAR-TOYOTA-VIOS', name: 'Toyota Vios 1.3', brand: 'Toyota', categoryKey: 'sedans', type: 'car', model: 'Vios', year: 2025,
    transmission: 'automatic', fuelType: 'gasoline', seats: 5, engineCc: 1300, color: 'Silver', mileage: 6800,
    description: 'Automatic sedan available for daily rental.', specs: [['Luggage', '2 large bags']],
    daily: 1800, weekly: 11000, monthly: 38000, deposit: 5000, quantity: 3, featured: true },
  { sku: 'CAR-HONDA-CITY', name: 'Honda City 1.5', brand: 'Honda', categoryKey: 'sedans', type: 'car', model: 'City', year: 2024,
    transmission: 'automatic', fuelType: 'gasoline', seats: 5, engineCc: 1500, color: 'White', mileage: 12400,
    description: 'Roomy, efficient sedan with a comfortable ride.',
    daily: 2000, weekly: 12000, monthly: 42000, deposit: 5000, quantity: 2 },
  { sku: 'CAR-MITSUBISHI-MIRAGE', name: 'Mitsubishi Mirage G4', brand: 'Mitsubishi', categoryKey: 'sedans', type: 'car', model: 'Mirage G4', year: 2023,
    transmission: 'manual', fuelType: 'gasoline', seats: 5, engineCc: 1200, color: 'Blue', mileage: 21000,
    description: 'Budget-friendly manual sedan, easy on fuel.',
    daily: 1400, weekly: 8400, deposit: 4000, quantity: 2 },
  { sku: 'CAR-TOYOTA-FORTUNER', name: 'Toyota Fortuner 2.4 G', brand: 'Toyota', categoryKey: 'suvs', type: 'car', model: 'Fortuner', year: 2024,
    transmission: 'automatic', fuelType: 'diesel', seats: 7, engineCc: 2400, color: 'Black', mileage: 9800,
    description: 'Seven-seat diesel SUV for family trips and rougher roads.',
    daily: 3800, weekly: 23000, monthly: 80000, deposit: 10000, quantity: 2, featured: true },
  { sku: 'CAR-MITSUBISHI-XPANDER', name: 'Mitsubishi Xpander GLS', brand: 'Mitsubishi', categoryKey: 'mpvs', type: 'car', model: 'Xpander', year: 2024,
    transmission: 'automatic', fuelType: 'gasoline', seats: 7, engineCc: 1500, color: 'White', mileage: 11200,
    description: 'Practical seven-seat MPV with flexible seating.',
    daily: 2800, weekly: 17000, monthly: 60000, deposit: 8000, quantity: 3 },
  { sku: 'CAR-TOYOTA-HIACE', name: 'Toyota HiAce Commuter', brand: 'Toyota', categoryKey: 'vans', type: 'car', model: 'HiAce Commuter', year: 2023,
    transmission: 'manual', fuelType: 'diesel', seats: 15, engineCc: 2800, color: 'White', mileage: 32000,
    description: 'Fifteen-seat van for group tours and airport transfers.',
    daily: 4500, weekly: 27000, deposit: 12000, quantity: 1 }
]

async function seed() {
  console.log('Seeding categories…')
  const categoryIds: Record<string, string> = {}
  for (const [i, c] of categories.entries()) {
    const ref = db.collection('categories').doc()
    categoryIds[c.key] = ref.id
    await ref.set({
      name: c.name, slug: c.key, description: c.description, imageUrl: img(c.name),
      sortOrder: i, status: 'active', searchPrefixes: buildCategorySearchIndex(c.name),
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp()
    })
  }

  console.log('Seeding subcategories…')
  const subcategoryIds: Record<string, string> = {}
  for (const [i, s] of subcategories.entries()) {
    const ref = db.collection('subcategories').doc()
    subcategoryIds[s.key] = ref.id
    await ref.set({
      categoryId: categoryIds[s.categoryKey], name: s.name, slug: s.key,
      sortOrder: i, status: 'active', searchPrefixes: buildCategorySearchIndex(s.name),
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp()
    })
  }

  console.log('Seeding vehicles…')
  for (const v of vehicles) {
    const ref = db.collection('products').doc()
    const categoryName = categories.find((c) => c.key === v.categoryKey)!.name
    const subcategoryName = v.subcategoryKey ? subcategories.find((s) => s.key === v.subcategoryKey)!.name : undefined
    const slug = v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    await ref.set({
      sku: v.sku,
      name: v.name,
      slug,
      brand: v.brand,
      categoryId: categoryIds[v.categoryKey],
      subcategoryId: v.subcategoryKey ? subcategoryIds[v.subcategoryKey] : null,
      description: v.description,
      vehicle: {
        type: v.type, model: v.model, year: v.year, transmission: v.transmission, fuelType: v.fuelType,
        seats: v.seats, ...(v.engineCc ? { engineDisplacement: v.engineCc } : {}), color: v.color, mileage: v.mileage
      },
      specifications: (v.specs ?? []).map(([label, value]) => ({ label, value })),
      images: [img(v.name)],
      pricing: { daily: v.daily, weekly: v.weekly ?? null, monthly: v.monthly ?? null, deposit: v.deposit },
      quantityTotal: v.quantity,
      quantityAvailable: v.quantity,
      condition: 'excellent',
      status: 'active',
      isRentable: true,
      isFeatured: !!v.featured,
      rating: { average: 0, count: 0 },
      searchPrefixes: buildProductSearchIndex({
        name: v.name, brand: v.brand, sku: v.sku, model: v.model, vehicleType: v.type, categoryName, subcategoryName
      }),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    })
  }

  const popupRef = db.collection('popups').doc('promo')
  if (!(await popupRef.get()).exists) {
    console.log('Creating promotional popup config (disabled — enable it in Admin → Promotional Popup)…')
    await popupRef.set({
      enabled: false, title: '', description: '', secondaryText: '', imageUrl: '', ctaLabel: '', ctaHref: '',
      frequency: 'once', firstVisitOnly: true, delaySeconds: 2, startDate: '', endDate: '', version: Date.now(),
      updatedAt: FieldValue.serverTimestamp()
    })
  }

  console.log('Seeding settings…')
  await db.collection('settings').doc('general').set({
    companyName: process.env.NUXT_PUBLIC_SITE_NAME || 'RentRide',
    contactEmail: 'hello@example.com',
    contactPhone: '+63 917 000 0000',
    address: '',
    socials: { facebook: '', instagram: '' },
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true })

  console.log('Creating admin account…')
  let adminUid: string
  try {
    const existing = await auth.getUserByEmail(ADMIN_EMAIL)
    adminUid = existing.uid
    console.log(`Admin account already exists (${ADMIN_EMAIL}), reusing it.`)
  } catch {
    const created = await auth.createUser({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, displayName: 'Store Admin' })
    adminUid = created.uid
    console.log(`Created admin account: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD} — change this password after first login.`)
  }
  await db.collection('users').doc(adminUid).set({
    uid: adminUid, email: ADMIN_EMAIL, displayName: 'Store Admin', role: 'admin', status: 'active',
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp()
  }, { merge: true })

  console.log('\nSeed complete:')
  console.log(`  ${categories.length} categories, ${subcategories.length} subcategories, ${vehicles.length} vehicles`)
  console.log(`  Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
}

seed()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1) })
