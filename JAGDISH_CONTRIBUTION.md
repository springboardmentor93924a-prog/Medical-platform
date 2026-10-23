# Jagdish — Contribution Log

## 2026-10-22 (today)

### Code fixes (minimal, to make it build & run)
- Added missing `findAllByOrderByOrderDateDesc()` in `PurchaseOrderRepository`
  → backend now compiles (was a hard build failure)
- Wired `AdminDashboard.jsx`: connected all admin modules
  (Inventory, Suppliers, PurchaseOrders, StockMovements, ExpiryTracking,
  Reports, Notifications) + added "Stock Movements" menu item
  → before this, only "Users" page was reachable
- Installed missing `lucide-react` dependency → `npm run build` passes

### Database
- Wrote `database/schema.sql` — all 11 tables, utf8mb4, InnoDB, FKs,
  indexes (MySQL 5.5+ / MariaDB compatible)
- Wrote `database/seed-demo.sql` — 4 roles, 4 demo users, 8 medicines,
  3 suppliers, 8 inventory batches (incl. expired / expiring / low-stock),
  1 purchase order + items, 5 stock logs — idempotent re-runnable
- Created both on the hosted free MySQL DB (`sql12.freesqldatabase.com`)
  → ~0.44 MB used of 5 MB

### Backend config
- `application.properties` → env-driven: `DB_URL`, `DB_USERNAME`,
  `DB_PASSWORD`, `JWT_SECRET` (no secrets in repo)
- Added `backend/.env` (git-ignored) + `backend/.env.example`

### Verified end-to-end (local run against hosted DB)
- `POST /api/auth/login` → JWT issued, role returned
- `GET /api/admin/users` → 4 seeded users
- `GET /api/admin/medicines` → 8 rows · `GET /api/inventory` → 8 rows
- Guards: no token → 403 · wrong role → 403 · wrong password → 403
- Tested drivers: Connector/J 9.4 (Boot default) works against the free DB

### Docs
- Rewrote root `README.md` (status tables, M2 roadmap, run steps)
- Added Javadoc-style one-liners plan — to be done incrementally per module

### Raised but NOT fixed (needs team decision)
- Purchase Orders path mismatch — ✅ FIXED (controller now serves both
  `/api/purchase-orders` and `/api/admin/purchase-orders`)
- Inventory has no DELETE endpoint — ✅ FIXED (+400 if batch has movement history)
- Failed logins return 403, should be 401 — ✅ FIXED (401 with JSON body;
  role mismatch now clean 403 via access-denied handler)
- Tailwind not installed → new admin pages unstyled — ✅ FIXED (Tailwind v4 via `@tailwindcss/vite`)
- Signup broken: `RegisterRequest` missing `setRole` — ✅ FIXED
- Free DB: no TLS, MySQL 5.5 — still true (demo only, swap later)

---

## 2026-10-22 (later) — M2 implementation

Everything in the README's M2 roadmap was implemented, tested and documented.

### Backend — new
- **Audit logs:** `AuditLog` entity + `audit_logs` table (created on hosted DB),
  `AuditService` wired into users/inventory/stock-movements/suppliers/medicines/
  purchase-orders/auth/reports, filterable paged API
  `GET /api/admin/audit-logs?action=&q=&page=&size=`
- **Notifications:** `NotificationService` scans low stock, expired,
  expiring ≤30d and pending POs (de-duped, unread-only), endpoints:
  `GET /api/notifications`, `/unread-count`, `POST /refresh|/{id}/read|/read-all`,
  auto low-stock alert after every OUT movement
- **Reports:** `GET /api/reports/{type}.csv` for stock, expiry, low-stock,
  movements, orders, users — date `from`/`to` on movements & orders,
  each export recorded in `reports` table + audit
- **Search:** `GET /api/search?q=` across medicines, inventory batches and
  users (user results admin-only)
- **Dashboard stats:** `GET /api/admin/dashboard/stats` → KPIs, 30-day
  IN/OUT series, health buckets, category/supplier rollups, expiry timeline,
  6-month PO value, role distribution (computed in Java — no MySQL-8 SQL used)
- **Users CRUD:** `POST/GET/PUT/DELETE /api/admin/users` + `PATCH /{id}/status`,
  pagination + search, last-admin deactivation/delete guard, password rules
- **Medicines CRUD:** `POST/PUT/DELETE /api/admin/medicines` (blocked while
  inventory batches exist)
- **Purchase orders:** `POST /api/purchase-orders` (uses existing service),
  `GET /{id}`, `PATCH /{id}/status` (PENDING/APPROVED/RECEIVED/CANCELLED),
  path alias for the UI's `/api/admin/purchase-orders`
- **Auth hardening:** `GlobalExceptionHandler` (stable `{"message":...}` +
  right status), configurable JWT expiry (`jwt.expiration-ms`, default 8h),
  CORS origins from `CORS_ORIGINS`, security `accessDeniedHandler` so
  authenticated-but-wrong-role returns 403 (not 401), audit rows for
  LOGIN/REGISTER

### Frontend
- `services/api.js` — `API_BASE` from `VITE_API_URL` (Render-ready), shared
  auth headers, error parsing, CSV `downloadFile()`; all 12 pages switched
  off hardcoded `localhost:8080`
- Tailwind v4 + Recharts installed and wired (vite plugin, `@import "tailwindcss"`)
- **Dashboard:** KPI cards + 7 charts + global search box
  (`admin/DashboardHome.jsx`)
- **Users:** full CRUD UI with modal forms, search, server pagination
- **Notifications:** rewritten on real endpoints — unread badge, type filters,
  “Scan for alerts”, mark read / mark all read
- **Audit Logs:** new page — paged table, action filter, search
- **Reports:** CSV download card (type select + date range) next to print

### Verified
- Backend: `mvn -B -DskipTests package` → BUILD SUCCESS
- Smoke suite against hosted DB: **38/39 PASS** (single “fail” was a
  re-run duplicate email, not a defect) — covers 401/403 guards, users CRUD,
  inventory create/delete/blocked-delete, PO create/status/alias,
  notification scan/dedupe, audit filters, search, dashboard stats +
  all chart series lengths, all 6 CSVs, medicine CRUD
- Frontend: `npm run build` ✅ · `npm run lint` → 0 errors (27 pre-existing
  warnings in old files)
- Live JSON field names checked one-by-one against what each new page reads

### Docs
- README rewritten: M2 marked done, module table updated, dashboard section,
  `VITE_API_URL`/`JWT_EXPIRATION_MS` noted, gaps list refreshed
- `backend/README.md` added — config table, run/build steps, auth model,
  conventions, deploy notes, gotchas
- `backend/API.md` added — all ~30 endpoints with roles matrix, request/response
  examples, CSV column lists, dashboard response shape, status codes
- This file updated with the M2 section above

### Notes for the team
- UI not yet eyeballed in a browser (API + build verified) — run
  `npm run dev` and click through Dashboard / Users / Notifications / Audit Logs
- Not committed — everything is in the working tree, review before pushing
- Deferred on purpose: token refresh, movements server-paging,
  stock-value-trend chart (needs history table), full DTO/service refactor
