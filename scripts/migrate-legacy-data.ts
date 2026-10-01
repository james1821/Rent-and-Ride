// One-off migration for databases created by the previous camera-rental version.
//
//   npm run migrate:legacy            → DRY RUN: only reports what it would change
//   npm run migrate:legacy -- --apply → performs the changes
//
// What it does (never deletes documents):
//   1. Removes leftover third-party-sync fields from products, categories and
//      subcategories (`erpItemId`, `erpCategoryId`, `hubshake`).
//   2. Lists products that have no `vehicle` block (i.e. old camera gear) so you
//      can archive them in Admin → Vehicles. With --archive-legacy-products they
//      are set to status "archived" instead (hidden from the storefront, rental
//      history kept).
//
// Delete this script once you have run it.
import 'dotenv/config'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
if (!projectId || !clientEmail || !privateKey) {
  console.error('Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY in .env')
  process.exit(1)
}

const apply = process.argv.includes('--apply')
const archiveLegacy = process.argv.includes('--archive-legacy-products')
const db = getFirestore(initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }))

const LEGACY_FIELDS: Record<string, string[]> = {
  products: ['erpItemId', 'hubshake'],
  categories: ['erpCategoryId'],
  subcategories: ['erpCategoryId']
}

async function main() {
  console.log(apply ? 'APPLYING changes…\n' : 'DRY RUN — no data will be changed (pass --apply to write).\n')

  for (const [collection, fields] of Object.entries(LEGACY_FIELDS)) {
    const snap = await db.collection(collection).get()
    const targets = snap.docs.filter((d) => fields.some((f) => f in d.data()))
    console.log(`${collection}: ${targets.length} of ${snap.size} documents carry legacy fields (${fields.join(', ')})`)
    if (apply) {
      for (let i = 0; i < targets.length; i += 400) {
        const batch = db.batch()
        for (const d of targets.slice(i, i + 400)) {
          batch.update(d.ref, Object.fromEntries(fields.map((f) => [f, FieldValue.delete()])))
        }
        await batch.commit()
      }
    }
  }

  const products = await db.collection('products').get()
  const legacy = products.docs.filter((d) => !d.data().vehicle && d.data().status !== 'archived')
  console.log(`\nproducts without vehicle details (probably old camera equipment): ${legacy.length}`)
  legacy.slice(0, 50).forEach((d) => console.log(`  - ${d.data().name} [${d.id}]`))
  if (archiveLegacy && apply) {
    for (let i = 0; i < legacy.length; i += 400) {
      const batch = db.batch()
      for (const d of legacy.slice(i, i + 400)) batch.update(d.ref, { status: 'archived', isRentable: false, updatedAt: FieldValue.serverTimestamp() })
      await batch.commit()
    }
    console.log('  → archived.')
  } else if (legacy.length) {
    console.log('  Archive them in Admin → Vehicles, or re-run with --apply --archive-legacy-products.')
  }
  console.log('\nAlso review: Admin → Categories (deactivate old camera categories) and Admin → Banners (remove old camera hero banners).')
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
