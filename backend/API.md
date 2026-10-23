# MediStock API — reference

Base URL (dev): `http://localhost:8080` · all paths below start with `/api`.

## Conventions

- **JSON** request/response bodies. Dates are `YYYY-MM-DD`, timestamps ISO-8601
  (e.g. `2026-10-23T13:18:27`).
- **Auth:** `Authorization: Bearer <token>` on every request except
  `/api/health` and `/api/auth/**`. Tokens come from `POST /api/auth/login`
  and expire after `JWT_EXPIRATION_MS` (default 8 h).
- **Errors:** JSON body with a `message` field, e.g. `{"message":"User not found"}`.
- **Paging:** `{ "content": [...], "totalElements": n, "totalPages": n, "number": 0 }`
  — `page` is 0-based, `size` is capped at 100.

## Roles

`ADMIN`, `PHARMACIST`, `STAFF`, `SUPPLIER` — matched from the JWT, never from the body.

| Area | ADMIN | PHARMACIST | STAFF | SUPPLIER |
|---|---|---|---|---|
| `POST /api/auth/login`, `/register`, `/health` | yes | yes | yes | yes |
| Inventory read (`GET /api/inventory/**`) | yes | yes | yes | no |
| Inventory write (POST/PUT/DELETE) | yes | yes | no | no |
| Stock movements (read + POST) | yes | yes | yes | no |
| Medicines (`/api/admin/medicines`) | yes | yes | no | no |
| Suppliers (`/api/admin/suppliers`) | yes | no (1) | no | no |
| Users + audit logs (`/api/admin/users`, `/api/admin/audit-logs`) | yes | no | no | no |
| Dashboard stats (`/api/admin/dashboard/stats`) | yes | no (1) | no | no |
| Purchase orders read | yes | yes | no | read (2) |
| Purchase orders write | yes | yes | no | no |
| Notifications (read) | yes | yes | yes | no |
| Notifications `POST /refresh` | yes | yes | no | no |
| Reports (`/api/reports/**`) | yes | yes | no | no |
| Search (`/api/search`) | yes | yes | yes | no |

(1) The controllers annotate PHARMACIST, but the URL rule `/api/admin/**` requires
ADMIN, so in practice these are admin-only.
(2) Supplier can only read via `/api/purchase-orders/**`; the `/api/admin/purchase-orders`
alias is admin-only.

---

## Health

`GET /api/health` → `200 text/plain` `MediStock backend is running!`

---

## Auth

### `POST /api/auth/login`

```json
{ "email": "admin@medistock.local", "password": "Password@123", "role": "ADMIN" }
```

→ `200`

```json
{ "token": "eyJ...", "tokenType": "Bearer", "expiresIn": 28800, "role": "ADMIN" }
```

`role` must match the account's role. `401` for wrong password, unknown email,
inactive account, or role mismatch (`Selected role does not match your account`).

### `POST /api/auth/register`

```json
{ "fullName": "New User", "email": "new@medistock.local",
  "password": "Password@123", "role": "STAFF" }
```

→ `201 {"message":"Registration successful"}`

Only `STAFF`, `PHARMACIST`, `SUPPLIER` can self-register (not `ADMIN`).
`400` on duplicate email, role not allowed, or validation failure.

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@medistock.local","password":"Password@123","role":"ADMIN"}'
```

---

## Users — ADMIN

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/users?search=&page=0&size=10` | search matches name/email/role; newest first |
| GET | `/api/admin/users/{id}` | |
| POST | `/api/admin/users` | 201 |
| PUT | `/api/admin/users/{id}` | password optional |
| PATCH | `/api/admin/users/{id}/status` | `{"active": true}` |
| DELETE | `/api/admin/users/{id}` | `{"message":"User deleted"}` |

User object: `{userId, fullName, email, role, active}` (never the password hash).

```json
POST /api/admin/users
{ "fullName": "Ravi Kumar", "email": "ravi@medistock.local",
  "password": "Password@123", "role": "PHARMACIST", "active": true }
```

Rules: email unique + lowered, password ≥ 8 chars, role must exist.
`400` when deactivating/deleting the last active admin.
Every create/update/status/delete writes an audit row.

---

## Medicines — ADMIN, PHARMACIST

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/medicines` | all medicines |
| POST | `/api/admin/medicines` | 201 |
| PUT | `/api/admin/medicines/{id}` | |
| DELETE | `/api/admin/medicines/{id}` | 204; `400` if batches exist |

```json
{ "medicineName": "Paracetamol 500mg", "category": "Analgesic",
  "description": "Pain and fever" }
