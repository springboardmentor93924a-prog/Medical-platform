# MediStock

Medicine inventory management for pharmacies — login, role-based dashboards,
stock tracking, expiry alerts, reports.

**Stack:** Spring Boot 3.5 (Java 21) · React 19 + Vite · Tailwind v4 · Recharts · MySQL/MariaDB · JWT

## Milestones

- ✅ **M1 — Login:** JWT auth, role check, dashboard redirect
  (ADMIN / PHARMACIST / STAFF / SUPPLIER)
- ✅ **M2 — Admin panel:** dashboard with charts, user CRUD, stock tracking,
  notifications, CSV reports, search, audit logs
- 📋 **Later:** billing, more roles & modules, token refresh, tests

## Modules status

| Module | Backend | UI |
|---|---|---|
| Auth (login/signup) | ✅ 401 on failure, 8h token | ✅ |
| Users | ✅ CRUD + search + paging | ✅ add/edit/disable/delete |
| Medicines | ✅ CRUD | ✅ view (CRUD via API) |
| Suppliers | ✅ CRUD | ✅ |
| Inventory | ✅ incl. DELETE | ✅ |
| Stock movements | ✅ (audit + low-stock alerts) | ✅ |
| Purchase orders | ✅ list/create/items/status (both paths) | ✅ |
| Expiry tracking | ✅ server flags + alerts | ✅ |
| Reports | ✅ 6 CSV exports, date filter, history | ✅ download + print |
| Notifications | ✅ scan endpoint + unread count | ✅ badge, filters, mark read |
| Search | ✅ `GET /api/search?q=` | ✅ dashboard search box |
| Audit logs | ✅ `audit_logs` table + filter API | ✅ Audit Logs page |
| Dashboard stats | ✅ `GET /api/admin/dashboard/stats` | ✅ KPIs + 7 charts |

## Dashboard (M2, live)

- KPI cards: stock value, batches/units, low stock, expiring ≤30d, medicines,
  pending orders, active users, expired
- Charts (Recharts, all from one `/api/admin/dashboard/stats` call):
  movements IN/OUT last 30d · stock-health donut · stock by category ·
  expiry timeline · monthly PO value · stock by supplier · users by role
- Global search box (medicines / batches / users)

## Run it

```bash
# DB — schema + demo seed (MySQL 5.5+ / MariaDB)
mysql -h <host> -u <user> -p <db> < database/schema.sql
mysql -h <host> -u <user> -p <db> < database/seed-demo.sql

# Backend (Java 21+, Maven)
cd backend
cp .env.example .env      # fill DB_*, JWT_SECRET
mvn spring-boot:run       # http://localhost:8080

# Frontend
cd frontend && npm install && npm run dev   # http://localhost:5173
```

Frontend API base URL: `VITE_API_URL` env at build time
(default `http://localhost:8080/api`).

## Demo accounts (password: `Password@123`)

`admin@medistock.local` · `pharmacist@medistock.local` ·
`staff@medistock.local` · `supplier@medistock.local`

## Hosting (planned)

- **Backend** → Render web service (Docker), env vars: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION_MS`, `CORS_ORIGINS`
- **Frontend** → Render static site, build `npm ci && npm run build`, publish `dist` (set `VITE_API_URL`)
- **DB** → hosted MySQL/MariaDB (free tier); move to OCI VPS MariaDB or bigger host when data grows (free tier = 5 MB)

## Team & workflow

- 5 collaborators, branch-per-person: `team3-Bhanu-Prakash`, `team3-Sampa`, …
- Base branch `main`; merge via PR after review
- **Never commit** `.env`, DB credentials, or `JWT_SECRET`
- Roadmap table above is the single source of truth for milestones

## Known gaps / deferred

- Free DB has no TLS + MySQL 5.5 — demo only, swap later
- No tests, no Maven wrapper yet
- Token: fixed 8h expiry (configurable) — no refresh tokens yet
- Stock movements list is loaded whole (client-side filter); server paging
  exists for users, audit logs and search only
- “Stock value trend” chart not built — needs historical snapshots table
- Service-layer/DTO cleanup is partial (users use DTOs; other reads still serialize entities)
- Frontend bundle >500 kB (Recharts) — code-split later
