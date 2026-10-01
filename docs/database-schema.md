# Database Schema — Cloud Firestore

This document is the source of truth for the data model. TypeScript mirrors of
every shape below live in `app/types/`. If you change a shape, update both.

Conventions used throughout:
- All documents include `createdAt` / `updatedAt` (Firestore `Timestamp`).
- Money is stored as **integer minor units are not used here** — PHP has no
  common sub-peso pricing in this domain, so prices are stored as plain
  numbers (pesos), always computed server-side, never trusted from the client.
- Soft-delete pattern: catalog documents use `status: 'active' | 'inactive' | 'archived'`
  rather than hard deletes, so historical rentals still resolve their line items.
- Foreign keys are plain document ID strings (e.g. `categoryId`), not
  DocumentReference objects — this keeps documents simple to type on the client.

---

## `users`
One document per Firebase Auth user (both staff and customers), keyed by the
Firebase Auth UID. This is the authorization source of truth — `role` here is
what server code checks, never a client-supplied claim.

| Field | Type | Notes |
|---|---|---|
| `uid` | string (doc ID) | Matches Firebase Auth UID |
| `email` | string | |
| `displayName` | string | |
| `role` | `'customer' \| 'admin' \| 'staff'` | Checked server-side on every privileged route |
| `phone` | string? | |
| `status` | `'active' \| 'disabled'` | Disabled users are blocked at the API layer |
| `createdAt` / `updatedAt` | Timestamp | |

**Indexes:** none beyond default (doc ID lookups only).
**Security:** a user may read/write their own `displayName`/`phone` but never
their own `role` or `status`. Only admins (verified via custom claims, see
Security Rules doc) can write `role`/`status`.

---

## `customers`
Extended profile data for users with `role: 'customer'`. Split from `users`
so admin-managed business fields (spend totals, deposits, notes) don't live in
the same document a customer can partially self-edit.

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc ID) | Equals the `users` doc ID / Auth UID |
| `firstName`, `lastName` | string | |
| `email`, `phone` | string | Denormalized from `users` for admin search |
| `addresses` | array<{ label, line1, line2?, city, province, postalCode, isDefault }> | |
| `idVerification` | `{ status: 'unverified'\|'pending'\|'verified', documentUrl?: string }`? | For deposit-bearing rentals |
| `stats` | `{ totalRentals: number, totalSpend: number, outstandingDeposit: number }` | Maintained server-side by rental status transitions, never client-writable |
| `notes` | string? | Admin-only free text |
| `createdAt` / `updatedAt` | Timestamp | |

**Indexes:** composite on (`lastName` asc, `firstName` asc) for admin listing;
single-field on `email` (automatic).
**Security:** customer can read/write their own doc except `stats` and
`notes`, which are server/admin-only.

---

## `categories`
Top-level catalog groupings (e.g. Sedans, SUVs, Scooters, Sport Bikes ...). Fully admin-managed.

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc ID) | |
| `name` | string | |
| `slug` | string | Unique, used in URLs |
| `description` | string? | |
| `imageUrl` | string? | http(s) URL or `/uploads/...` path |
| `sortOrder` | number | Drives display order, admin-editable via drag reorder |
| `status` | `'active' \| 'inactive'` | |
| `createdAt` / `updatedAt` | Timestamp | |

**Indexes:** single-field on `slug` (automatic, unique enforced at write time
via a transaction check); single-field on `sortOrder`.
**Security:** public read where `status == 'active'`; write restricted to admin.

---

## `subcategories`
Optional children of a category (e.g. Sedans → Economy, Premium).

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc ID) | |
| `categoryId` | string | FK → `categories` |
| `name` | string | |
| `slug` | string | Unique within its category |
| `sortOrder` | number | |
| `status` | `'active' \| 'inactive'` | |
| `createdAt` / `updatedAt` | Timestamp | |