```

`medicineName` is required (≤ 150 chars).

---

## Suppliers — ADMIN

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/suppliers` | |
| GET | `/api/admin/suppliers/{id}` | |
| POST | `/api/admin/suppliers` | 201, `active` forced true |
| PUT | `/api/admin/suppliers/{id}` | |
| PATCH | `/api/admin/suppliers/{id}/status` | `{"active": false}` |

```json
{ "supplierName": "MedPlus Distributors", "contactNumber": "9876543210",
  "email": "orders@medplus.example", "address": "22 Industrial Area" }
```

---

## Inventory — ADMIN, PHARMACIST (STAFF read-only)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/inventory` | all batches |
| GET | `/api/inventory/low-stock` | `quantity <= minimumStock` |
| GET | `/api/inventory/{id}` | |
| POST | `/api/inventory` | 201 |
| PUT | `/api/inventory/{id}` | |
| DELETE | `/api/inventory/{id}` | 204; `400` if movement history exists |

Batch object: `{inventoryId, medicineId, supplierId, batchNumber, quantity,
minimumStock, unitPrice, manufacturingDate, expiryDate, createdAt}`

```json
{ "medicineId": 1, "supplierId": 1, "batchNumber": "PARA-2026-A",
  "quantity": 120, "minimumStock": 20, "unitPrice": 2.50,
  "manufacturingDate": "2026-01-10", "expiryDate": "2028-01-10" }
```

Required: `medicineId`, `batchNumber`, `expiryDate`; numbers may not be negative.

---

## Stock movements — ADMIN, PHARMACIST, STAFF

| Method | Path | Notes |
|---|---|---|
| GET | `/api/stock-movements` | newest first, unpaged |
| GET | `/api/stock-movements/inventory/{inventoryId}` | one batch |
| POST | `/api/stock-movements` | 201 |

```json
{ "inventoryId": 1, "changeQuantity": 15, "movementType": "OUT",
  "notes": "Dispensed at counter" }
```

- `movementType`: `IN` or `OUT` (case-insensitive). `changeQuantity` > 0.
- `OUT` larger than current stock → `400 Insufficient stock for this movement`.
- Batch quantity is updated, a `stock_logs` row and audit row are written,
  and a low-stock notification is raised if the batch drops to/below minimum.
- Response: `{stockLogId, inventoryId, userId, changeQuantity,
  movementType, notes, changedAt}` (`changeQuantity` is negative for OUT).

---

## Purchase orders — ADMIN, PHARMACIST (SUPPLIER read-only)

Both prefixes work: `/api/purchase-orders/**` and `/api/admin/purchase-orders/**`.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/purchase-orders` | newest first |
| GET | `/api/purchase-orders/{id}` | |
| GET | `/api/purchase-orders/supplier/{supplierId}` | |
| GET | `/api/purchase-orders/{id}/items` | |
| POST | `/api/purchase-orders` | 201 |
| PATCH | `/api/purchase-orders/{id}/status` | status change |

```json
{ "supplierId": 1,
  "items": [
    { "medicineId": 1, "quantity": 100, "unitPrice": 2.40 },
    { "medicineId": 2, "quantity": 50,  "unitPrice": 8.00 }
  ] }
