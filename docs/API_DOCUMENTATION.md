# MediStock REST API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:8080/api/v1`  
**Authentication Scheme:** Bearer Token (JWT in `Authorization: Bearer <token>` header)

---

## 1. Authentication Endpoints (`/api/v1/auth`)

### 1.1 User Login
- **Method:** `POST /api/v1/auth/login`
- **Public Access**
- **Request Body:**
```json
{
  "email": "admin@medistock.com",
  "password": "Admin@MediStock2026!"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "48b6f3c4-...",
    "tokenType": "Bearer",
    "expiresIn": 86400000,
    "user": {
      "id": 1,
      "fullName": "System Administrator",
      "email": "admin@medistock.com",
      "role": "ADMIN",
      "status": "ACTIVE"
    }
  }
}
```

### 1.2 User Registration
- **Method:** `POST /api/v1/auth/register`
- **Public Access** (Role options: `PHARMACIST`, `STAFF`, `SUPPLIER`. `ADMIN` registration is protected)
- **Request Body (Staff / Pharmacist):**
```json
{
  "fullName": "Sarah Jenkins",
  "email": "sarah.pharmacist@hospital.org",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!",
  "phone": "+1-555-0192",
  "address": "Inpatient Pharmacy Wing 3",
  "role": "PHARMACIST"
}
```
- **Request Body (Supplier):**
```json
{
  "fullName": "David Vance",
  "email": "david@apexpharma.com",
  "password": "SecureVendorPassword123!",
  "confirmPassword": "SecureVendorPassword123!",
  "phone": "+1-555-0842",
  "address": "450 Pharma Way, Industrial Park",
  "role": "SUPPLIER",
  "companyName": "Apex Pharmaceuticals LLC",
  "contactPerson": "David Vance",
  "businessAddress": "450 Pharma Way, Industrial Park",
  "licenseNumber": "FDA-REG-88291-B"
}
```

### 1.3 Protected Initial Admin Setup
- **Method:** `POST /api/v1/auth/admin-setup`
- **Protected by Setup Key**
- **Request Body:**
```json
{
  "setupKey": "MediStockAdminSecretSetupKey2026!",
  "fullName": "Lead Hospital Director",
  "email": "director@hospital.org",
  "password": "DirectorRootPassword2026!",
  "phone": "+1-555-0100",
  "address": "Executive Administration Suite"
}
```

### 1.4 Password Reset Request
- **Method:** `POST /api/v1/auth/forgot-password`
- **Request Body:**
```json
{
  "email": "user@hospital.org"
}
```

### 1.5 Confirm Password Reset
- **Method:** `POST /api/v1/auth/reset-password`
- **Request Body:**
```json
{
  "token": "reset-uuid-token",
  "newPassword": "NewSecurePassword123!",
  "confirmPassword": "NewSecurePassword123!"
}
```

---

## 2. User Profile Endpoints (`/api/v1/profile`)

- `GET /api/v1/profile`: Retrieve profile information of the authenticated user.
- `PUT /api/v1/profile`: Update authenticated user profile (name, phone, address).
- `POST /api/v1/profile/change-password`: Update authenticated user password.

---

## 3. Administration Endpoints (`/api/v1/admin`) — `ADMIN` Role Required

- `GET /api/v1/admin/users`: List all registered accounts with role and status.
- `GET /api/v1/admin/users/{id}`: Get account details for a specific user ID.
- `POST /api/v1/admin/users`: Create an account directly with assigned role.
- `PATCH /api/v1/admin/users/{id}/status`: Activate, suspend, or update user account status.
- `DELETE /api/v1/admin/users/{id}`: Delete a user account (with audit recording).
- `PATCH /api/v1/admin/suppliers/{id}/status`: Approve, reject, or suspend a vendor.
- `GET /api/v1/admin/audit-logs`: Paginated regulatory audit trail of all actions.

---

## 4. Medicine Inventory (`/api/v1/medicines`)

