# MediStock API — reference

Base URL (dev): `http://localhost:8080` · every path below starts with `/api`.
Production: `https://medistock-api-pxmy.onrender.com`.

## Conventions

- **JSON** request/response bodies. Dates are `YYYY-MM-DD`, timestamps ISO-8601.
- **Auth:** `Authorization: Bearer <token>` on every request except
  `/api/health`, `/api/auth/**` and `/uploads/**`. Tokens come from
  `POST /api/auth/login` and expire after `JWT_EXPIRATION_MS` (default 8 h).
- **Errors:** JSON body with a `message` field, e.g. `{"message":"User not found"}`.
- **Paging:** `{ "content": [...], "totalElements": n, "totalPages": n, "number": 0 }`
  — `page` is 0-based, `size` is capped at 100.
- **CSV:** report downloads return `text/csv` as an attachment.

## Authorization model

Two layers, both enforced:

1. **URL rules** in `config/SecurityConfig` (evaluated first, most specific wins).
2. **`@PreAuthorize`** on controller methods.

The role always comes from the JWT → database lookup, never from the request
body. A deactivated account is rejected on its next request.

| Area | ADMIN | PHARMACIST | STAFF | SUPPLIER |
|---|---|---|---|---|
| `POST /api/auth/login`, `/register`; `GET /api/health` | yes | yes | yes | yes |
| Users (`/api/admin/users/**`) | yes | no | no | no |
| Categories (`/api/admin/categories`) | yes | no | no | no |
| Medicines read (`GET /api/admin/medicines`) | yes | yes | yes | no |
| Medicines write | yes | yes | no | no |
| Suppliers read (`GET /api/admin/suppliers`) | yes | yes | no | no |
| Suppliers write (PUT/PATCH/DELETE) | yes | no | no | no |
| Inventory read (`GET /api/inventory/**`) | yes | yes | yes | no |
| Inventory write | yes | yes | no | no |
| Stock movements (read + POST) | yes | yes | no (1) | no |
| Purchase orders — list | yes | yes | no | no |
| Purchase orders — create | no | yes | no | no |
| Purchase orders — approve/reject/cancel | yes | no | no | no |
| Purchase orders — receive | yes | yes | yes | no |
| Purchase orders — `/{id}/items` | yes | yes | yes | yes |
| Purchase orders — `my-orders` | no | no | no | yes |
| Returns — list | no | yes | no | yes |
| Returns — create | no | no | no | yes |
| Returns — decision | no | yes | no | no |
| FEFO / Dispatch | yes | yes | no | no |
| AI recommendations | yes | yes | no | no |
| Assistant chat | yes | yes | no | no |
| Stock check reports — submit / mine | no | no | yes | no |
| Stock check reports — all / decide | yes | yes | no | no |
| Reports (`/api/reports/**`) | yes | yes | no | no |
| Notifications (own) | yes | yes | yes | yes |
| Notifications `POST /refresh`, `DELETE /clear-all` | yes | yes | no | no |
| Search | yes | yes | yes | no |
| Dashboard stats | yes | no (2) | no | no |
| Audit logs | yes | no | no | no |
| Profile (`/api/profile`) | yes | yes | yes | no |
| Supplier self-service (`/api/supplier/**`) | no | no | no | yes |
| Database backups | yes | no | no | no |
| Email test | yes | no | no | no |
| Pharmacist module (`/api/pharmacist/**`) | yes | yes | no | no |

(1) `SecurityConfig` lets STAFF reach `/api/stock-movements/**`, but the
controller's `@PreAuthorize` is ADMIN/PHARMACIST, so staff receive **403**.

(2) `DashboardController` annotates PHARMACIST, but the URL rule
`/api/admin/**` requires ADMIN, so in practice this is admin-only.

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
{
  "token": "eyJ...",
  "tokenType": "Bearer",
  "expiresIn": 28800,
  "role": "ADMIN",
  "profilePicture": null,
  "fullName": "Admin User"
}
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

## Categories — ADMIN