```

→ `{purchaseOrderId, supplierId, createdBy, orderDate, status, totalAmount}`
(`createdBy` = authenticated user, `orderDate` = today, `status` = `PENDING`).

Status values: `PENDING`, `APPROVED`, `RECEIVED`, `CANCELLED` (anything else → 400).

---

## Notifications — ADMIN, PHARMACIST, STAFF

| Method | Path | Notes |
|---|---|---|
| GET | `/api/notifications` | latest 50 |
| GET | `/api/notifications/unread-count` | `{"count": 3}` |
| POST | `/api/notifications/refresh` | ADMIN/PHARMACIST; `{"created": n, "unread": n}` |
| POST | `/api/notifications/{id}/read` | `{"message":"Marked as read"}` |
| POST | `/api/notifications/read-all` | `{"updated": n}` |

Notification: `{notificationId, userId, notificationType, message, read, createdAt}`

Types produced by `refresh`: `LOW_STOCK`, `EXPIRED`, `EXPIRING_SOON` (≤ 30 days),
`ORDER_PENDING`. Existing unread notifications for the same condition are not
duplicated. `refresh` is safe to call repeatedly.

---

## Reports — ADMIN, PHARMACIST

`GET /api/reports/types`

```json
[{"type":"stock","name":"Stock on hand"}, ...]
```

`GET /api/reports/{type}.csv?from=YYYY-MM-DD&to=YYYY-MM-DD`
→ `text/csv` attachment `medistock-{type}-{date}.csv`.

| type | columns |
|---|---|
| `stock` | inventory_id, medicine, category, batch, quantity, minimum_stock, unit_price, stock_value, supplier, expiry_date |
| `expiry` | inventory_id, medicine, batch, expiry_date, status (EXPIRED/EXPIRING_SOON/SAFE), quantity |
| `low-stock` | inventory_id, medicine, batch, quantity, minimum_stock, shortfall |
| `movements` | stock_log_id, changed_at, medicine, batch, movement_type, change_quantity, user, notes |
| `orders` | purchase_order_id, order_date, supplier, status, total_amount, created_by |
| `users` | user_id, full_name, email, role, active, created_at |

`from`/`to` apply to `movements` and `orders` only. Each download writes a
`reports` row and a `REPORT_GENERATED` audit entry.

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/reports/stock.csv" -o stock.csv
```

---

## Search — ADMIN, PHARMACIST, STAFF

`GET /api/search?q=para`

```json
{ "query": "para",
  "users": [],
  "medicines": [{"medicineId":1,"medicineName":"Paracetamol 500mg","category":"Analgesic"}],
  "inventory": [{"inventoryId":1,"medicineId":1,"batchNumber":"PARA-2026-A",
                 "quantity":120,"expiryDate":"2028-01-10"}] }
```

5 results per group. `users` is populated for ADMIN only (empty for others).
Empty `q` returns empty arrays.

---

## Dashboard — ADMIN

`GET /api/admin/dashboard/stats`

```json
{
  "kpis": { "totalMedicines": 8, "totalBatches": 8, "totalUnits": 640,
            "stockValue": 6097.80, "lowStockCount": 3, "expiringSoonCount": 2,
            "expiredCount": 1, "pendingOrders": 1, "activeUsers": 4,
            "unreadNotifications": 6 },
  "healthBuckets": { "healthy": 5, "expiringSoon": 2, "expired": 1 },
  "movementsLast30Days": [{"date":"2026-10-01","in":40,"out":12}],
  "stockByCategory":   [{"category":"Analgesic","quantity":240}],
  "expiryTimeline":    [{"label":"0-30d","count":2}],
  "stockBySupplier":   [{"supplier":"MedPlus Distributors","quantity":300}],
  "monthlyPoValue":    [{"month":"2026-05","value":0}],
  "userRoles":         [{"role":"ADMIN","count":1}]
}
```

All aggregations run in Java (MySQL 5.5-compatible — no window functions).
`monthlyPoValue` covers the last 6 months, `movementsLast30Days` exactly 30 days
(zero-filled), `expiryTimeline` uses 7 buckets.

---

## Audit logs — ADMIN

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/audit-logs?action=&q=&page=0&size=20` | `action` exact match; `q` matches performedBy/summary/entityType |
| GET | `/api/admin/audit-logs/actions` | distinct action names for filters |

Entry: `{auditId, userId, action, entityType, entityId, summary, performedBy, createdAt}`

Actions: `CREATE`, `UPDATE`, `DELETE`, `ACTIVATE`, `DEACTIVATE`, `LOGIN`,
`REGISTER`, `STOCK_IN`, `STOCK_OUT`, `REPORT_GENERATED`.
Entity types: `USER`, `MEDICINE`, `SUPPLIER`, `INVENTORY`, `PURCHASE_ORDER`,
`REPORT`.

---

## Dev / smoke endpoints

`GET /api/test-protected`, `/api/admin/test`, `/api/medicines/test`,
`/api/inventory/test`, `/api/supplier/test` return plain strings and are used to
verify JWT + role wiring. Safe to remove before production.

## Status codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | Deleted (no body) |
| 400 | Validation / business rule violated (`message` explains) |
| 401 | Missing/invalid/expired token, or bad login credentials |
| 403 | Authenticated but role not allowed |
| 404 | Unknown id or report type |

## Not implemented (M2 scope)

Token refresh, rate limiting, server-side paging for stock movements and CSV
exports, and stock-value history. The frontend loads movements fully and filters
client-side.
