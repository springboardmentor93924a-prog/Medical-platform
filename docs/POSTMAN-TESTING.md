# Postman API testing

Importable suite covering login, role-based access and one route per module — 49 requests, all assertions verified against the live API.

## Files

| File | Purpose |
|---|---|
| [`postman/MediStock-API.postman_collection.json`](postman/MediStock-API.postman_collection.json) | The test collection (4 folders) |
| [`postman/MediStock-Production.postman_environment.json`](postman/MediStock-Production.postman_environment.json) | `baseUrl` = Render API + demo accounts |
| [`postman/MediStock-Local.postman_environment.json`](postman/MediStock-Local.postman_environment.json) | `baseUrl` = `http://localhost:8080` |

## How to run

1. Postman → **Import** → drop all three JSON files.
2. Top-right environment dropdown → **MediStock - Production (Render)**.
3. Left sidebar → **MediStock API - Role-Based Test Suite** → **Run** (Collection Runner) → **Run MediStock API**.
4. Open **Test Results** on any request, or read the runner summary (expect **49 passed, 0 failed**).

Folders can also be run alone: the collection pre-request script logs in and fills any missing token.

## What is tested

### 01 — Auth & login (8)

| # | Request | Method + path | Expected | Response type |
|---|---|---|---|---|
| 1 | Health check | `GET /api/health` | 200 | `text/plain` |
| 2 | Login admin | `POST /api/auth/login` | 200 + JWT | `application/json` |
| 3 | Login pharmacist | `POST /api/auth/login` | 200 + JWT | `application/json` |
| 4 | Login staff | `POST /api/auth/login` | 200 + JWT | `application/json` |
| 5 | Login supplier | `POST /api/auth/login` | 200 + JWT | `application/json` |
| 6 | Wrong password | `POST /api/auth/login` | 401 | `application/json` |
| 7 | Role mismatch | `POST /api/auth/login` | 401 | `application/json` |
| 8 | Missing fields | `POST /api/auth/login` | 400 | `application/json` |

### 02 — Role-based access (18)

| # | Request | Method + path | Role | Expected |
|---|---|---|---|---|
| 9 | List users | `GET /api/admin/users` | Admin | 200 |
| 10 | List users | `GET /api/admin/users` | Pharmacist | 403 |
| 11 | List users | `GET /api/admin/users` | Staff | 403 |
| 12 | Create purchase order | `POST /api/purchase-orders` | Admin | 403 (only pharmacists create) |
| 13 | List purchase orders | `GET /api/purchase-orders` | Pharmacist | 200 |
| 14 | List purchase orders | `GET /api/purchase-orders` | Staff | 403 |
| 15 | List purchase orders | `GET /api/purchase-orders` | Supplier | 403 |
| 16 | Own purchase orders | `GET /api/purchase-orders/my-orders` | Supplier | 200 |
| 17 | List returns | `GET /api/returns` | Admin | 403 |
| 18 | List returns | `GET /api/returns` | Pharmacist | 200 |
| 19 | List returns | `GET /api/returns` | Staff | 403 |
| 20 | List returns | `GET /api/returns` | Supplier | 200 |
| 21 | All stock checks | `GET /api/stock-check-reports/all` | Staff | 403 |
| 22 | All stock checks | `GET /api/stock-check-reports/all` | Pharmacist | 200 |
| 23 | Wastage report | `GET /api/reports/wastage` | Staff | 403 |
| 24 | Assistant chat | `POST /api/assistant/chat` | Staff | 403 |
| 25 | Protected route, no token | `GET /api/admin/users` | — | 401 |
| 26 | Protected route, bad token | `GET /api/admin/users` | — | 401 |

### 03 — Core routes, happy path (19)

| # | Request | Method + path | Role | Expected | Response type |
|---|---|---|---|---|---|
| 27 | Dashboard KPIs | `GET /api/admin/dashboard/stats` | Admin | 200 | `application/json` |
| 28 | Inventory list | `GET /api/inventory` | Admin | 200 | `application/json` |
| 29 | Low stock | `GET /api/inventory/low-stock` | Staff | 200 | `application/json` |
| 30 | Medicines | `GET /api/admin/medicines` | Staff | 200 | `application/json` |
| 31 | Suppliers | `GET /api/admin/suppliers` | Admin | 200 | `application/json` |
| 32 | Ready to receive | `GET /api/purchase-orders/ready-to-receive` | Staff | 200 | `application/json` |
| 33 | PO items | `GET /api/purchase-orders/1/items` | Staff | 200 | `application/json` |
| 34 | Create PO (mutating) | `POST /api/purchase-orders` | Pharmacist | 201 | `application/json` |
| 35 | Wastage report | `GET /api/reports/wastage?days=90` | Pharmacist | 200 | `application/json` |
| 36 | Wastage CSV | `GET /api/reports/wastage.csv` | Admin | 200 | `text/csv` |
| 37 | AI recommendations | `GET /api/ai-recommendations` | Pharmacist | 200 | `application/json` |
| 38 | Assistant chat | `POST /api/assistant/chat` | Admin | 200 | `application/json` |
| 39 | Notifications | `GET /api/notifications` | Admin | 200 | `application/json` |
| 40 | Unread count | `GET /api/notifications/unread-count` | Staff | 200 | `application/json` |
| 41 | Audit logs | `GET /api/admin/audit-logs` | Admin | 200 | `application/json` |
| 42 | Profile | `GET /api/profile` | Staff | 200 | `application/json` |
| 43 | Global search | `GET /api/search?q=para` | Admin | 200 | `application/json` |
| 44 | Categories | `GET /api/admin/categories` | Admin | 200 | `application/json` |
| 45 | My stock checks | `GET /api/stock-check-reports/my` | Staff | 200 | `application/json` |

### 04 — Error handling (4)

| # | Request | Method + path | Role | Expected |
|---|---|---|---|---|
| 46 | Unknown PO | `GET /api/purchase-orders/999999` | Admin | 404 |
| 47 | Unknown batch | `GET /api/inventory/999999` | Admin | 404 |
| 48 | Submit return | `POST /api/returns` | Pharmacist | 403 |
| 49 | Empty assistant message | `POST /api/assistant/chat` | Admin | 200 (`intent = help`) |

## Demo flow for submission

1. Run **01** — shows `200` login for all four roles and the `401` / `400` failures. Point at the response body (`token`, `role`) and the **Tests** tab.
2. Run **02** — same endpoint, different role: `200` for admin, `403` for pharmacist/staff; prove admin is blocked from creating a PO (business rule) and supplier only sees `/my-orders`.
3. Run **03** — one route per module, including `text/csv` for the wastage export and `text/plain` for health.
4. Run **04** — `404` and method-level `403`.

Good screenshots: login 200 body, login 401, staff 403 on `/api/admin/users`, wastage CSV headers, runner summary `49 / 49`.

## Notes

- Demo password is `Password@123`; logins must use the matching role.
- Tokens are stored in environment variables (`adminToken`, …) after login, so later requests use `Bearer {{adminToken}}`. Re-run **01** if a token expires.
- Request 34 writes one small `PENDING` order per run. Skip it for read-only testing.
- Render free tier sleeps: the first request can take 30–60 s. If you see a timeout, raise **Settings → General → Request timeout** (e.g. 60000 ms) and retry.
- Postman shows the CSV body under **Raw**; **Pretty** does not format it.
- Optional CLI run (needs Node): `npx newman run docs/postman/MediStock-API.postman_collection.json -e docs/postman/MediStock-Production.postman_environment.json`