Categories are stored as `medicines.category`, so a category exists while at
least one medicine uses it. These endpoints manage that attribute in bulk.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/categories` | `[{name, medicineCount}]`, alphabetical |
| POST | `/api/admin/categories` | 201; tags selected medicines |
| PUT | `/api/admin/categories` | rename / retag |
| DELETE | `/api/admin/categories/{name}` | clears the category from its medicines |

```json
POST /api/admin/categories
{ "name": "Analgesic", "medicineIds": [1, 4] }
```

`400` when the name is blank or no medicine is selected.

---

## Medicines

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/api/admin/medicines` | ADMIN, PHARMACIST, STAFF | all medicines |
| POST | `/api/admin/medicines` | ADMIN, PHARMACIST | 201 |
| PUT | `/api/admin/medicines/{id}` | ADMIN, PHARMACIST | |
| DELETE | `/api/admin/medicines/{id}` | ADMIN, PHARMACIST | 204; `400` if batches exist |

```json
{ "medicineName": "Paracetamol 500mg", "category": "Analgesic",
  "description": "Pain and fever" }
```

`medicineName` is required (≤ 150 chars).

---

## Suppliers — ADMIN (read also PHARMACIST)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/suppliers` | ADMIN, PHARMACIST |
| GET | `/api/admin/suppliers/{id}` | ADMIN, PHARMACIST |
| POST | `/api/admin/suppliers` | 201, `active` forced true |
| PUT | `/api/admin/suppliers/{id}` | ADMIN only |
| PATCH | `/api/admin/suppliers/{id}/status` | `{"active": false}`, ADMIN only |

```json
{ "supplierName": "MedPlus Distributors", "contactNumber": "9876543210",
  "email": "orders@medplus.example", "address": "22 Industrial Area" }
```

---

## Inventory

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/api/inventory` | ADMIN, PHARMACIST, STAFF | all batches |
| GET | `/api/inventory/low-stock` | same | `quantity <= minimumStock` |
| GET | `/api/inventory/{id}` | same | |
| POST | `/api/inventory` | ADMIN, PHARMACIST | 201 |
| PUT | `/api/inventory/{id}` | ADMIN, PHARMACIST | |
| DELETE | `/api/inventory/{id}` | ADMIN, PHARMACIST | 204; `400` if movement history exists |

Batch object: `{inventoryId, medicineId, supplierId, batchNumber, quantity,
minimumStock, unitPrice, manufacturingDate, expiryDate, createdAt}`

```json
{ "medicineId": 1, "supplierId": 1, "batchNumber": "PARA-2026-A",
  "quantity": 120, "minimumStock": 20, "unitPrice": 2.50,
  "manufacturingDate": "2026-01-10", "expiryDate": "2028-01-10" }