**Indexes:** composite on (`categoryId` asc, `sortOrder` asc) — this is the
hot query for rendering a category page's subcategory filter list.
**Security:** public read where `status == 'active'`; write restricted to admin.

---

## `products`
The rentable catalog item — a *vehicle* (e.g. "Honda Click 125"). If you own
several identical vehicles, `quantityTotal` is the count; individual vehicles
(plate / chassis number) can be tracked in `inventory`.

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc ID) | |
| `sku` | string | Unique |
| `name` | string | |
| `slug` | string | Unique, used in URLs |
| `brand` | string | |
| `categoryId` | string | FK → `categories` |
| `subcategoryId` | string? | FK → `subcategories` |
| `description` | string | |
| `vehicle` | `VehicleInfo` | Structured vehicle facts, see below. Required when creating; legacy documents may lack it |
| `specifications` | array<{ label: string, value: string }> | Free-form extra specs (features, luggage, …) rendered as a table |
| `images` | array<string> | http(s) URLs or `/uploads/...` paths, first is primary |
| `pricing` | `{ daily: number, weekly?: number, monthly?: number, deposit: number }` | **Server is the only writer of truth used at checkout** — see pricing.ts |
| `quantityTotal` | number | Denormalized count of `inventory` docs for this product |
| `quantityAvailable` | number | **Cache only** — real availability is always recomputed server-side per date range against `rentals`; this field is for catalog-browsing display and sort, not for checkout decisions |
| `condition` | `'excellent' \| 'good' \| 'fair'` | Summary condition; individual units track their own in `inventory` |
| `status` | `'active' \| 'inactive' \| 'archived'` | Inactive hides from storefront without deleting rental history references |
| `isRentable` | boolean | Kill-switch independent of `status`, e.g. for units temporarily pulled for service |
| `isFeatured` | boolean | |
| `rating` | `{ average: number, count: number }`? | |
| `createdAt` / `updatedAt` | Timestamp | |

**`vehicle` object** (`VehicleInfo`):

| Field | Type | Notes |
|---|---|---|
| `type` | `'car' \| 'motorcycle'` | Required. Drives the Cars / Motorcycles filter |
| `model` | string? | e.g. `Click 125` |
| `year` | number? | |
| `transmission` | `'automatic' \| 'manual' \| 'semi-automatic'`? | |
| `fuelType` | `'gasoline' \| 'diesel' \| 'hybrid' \| 'electric'`? | |
| `seats` | number? | |
| `engineDisplacement` | number? | cc |
| `color` | string? | |
| `mileage` | number? | km |

Vehicle filters (`vehicleType`, `transmission`, `fuelType`, `minSeats`) are
applied in memory in `GET /api/products`, so they need no extra Firestore indexes.

**Indexes:**
- Composite: (`categoryId` asc, `status` asc, `isFeatured` desc) — category page, featured-first
- Composite: (`subcategoryId` asc, `status` asc)
- Composite: (`brand` asc, `status` asc)
- Composite: (`status` asc, `pricing.daily` asc) — price sort
- Single-field: `slug` (unique), `sku` (unique)

**Security:** public read where `status == 'active'`; all writes restricted to
admin/staff via Nitro API (client SDK write to `products` is denied entirely —
see Security Rules doc — so pricing can never be edited from a hijacked
browser session).

---

## `productVariants`
Optional. Only used for products that come in genuine ordering variants (e.g.
a helmet add-on bundle) rather than just multiple identical physical
units. Most catalog items will have zero variant documents and are rented
directly by `productId`.

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc ID) | |
| `productId` | string | FK → `products` |
| `name` | string | e.g. "Body + 24-70mm kit" |
| `priceModifier` | number | Added to base `products.pricing.daily` |
| `status` | `'active' \| 'inactive'` | |

**Indexes:** single-field on `productId`.
**Security:** same as `products`.

---

