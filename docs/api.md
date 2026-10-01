# API Reference

All endpoints live under `server/api/` and are Nitro routes. Every response
follows the same envelope:

```jsonc
// Success
{ "success": true, "data": { /* ... */ }, "message": "optional" }

// Error
{ "success": false, "message": "human-readable message", "code": "OPTIONAL_CODE" }
```

**Auth:** protected routes expect `Authorization: Bearer <Firebase ID token>`.
The `app/composables/useApi.ts` composable attaches this automatically for
every client-side call. Role is resolved server-side from the caller's
`users/{uid}` document — never from anything the client claims.

Legend: 🔓 public · 🔒 authenticated (any role) · 🛡️ admin/staff only

---

## Categories

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/categories` | 🔓 | `?includeInactive=true` only honored for admins |
| POST | `/api/categories` | 🛡️ | Create category |
| GET | `/api/categories/:id` | 🔓 | |
| PUT | `/api/categories/:id` | 🛡️ | |
| DELETE | `/api/categories/:id` | 🛡️ | Soft delete (sets `status: inactive`) |
| POST | `/api/categories/reorder` | 🛡️ | Body: `{ order: [{ id, sortOrder }] }` |

## Subcategories

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/subcategories` | 🔓 | `?categoryId=` filter |
| POST | `/api/subcategories` | 🛡️ | |
| PUT | `/api/subcategories/:id` | 🛡️ | |
| DELETE | `/api/subcategories/:id` | 🛡️ | Soft delete |

## Products

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/products` | 🔓 | `q, categoryId, subcategoryId, brand, minPrice, maxPrice, availableOnly, featuredOnly, sort, page, pageSize` |
| POST | `/api/products` | 🛡️ | |
| GET | `/api/products/:id` | 🔓 | By document ID (admin forms) |
| GET | `/api/products/slug/:slug` | 🔓 | By slug (storefront) — returns `{ product, related }` |
| PUT | `/api/products/:id` | 🛡️ | |
| DELETE | `/api/products/:id` | 🛡️ | Archives (never hard-deletes) |
| GET | `/api/products/:id/inventory` | 🛡️ | List serial units |
| POST | `/api/products/:id/inventory` | 🛡️ | Register a new unit |
| PUT | `/api/products/:id/inventory/:unitId` | 🛡️ | Update condition/status |

## Search

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/search?q=` | 🔓 | Combined vehicle + category autocomplete for the header search dropdown |
| GET | `/api/products/facets` | 🔓 | Distinct brands of active vehicles (catalog brand filter) |

`GET /api/products` also accepts `vehicleType` (`car`\|`motorcycle`), `transmission`, `fuelType` and `minSeats`.

## Availability

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/availability` | 🔓 | `?productId&startDate&endDate&quantity` — the authoritative check |
| GET | `/api/availability/calendar` | 🔓 | `?productId&from&to` → per-day available quantity |

## Cart

Cart itself is a client-writable Firestore document (see `firestore.rules`);
this endpoint only provides trusted pricing:

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/api/cart/price` | 🔓 | Body: `{ lines: [{productId, quantity, startDate, endDate}], couponCode? }` |

## Rentals

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/rentals` | 🔒 | Customers see only their own; staff see all. `status, search, from, to, page, pageSize` |
| POST | `/api/rentals` | 🔒 | **Checkout.** Full server-side re-validation (Section 8) |
| GET | `/api/rentals/:id` | 🔒 | Includes line items; customer restricted to own rental |
| PUT | `/api/rentals/:id/status` | 🔒 | Staff: any valid transition. Customer: only `CANCELLED` while `PENDING` |

## Customers (self-service)

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/customers/me` | 🔒 | |
| PUT | `/api/customers/me` | 🔒 | Cannot touch `stats` or `notes` |

## Auth

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | Requires a fresh Firebase ID token, not yet a `users` doc | Creates `users`/`customers` docs with `role: 'customer'` hardcoded server-side |

## Admin

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/admin/dashboard/stats` | 🛡️ | Totals, upcoming/recent rentals, popular vehicles |
| GET | `/api/admin/customers` | 🛡️ | `search, status, page, pageSize` |
| POST | `/api/admin/customers` | 🛡️ | Creates Firebase Auth user + Firestore docs |
| GET | `/api/admin/customers/:id` | 🛡️ | Includes rental history |
| PUT | `/api/admin/customers/:id` | 🛡️ | Including disabling the account (also disables Firebase Auth sign-in) |
| GET | `/api/admin/activity-logs` | 🛡️ | Last 200 entries |
| GET | `/api/admin/popup` | 🛡️ | Current promotional popup config (with defaults) |
| PUT | `/api/admin/popup` | 🛡️ | Validate + save the popup config; `resetDismissals` bumps `version` |
| POST | `/api/admin/upload-image` | 🛡️ | `multipart/form-data`: `file` (JPEG/PNG/WebP/AVIF/GIF ≤ 5 MB), `folder` (`popup`\|`products`\|`categories`\|`banners`). Returns `{ url }` |

## Promotional popup

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/popup` | 🔓 | The popup if enabled and inside its schedule, otherwise `data: null`. Never errors — failures return `null` |

## Banners

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/banners` | 🔓 | `?placement=hero\|promo` |
| POST | `/api/banners` | 🛡️ | |
| PUT | `/api/banners/:id` | 🛡️ | |
| DELETE | `/api/banners/:id` | 🛡️ | Hard delete (no downstream references) |

## Coupons

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/coupons` | 🛡️ | Never publicly listable — validated only via `/api/cart/price` or checkout |
| POST | `/api/coupons` | 🛡️ | |

## Settings

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/settings/:key` | 🔓 | e.g. `general` |
| PUT | `/api/settings/:key` | 🛡️ | |

---

## Error Codes Worth Handling Specially

| Code | Meaning |
|---|---|
| `AVAILABILITY_CONFLICT` | Returned from checkout when a race condition or stale cart means equipment is no longer available for the requested dates — refetch availability and retry |

## Design Notes

- **Pricing is never trusted from the client.** Every total shown anywhere
  in the UI is fetched from `/api/cart/price` or computed inside
  `/api/rentals` (POST) from live product data — see `server/utils/pricing.ts`.
- **Availability is re-checked twice at checkout**: once before pricing, and
  again inside the Firestore transaction that creates the rental, to close
  the race window between the two reads.
- **Firestore search** uses precomputed prefix arrays (`searchPrefixes`)
  rather than a search service — see `server/utils/search.ts` for the
  trade-offs this implies.