```

Required: `medicineId`, `batchNumber`, `expiryDate`; numbers may not be negative.

---

## Stock movements — ADMIN, PHARMACIST

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
- Batch quantity is updated, a `stock_logs` row and audit row are written, and a
  low-stock notification is raised if the batch drops to/below minimum.
- Response: `{stockLogId, inventoryId, userId, changeQuantity, movementType,
  notes, changedAt}` (`changeQuantity` is negative for OUT).

---

## Purchase orders

Both prefixes work: `/api/purchase-orders/**` and `/api/admin/purchase-orders/**`.

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/api/purchase-orders` | ADMIN, PHARMACIST | newest first |
| GET | `/api/purchase-orders/{id}` | ADMIN, PHARMACIST, SUPPLIER | |
| GET | `/api/purchase-orders/supplier/{supplierId}` | ADMIN, PHARMACIST | |
| GET | `/api/purchase-orders/{id}/items` | all four roles | line items |
| GET | `/api/purchase-orders/ready-to-receive` | ADMIN, PHARMACIST, STAFF | status `APPROVED` |
| GET | `/api/purchase-orders/my-orders` | SUPPLIER | own orders only |
| POST | `/api/purchase-orders` | **PHARMACIST** | 201 |
| POST | `/api/purchase-orders/{id}/receive` | ADMIN, PHARMACIST, STAFF | stock in |
| PATCH | `/api/purchase-orders/{id}/status` | **ADMIN** | approve / reject / cancel |

```json
POST /api/purchase-orders
{ "supplierId": 1,
  "items": [
    { "medicineId": 1, "quantity": 100, "unitPrice": 2.40 },
    { "medicineId": 2, "quantity": 50,  "unitPrice": 8.00 }
  ] }
```

→ `{purchaseOrderId, supplierId, createdBy, orderDate, status, totalAmount}`
(`createdBy` = authenticated user, `orderDate` = today, `status` = `PENDING`).

Status transitions (`PATCH`):

| From | Allowed |
|---|---|
| `PENDING` | `APPROVED`, `REJECTED`, `CANCELLED` |
| `APPROVED` | `CANCELLED` |
| `PARTIALLY_RECEIVED` | `CANCELLED` |

Anything else → `400`. Full status set: `PENDING`, `APPROVED`, `REJECTED`,
`CANCELLED`, `PARTIALLY_RECEIVED`, `RECEIVED`.

### Receiving

```json
POST /api/purchase-orders/12/receive
{ "items": [
    { "itemId": 30, "receivedQuantity": 60, "batchNumber": "PARA-2026-B",
      "manufacturingDate": "2026-02-01", "expiryDate": "2028-02-01" }
  ] }
```

Creates or tops up inventory batches, sets `PARTIALLY_RECEIVED` or `RECEIVED`,
writes audit rows and notifies the supplier.

---

## Medicine returns

Suppliers submit a return for their own stock; pharmacists decide. Inventory is
only adjusted when the return is approved and restock-eligible.

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/api/returns` | PHARMACIST, SUPPLIER | pharmacist sees supplier returns; supplier sees own rows |
| POST | `/api/returns` | SUPPLIER | 201 |
| PUT | `/api/returns/{returnId}/decision` | PHARMACIST | `APPROVE` / `REJECT` |

```json
POST /api/returns
{ "returnType": "SUPPLIER_RETURN", "inventoryId": 5, "supplierId": 2,
  "returnQuantity": 10, "returnReason": "Damaged packaging",
  "medicineCondition": "DAMAGED", "notes": "Received cracked strips" }
```

- `returnType` must be `SUPPLIER_RETURN`.
- `medicineCondition`: `SEALED`, `OPENED`, `DAMAGED`, `EXPIRED` or `DEFECTIVE`.
- `returnQuantity` ≥ 1 and may not exceed the batch quantity.
- A supplier may only return batches belonging to their own supplier record.
- `customerName` / `customerContact` are ignored (supplier returns only).

```json
PUT /api/returns/7/decision
{ "decision": "APPROVE", "notes": "Credit note raised" }
```

`decision`: `APPROVE` or `REJECT` (anything else → 400).
Response: the return record — `returnId`, `returnType`, `inventoryId`,
`supplierId`, `returnQuantity`, `returnReason`, `medicineCondition`,
`restockEligible`, `returnStatus` (`PENDING`/`APPROVED`/`REJECTED`),
`createdBy`, `processedBy`, `returnDate`, `createdAt`, `processedAt`, `notes`.

---

## Dispatch (FEFO) — ADMIN, PHARMACIST

`POST /api/fefo/dispense`

```json
{ "medicineId": 1, "quantity": 25, "notes": "Counter sale" }
```

Picks batches in earliest-expiry-first order (skipping expired stock), deducts
the quantity, writes `OUT` stock logs and an audit row.

```json
{
  "message": "FEFO dispensing completed successfully",
  "medicineId": 1,
  "requestedQuantity": 25,
  "dispensedQuantity": 25,
  "dispensedBatches": [
    { "inventoryId": 9, "batchNumber": "PARA-2026-A",
      "expiryDate": "2027-01-10", "dispensedQuantity": 25 }
  ]
}
```

`400` when quantity is missing/≤ 0 or stock is insufficient (`message` explains).

---

## Stock check reports

Staff physically count a batch; pharmacist/admin approve or reject.

| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/api/stock-check-reports` | STAFF | 201 |
| GET | `/api/stock-check-reports/my` | STAFF | own reports |
| GET | `/api/stock-check-reports/all` | ADMIN, PHARMACIST | all reports |
| PUT | `/api/stock-check-reports/{id}/approve` | ADMIN, PHARMACIST | applies the count |
| PUT | `/api/stock-check-reports/{id}/reject` | ADMIN, PHARMACIST | |

```json
POST /api/stock-check-reports
{ "inventoryId": 3, "physicalQuantity": 48, "remarks": "Shelf count" }

PUT /api/stock-check-reports/9/approve
{ "reviewRemarks": "Matches system after recount" }
```

Report: `{reportId, inventoryId, medicineName, batchNumber, systemQuantity,
physicalQuantity, difference, status, submittedBy, submittedAt, reviewedBy,
reviewedAt, remarks, reviewRemarks}`. Status: `PENDING`, `APPROVED`, `REJECTED`.

---

## AI recommendations — ADMIN, PHARMACIST

`GET /api/ai-recommendations` — rule-based, computed from local data only.

```json
{
  "summary": { "totalMedicines": 12, "lowStockCount": 6, "expiringBatchCount": 5,
               "criticalExpiryCount": 2, "reorderCount": 4 },
  "lowStockItems": [{ "medicineId": 3, "medicineName": "Amoxicillin 500mg",
                      "availableStock": 4, "minimumStock": 20, "severity": "HIGH" }],
  "reorderSuggestions": [{ "medicineId": 3, "medicineName": "Amoxicillin 500mg",
                           "currentStock": 4, "suggestedQuantity": 96,
                           "estimatedCost": 480.00, "reason": "Below minimum stock" }],
  "expiryRisks": [{ "inventoryId": 9, "medicineName": "Cetirizine 10mg",
                    "batchNumber": "CET-2026-A", "remainingQuantity": 30,
                    "expiryDate": "2026-12-01", "daysUntilExpiry": 12,
                    "riskLevel": "CRITICAL" }],
  "demandForecasts": [{ "medicineId": 3, "medicineName": "Amoxicillin 500mg",
                        "currentStock": 4, "averageDailyDemand": 1.8,
                        "predictedSevenDayDemand": 13,
                        "recommendation": "Reorder within 2 days" }],
  "stockReport": { "generatedAt": "2026-11-20T09:15:00", "overallStatus": "ATTENTION",
                   "insights": ["6 batches are below minimum stock"] }
}
```

---

## Notifications — all roles (own rows)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/notifications` | latest 50 |
| GET | `/api/notifications/unread` | unread only |
| GET | `/api/notifications/read` | read only |
| GET | `/api/notifications/unread-count` | `{"count": 3}` |
| POST | `/api/notifications/refresh` | ADMIN/PHARMACIST; `{"created": n, "unread": n}` |
| POST | `/api/notifications/{id}/read` | `{"message":"Marked as read"}` |
| POST | `/api/notifications/read-all` | `{"updated": n}` |
| DELETE | `/api/notifications/{id}` | delete one |
| DELETE | `/api/notifications/clear-all` | ADMIN/PHARMACIST |

Notification: `{notificationId, userId, notificationType, message, read, createdAt}`

Types produced by `refresh`: `LOW_STOCK`, `EXPIRED`, `EXPIRING_SOON` (≤ 30 days),
`ORDER_PENDING`. Existing unread notifications for the same condition are not
duplicated; `refresh` is safe to call repeatedly.

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
| `wastage` | section, medicine, batch, expiry_date, days_to_expiry, quantity, unit_price, value, action |

`GET /api/reports/wastage?days=90` returns the same data as JSON, with
`summary`, `expired`, `nearExpiry`, `wastageReturns` and `fefoQueue`.

`from`/`to` apply to `movements` and `orders` only. Each download writes a
`reports` row and a `REPORT_GENERATED` audit entry.

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/reports/stock.csv" -o stock.csv
```

---

## Assistant — ADMIN, PHARMACIST

`POST /api/assistant/chat`

```json
{"message": "Which items are low on stock?"}
```

Returns `intent`, `answer`, `rows` and `suggestions`. Intent matching covers
low stock, near-expiry, expired batches, FEFO order, wastage, returns,
reordering, stock overview and medicine lookup. Answers are computed from the
local database; no external AI service or API key is used.

`GET /api/assistant/suggestions` → starter questions.

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
  "kpis": { "totalMedicines": 12, "totalSuppliers": 4, "totalBatches": 16,
            "totalUnits": 2654, "stockValue": 10532.05, "lowStockCount": 6,
            "expiringSoonCount": 3, "expiredCount": 3, "pendingOrders": 2,
            "activeUsers": 8, "unreadNotifications": 21 },
  "healthBuckets": { "healthy": 10, "expiringSoon": 3, "expired": 3 },
  "movementsLast30Days": [{"date":"2026-11-01","in":40,"out":12}],
  "stockByCategory":   [{"category":"Analgesic","quantity":240}],
  "expiryTimeline":    [{"label":"0-30d","count":2}],
  "stockBySupplier":   [{"supplier":"MedPlus Distributors","quantity":300}],
  "monthlyPoValue":    [{"month":"2026-05","value":0}],
  "userRoles":         [{"role":"ADMIN","count":2}]
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

## Profile — ADMIN, PHARMACIST, STAFF

| Method | Path | Notes |
|---|---|---|
| GET | `/api/profile` | current user |
| PUT | `/api/profile` | update name / password / picture |

---

## Supplier self-service — SUPPLIER

| Method | Path | Notes |
|---|---|---|
| GET | `/api/supplier/me` | own supplier record |
| PUT | `/api/supplier/me` | update contact details |
| GET | `/api/supplier/me/inventory` | own batches + medicine details |
| GET | `/api/supplier/me/medicines` | own medicine catalogue |
| POST | `/api/supplier/me/profile-picture` | multipart `file`; JPEG/PNG/WebP ≤ 2 MB |

`GET /api/supplier/me/inventory` returns
`{inventoryId, medicineId, medicineName, category, batchNumber, quantity,
unitPrice, expiryDate, ...}`.

---

## Pharmacist module — ADMIN, PHARMACIST

Convenience endpoints used by the pharmacist screens; they mirror the shared
routes above.

| Method | Path |
|---|---|
| GET | `/api/pharmacist/dashboard` |
| GET / PUT | `/api/pharmacist/profile` |
| GET | `/api/pharmacist/stock-monitoring` |
| GET / POST | `/api/pharmacist/medicines` |
| GET / PUT / DELETE | `/api/pharmacist/medicines/{id}` |
| GET / POST | `/api/pharmacist/inventory` |
| PUT / DELETE | `/api/pharmacist/inventory/{id}` |
| GET | `/api/pharmacist/low-stock` |
| GET | `/api/pharmacist/expired` |
| GET | `/api/pharmacist/expiring-soon` |
| GET / POST | `/api/pharmacist/suppliers` |

---

## Database backups — ADMIN

Full operational guide: [`BACKUP-RESTORE.md`](BACKUP-RESTORE.md).

| Method | Path | Notes |
|---|---|---|
| POST | `/api/admin/database-backups` | create a ZIP backup |
| GET | `/api/admin/database-backups` | `[{filename, size, createdAt}]`, newest first |
| GET | `/api/admin/database-backups/{filename}/download` | `application/zip` |
| POST | `/api/admin/database-backups/restore` | multipart: `file` + `confirmation` |

Create response:

```json
{ "message": "Database backup created successfully",
  "filename": "medistock_backup_20261114_145741.zip",
  "size": 8007,
  "createdAt": "2026-11-14T14:57:42.698Z" }
```

Restore requires the literal confirmation `RESTORE MEDISTOCK`, a `.zip` file of
≤ 100 MB, and takes a safety backup before replacing data.

---

## Email test — ADMIN

`POST /api/admin/email-test`

```json
{ "recipient": "you@example.com" }
```

| Status | Meaning |
|---|---|
| 200 | `{"message":"Test email sent successfully to ..."}` |
| 400 | invalid/missing recipient |
| 502 | SMTP rejected the message (bad credentials, blocked port) |
| 503 | SMTP not configured — set `MAIL_USERNAME` / `MAIL_PASSWORD` |

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
| 502 | Upstream dependency failed (SMTP) |
| 503 | Feature not configured on this deployment |

## Not implemented (M2 scope)

Token refresh, rate limiting, server-side paging for stock movements and CSV
exports, and stock-value history. The frontend loads movements fully and filters
client-side.