## `inventory`
One document per **physical unit** of a product. This is what makes
serial-level tracking (Section 15) possible later without a schema change —
today it's used for condition tracking and unit-level status; full per-unit
assignment to specific rentals is a natural extension of `rentalItems.unitIds`.

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc ID) | |
| `productId` | string | FK → `products` |
| `serialNumber` | string | Unique per product |
| `condition` | `'excellent' \| 'good' \| 'fair' \| 'needs-repair'` | |
| `status` | `'available' \| 'rented' \| 'maintenance' \| 'retired'` | Coarse status; authoritative availability-by-date-range still comes from `rentals`, not this field |
| `notes` | string? | |
| `createdAt` / `updatedAt` | Timestamp | |

**Indexes:** composite on (`productId` asc, `status` asc).
**Security:** admin/staff only, no public read.

---

## `rentals`
The rental order itself (spec calls this "orders" and "rentals"
interchangeably — this system uses **`rentals` as the single source of
truth** for a booking, and treats `orders`/`payments` as the financial record
attached to a rental, avoiding duplicate booking objects. See note at the
bottom of this document.)

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc ID) | Human-friendly rental number also stored, e.g. `RNT-2026-000482` |
| `rentalNumber` | string | Unique, sequential, customer-facing |
| `customerId` | string | FK → `customers` |
| `customerSnapshot` | `{ name, email, phone }` | Denormalized at creation time so admin lists don't need a join |
| `startDate` / `endDate` | Timestamp (date-only, stored at midnight local) | |
| `durationDays` | number | Server-computed |
| `fulfillment` | `{ method: 'pickup' \| 'delivery', address?: {...} }` | |
| `status` | see **Rental Status enum** below | |
| `pricing` | `{ subtotal, discount, deposit, total }` | **Always server-computed at creation and re-validated on every status transition that touches items** |
| `couponId` | string? | FK → `coupons` |
| `notes` | string? | Customer-entered |
| `internalNotes` | string? | Admin-only |
| `statusHistory` | array<{ status, changedBy, changedAt, note? }> | Append-only audit trail |
| `createdAt` / `updatedAt` | Timestamp | |

### Rental Status enum
`PENDING → CONFIRMED → PREPARING → READY_FOR_PICKUP | OUT_FOR_DELIVERY → ACTIVE → RETURN_PENDING → RETURNED → COMPLETED`,
with `CANCELLED` and `OVERDUE` reachable as side-branches. Valid transitions
are enforced server-side in `server/utils/rentalStatus.ts` — never trust a
raw status string from the client.

**Indexes:**
- Composite: (`customerId` asc, `createdAt` desc) — customer's rental history
- Composite: (`status` asc, `startDate` asc) — admin status queues (pending, active, overdue)
- Composite: (`status` asc, `endDate` asc) — overdue detection sweep
**Security:** customer can read their own rentals; only server (via Nitro,
using Admin SDK) can create/update rentals. No direct client writes at all —
this is the most sensitive collection in the system.

---

## `rentalItems`
Line items of a rental, split into a subcollection-flavored top-level
collection (top-level, not a true subcollection, so admin can query items
across all rentals — e.g. "what's due back today across all rentals").

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc ID) | |
| `rentalId` | string | FK → `rentals` |
| `productId` | string | FK → `products` |
| `productSnapshot` | `{ name, sku, image }` | Denormalized so historical rentals still display correctly if the product changes later |
| `quantity` | number | |
| `unitIds` | array<string>? | Optional FK → `inventory`, populated when serial-level assignment is used |
| `pricePerDay` | number | **Snapshotted at booking time** — never recalculated retroactively from live `products.pricing` |
| `lineTotal` | number | `pricePerDay * quantity * durationDays`, server-computed |
| `startDate` / `endDate` | Timestamp | **Denormalized** from the parent `rentals` doc |
| `rentalStatus` | RentalStatus | **Denormalized**, kept in sync on every status transition (see `server/utils/rentalStatus.ts`) |