- `GET /api/v1/medicines`: Paginated query with search filters (`search`, `categoryId`, `status`, `supplierId`, `page`, `size`).
- `GET /api/v1/medicines/{id}`: Retrieve single medicine by ID.
- `POST /api/v1/medicines`: Add new medicine (`ADMIN`, `PHARMACIST`).
- `PUT /api/v1/medicines/{id}`: Update medicine details (`ADMIN`, `PHARMACIST`).
- `DELETE /api/v1/medicines/{id}`: Remove medicine (`ADMIN`).
- `GET /api/v1/medicines/low-stock`: Retrieve medicines where `quantity <= reorderLevel`.
- `GET /api/v1/medicines/near-expiry`: Retrieve medicines expiring within N days (default 60).
- `GET /api/v1/medicines/expired`: Retrieve all medicines whose expiry date has passed.

---

## 5. Medicine Categories (`/api/v1/categories`)

- `GET /api/v1/categories`: Retrieve all categories with active medicine counts.
- `POST /api/v1/categories`: Create new category (`ADMIN`, `PHARMACIST`).
- `PUT /api/v1/categories/{id}`: Update category details.
- `DELETE /api/v1/categories/{id}`: Delete category (`ADMIN`).

---

## 6. Supplier Management (`/api/v1/suppliers`)

- `GET /api/v1/suppliers`: Paginated list of registered suppliers (`ADMIN`, `PHARMACIST`).
- `GET /api/v1/suppliers/me`: Retrieve current logged-in supplier profile (`SUPPLIER`).
- `GET /api/v1/suppliers/{id}/medicines`: Retrieve medicines sourced by supplier.
- `POST /api/v1/suppliers`: Register vendor.
- `PUT /api/v1/suppliers/{id}`: Update vendor details.
- `DELETE /api/v1/suppliers/{id}`: Remove vendor (`ADMIN`).

---

## 7. Purchase Orders (`/api/v1/purchase-orders`)

- `GET /api/v1/purchase-orders`: Paginated list of purchase orders. (Auto-filtered for `SUPPLIER` role).
- `GET /api/v1/purchase-orders/{id}`: Detailed line-item breakdown of order.
- `POST /api/v1/purchase-orders`: Create PO with items and pricing (`ADMIN`, `PHARMACIST`).
- `PATCH /api/v1/purchase-orders/{id}/status`: Transition status (`APPROVED`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
- `POST /api/v1/purchase-orders/{id}/receive`: Receive inventory shipment into warehouse with automatic stock-in movements (`ADMIN`, `PHARMACIST`, `STAFF`).

---

## 8. Stock Movements Ledger (`/api/v1/stock`)

- `GET /api/v1/stock/movements`: Paginated list of all audited movements.
- `POST /api/v1/stock/record`: Record a physical stock movement:
  - `STOCK_IN`: Inward shipment.
  - `STOCK_OUT`: Dispensing to patient / ward.
  - `ADJUSTMENT`: Discrepancy reconciliation.
  - `RETURN`: Returned medication.
  - `DISPOSAL`: Expired or damaged disposal.
- `GET /api/v1/stock/medicine/{id}`: Movement audit history for a single item.

---

## 9. Reports & Exports (`/api/v1/reports`)

- `GET /api/v1/reports/medicines/export?format=pdf|excel`: Export complete inventory.
- `GET /api/v1/reports/expiry/export?format=pdf|excel`: Export shelf-life risk report.
- `GET /api/v1/reports/purchase-orders/export?format=pdf|excel`: Export procurement history.
- `GET /api/v1/reports/movements/export?format=pdf|excel`: Export stock movement ledger.

---

## 10. Dashboards (`/api/v1/dashboard`)

- `GET /api/v1/dashboard/admin`: Real-time system-wide statistics for hospital administrators.
- `GET /api/v1/dashboard/pharmacist`: Inventory quantities, reorders, and movement metrics.
- `GET /api/v1/dashboard/staff`: Operational dispensing items, low stock alerts, and quick check.
- `GET /api/v1/dashboard/supplier`: Isolated order metrics, fulfillment requests, and supply catalog.

---

## 11. Notifications (`/api/v1/notifications`)

- `GET /api/v1/notifications`: List all user notifications.
- `GET /api/v1/notifications/unread`: Retrieve unread notification count and items.
- `PATCH /api/v1/notifications/{id}/read`: Mark notification as read.
- `POST /api/v1/notifications/read-all`: Mark all notifications as read.
- `DELETE /api/v1/notifications/{id}`: Delete notification.
