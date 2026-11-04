# Sampa — Role Modules Contribution Log

Branch: `team3-Sampa` (merged into `Team-3-Jagdish` on 2026-11-04)

## Pharmacist module (`frontend/src/pages/pharmacist/`)

- Dashboard overview with inventory KPIs, low stock and expiry cards
- Medicines, Categories, Stock Monitoring, Expiry Tracking
- Purchase Orders — creates orders and tracks status
- Suppliers, Inventory Reports, Notifications, My Profile

## Staff module (`frontend/src/pages/staff/`)

- Dashboard overview with daily tasks and alerts
- View Medicines, Search Medicines (name / category / batch / status)
- Stock Checking — physical count, submits a discrepancy report for review
- Receive Medicines — verifies delivered quantity per order item
- Expiry Checking, Notifications, My Profile

## Supplier module (`frontend/src/pages/suppliers/`)

- Dashboard with order counts and status breakdown
- My Purchase Orders (inline list, `GET /api/purchase-orders/my-orders`)
- Notifications, Profile with image upload

## Backend

- `PharmacistController` / `PharmacistService` — dashboard summary, dispense, stock adjustment
- `SupplierProfileController` — supplier self-service profile, medicines, order history
- `StockMovementController` / `StockMovementService` — movement history (`stock_movements` table)
- `StockCheckReportController` / `StockCheckReportService` — staff submits, admin/pharmacist reviews
- `ProfileController` — view/update own profile (phone, picture)
- `SystemMonitoringController` — activity feed backed by `audit_logs`
- File upload config (`FileResourceConfig`, `WebConfig`), expanded `SecurityConfig`
- Entities: `StockMovement`, `StockCheckReport`, `SystemMonitoring`; DTOs and repositories for the above

## Fixed after merge (reviewed by Jagdish)

- Added missing DDL (`database/migrations/001-role-modules.sql`, `schema.sql`)
- Pointed `SystemMonitoring` at the existing `audit_logs` table instead of a table that did not exist
- Purchase order creation restricted to PHARMACIST; admin approve/reject added
- Removed dead files (`StaffLayout.jsx`, orphan `SupplierOrders.jsx`, empty `supplierService.js`)
- Restored `backend/.env.example`, `.gitignore` for uploads, this log split from `JAGDISH_CONTRIBUTION.md`