Firestore has no server-side joins, so `startDate`/`endDate`/`rentalStatus`
are duplicated here specifically so the availability engine can query
`rentalItems` directly by `productId` and get everything it needs in one
read, instead of fetching every candidate rental individually.

**Indexes:** composite on (`productId` asc, `rentalStatus` asc, `startDate` asc)
— this is the exact query the availability engine runs to find overlapping
reservations for a product.
**Security:** same as `rentals` — server-only writes, customer read-only for
their own rental's items.

---

## `cart`
One document per customer (doc ID == `customerId`), holding an array of
draft line items. Cart totals shown here are **advisory only** — always
recalculated server-side at checkout.

| Field | Type | Notes |
|---|---|---|
| `customerId` | string (doc ID) | |
| `items` | array<{ productId, quantity, startDate, endDate, addedAt }> | |
| `updatedAt` | Timestamp | |

**Indexes:** none needed (doc-ID keyed).
**Security:** customer reads/writes only their own cart document directly via
client SDK (this is low-stakes, non-authoritative data, fine for direct
writes) — but checkout itself always goes through the Nitro API.

---

## `favorites`
One document per customer (doc ID == `customerId`), holding a set of
favorited product IDs — a single small document instead of one doc per
favorite, since reads of "is this favorited" and "list my favorites" are both
far more common than incremental favorite churn.

| Field | Type | Notes |
|---|---|---|
| `customerId` | string (doc ID) | |
| `productIds` | array<string> | |
| `updatedAt` | Timestamp | |

**Security:** customer reads/writes only their own document.

---

## `orders`
Financial record of a rental's charges. Kept separate from `rentals` so
payment/refund history can grow (multiple payment attempts, partial refunds
of deposits) without bloating the rental document.

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc ID) | |
| `rentalId` | string | FK → `rentals`, one order per rental |
| `customerId` | string | FK → `customers` |
| `amounts` | `{ subtotal, discount, deposit, total, refundedDeposit? }` | |
| `status` | `'unpaid' \| 'paid' \| 'partially_refunded' \| 'refunded'` | |
| `createdAt` / `updatedAt` | Timestamp | |

**Indexes:** single-field on `rentalId`.
**Security:** server-only writes; customer read-only for their own orders.

---

## `payments`
Individual payment/refund transactions against an `order`.

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc ID) | |
| `orderId` | string | FK → `orders` |
| `type` | `'charge' \| 'deposit_hold' \| 'deposit_refund' \| 'refund'` | |
| `amount` | number | |
| `method` | string | e.g. `'gcash'`, `'card'`, `'cash'` — payment gateway integration is out of scope for this phase, so this records manually-reconciled admin entries for now |
| `reference` | string? | External gateway reference once integrated |
| `createdAt` | Timestamp | |

**Indexes:** single-field on `orderId`.
**Security:** server-only writes; customer read-only for payments tied to
their own orders.

---

## `coupons`
| Field | Type | Notes |
|---|---|---|
| `id` | string (doc ID) | |
| `code` | string | Unique, uppercased |
| `type` | `'percent' \| 'fixed'` | |
| `value` | number | |
| `minSubtotal` | number? | |
| `maxUses` | number? | |
| `usedCount` | number | Server-incremented only |
| `validFrom` / `validTo` | Timestamp | |
| `status` | `'active' \| 'inactive'` | |

**Indexes:** single-field on `code` (unique).
**Security:** public read of active coupons is *not* granted — validation
happens server-side only (Nitro endpoint checks and applies), so coupon logic
can never be reverse-engineered or bypassed from client code.

---

## `settings`
Singleton-style small collection, one doc per config domain, e.g. doc ID
`general`, `rental-policy`, `notifications`. Keeps the shape flexible without
one giant settings blob.

