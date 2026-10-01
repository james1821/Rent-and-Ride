import { getAdminFirestore, FieldValue } from './firebaseAdmin'

// Generates sequential rental numbers like RNT-2026-000482 using a
// per-year counter. Call inside the same transaction as the rental write.
export async function nextRentalNumber(tx: FirebaseFirestore.Transaction): Promise<string> {
  const db = getAdminFirestore()
  const year = new Date().getFullYear()
  const counterRef = db.collection('settings').doc(`rentalCounter-${year}`)

  const counterDoc = await tx.get(counterRef)
  const next = (counterDoc.exists ? counterDoc.data()!.value : 0) + 1

  tx.set(counterRef, { value: next, updatedAt: FieldValue.serverTimestamp() }, { merge: true })

  return `RNT-${year}-${String(next).padStart(6, '0')}`
}
