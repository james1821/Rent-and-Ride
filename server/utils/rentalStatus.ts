import { getAdminFirestore, FieldValue } from './firebaseAdmin'
import { RENTAL_STATUS_TRANSITIONS, type RentalStatus } from '~/types'

export interface TransitionOptions {
  rentalId: string
  toStatus: RentalStatus
  changedBy: string
  note?: string
}

// Validates and applies a rental status transition, syncing rentalItems,
// activity logs, and customer stats in one transaction.
export async function transitionRentalStatus({ rentalId, toStatus, changedBy, note }: TransitionOptions) {
  const db = getAdminFirestore()
  const rentalRef = db.collection('rentals').doc(rentalId)

  await db.runTransaction(async (tx) => {
    const rentalDoc = await tx.get(rentalRef)
    if (!rentalDoc.exists) {
      throw createError({ statusCode: 404, statusMessage: 'Rental not found' })
    }
    const rental = rentalDoc.data()!
    const fromStatus = rental.status as RentalStatus

    const allowed = RENTAL_STATUS_TRANSITIONS[fromStatus] ?? []
    if (!allowed.includes(toStatus)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Cannot move rental from ${fromStatus} to ${toStatus}`
      })
    }

    const historyEntry = {
      status: toStatus,
      changedBy,
      changedAt: new Date().toISOString(),
      note: note ?? null
    }

    tx.update(rentalRef, {
      status: toStatus,
      statusHistory: FieldValue.arrayUnion(historyEntry),
      updatedAt: FieldValue.serverTimestamp()
    })

    // Sync status onto rentalItems so availability checks reflect it.
    const itemsSnap = await db.collection('rentalItems').where('rentalId', '==', rentalId).get()
    for (const itemDoc of itemsSnap.docs) {
      tx.update(itemDoc.ref, { rentalStatus: toStatus })

      // Restore quantityAvailable when a hold on inventory ends.
      if (toStatus === 'CANCELLED' || toStatus === 'RETURNED') {
        const item = itemDoc.data()
        tx.update(db.collection('products').doc(item.productId), {
          quantityAvailable: FieldValue.increment(item.quantity)
        })
      }
    }

    tx.set(db.collection('activityLogs').doc(), {
      actorId: changedBy,
      action: 'rental.status_changed',
      targetType: 'rental',
      targetId: rentalId,
      metadata: { fromStatus, toStatus, note: note ?? null },
      createdAt: FieldValue.serverTimestamp()
    })

    // Roll up customer stats once the rental is completed.
    if (toStatus === 'COMPLETED') {
      const customerRef = db.collection('customers').doc(rental.customerId)
      tx.update(customerRef, {
        'stats.totalRentals': FieldValue.increment(1),
        'stats.totalSpend': FieldValue.increment(rental.pricing?.total ?? 0),
        updatedAt: FieldValue.serverTimestamp()
      })
    }
  })

  return { rentalId, status: toStatus }
}

// Marks ACTIVE rentals past their endDate as OVERDUE. Call from a scheduled task.
export async function markOverdueRentals(): Promise<string[]> {
  const db = getAdminFirestore()
  const todayIso = new Date().toISOString().slice(0, 10)

  const snap = await db
    .collection('rentals')
    .where('status', '==', 'ACTIVE')
    .where('endDate', '<', todayIso)
    .get()

  const updated: string[] = []
  for (const doc of snap.docs) {
    await transitionRentalStatus({ rentalId: doc.id, toStatus: 'OVERDUE', changedBy: 'system' })
    updated.push(doc.id)
  }
  return updated
}