Example `settings/general`:
| Field | Type |
|---|---|
| `companyName` | string |
| `contactEmail` | string |
| `contactPhone` | string |
| `address` | string |
| `socials` | `{ facebook?, instagram?, twitter? }` |

**Security:** public read; admin-only write.

---

## `banners`
Homepage hero slides and promotional banners, admin-managed.

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc ID) | |
| `title` | string | |
| `description` | string | |
| `imageUrl` | string | |
| `ctaLabel` / `ctaHref` | string | |
| `secondaryCtaLabel` / `secondaryCtaHref` | string? | |
| `sortOrder` | number | |
| `placement` | `'hero' \| 'promo'` | |
| `status` | `'active' \| 'inactive'` | |

**Indexes:** composite on (`placement` asc, `status` asc, `sortOrder` asc).
**Security:** public read where `status == 'active'`; admin-only write.

---

## `notifications`
Lightweight per-user notification feed (rental confirmed, return reminder, etc).

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc ID) | |
| `userId` | string | FK → `users` |
| `type` | string | e.g. `'rental_confirmed'`, `'return_due'` |
| `title` / `body` | string | |
| `read` | boolean | |
| `relatedRentalId` | string? | |
| `createdAt` | Timestamp | |

**Indexes:** composite on (`userId` asc, `createdAt` desc).
**Security:** user reads/marks-read only their own; server-only creates.

---

## `activityLogs`
Append-only audit log for admin actions and sensitive status changes.

| Field | Type | Notes |
|---|---|---|
| `id` | string (doc ID) | |
| `actorId` | string | Admin/staff UID, or `'system'` |
| `action` | string | e.g. `'rental.status_changed'`, `'product.updated'` |
| `targetType` / `targetId` | string | |
| `metadata` | object | Free-form diff/context |
| `createdAt` | Timestamp | |

**Indexes:** composite on (`targetType` asc, `targetId` asc, `createdAt` desc).
**Security:** admin read-only; server-only writes; never client-writable
(this is the tamper-evidence layer).

---

## Note on `orders`/`rentals` vs. the spec's suggested split

The original spec lists both `rentals` and `orders` as top-level collections.
This schema keeps that distinction but draws the line at **booking vs.
money**: `rentals` is the operational object (dates, items, status,
fulfillment) and `orders`/`payments` is the financial ledger attached to it.
A single rental has exactly one `orders` document and can have many
`payments` documents (deposit hold, final charge, deposit refund, etc). This
avoids two competing "the booking" objects while still giving finance-side
data room to grow independently.

---

## `popups`
Single document `popups/promo`: the first-visit promotional popup, edited at
**Admin → Promotional Popup**. Kept outside `settings` on purpose (settings are
publicly readable) so drafts / disabled popups are never exposed. Clients read it
only through `GET /api/popup`, which applies the schedule.

| Field | Type | Notes |
|---|---|---|
| `enabled` | boolean | Master switch |
| `title` / `description` / `secondaryText` | string | Copy (secondaryText is the small line above the title) |
| `imageUrl` | string | Optional banner (uploaded via `/api/admin/upload-image` (saved to `UPLOAD_DIR`) or any URL) |
| `ctaLabel` / `ctaHref` | string | Optional button; `ctaHref` must be `/path` or `http(s)://…` |
| `frequency` | `'once' \| 'session' \| 'daily' \| 'weekly'` | How often a visitor who dismissed it sees it again |
| `firstVisitOnly` | boolean | Only visitors with no earlier visit in that browser |
| `delaySeconds` | number | 0–120 |
| `startDate` / `endDate` | ISO string or `''` | Optional schedule window |
| `version` | number | Bumped on save when "show again to everyone" is ticked; visitors' dismissals are keyed to it |
| `updatedAt` | Timestamp | |

Browser storage keys (per visitor): `rr:first-seen`, `rr:first-session`,
`rr:popup-dismissed`, `rr:popup-session-dismissed`.
