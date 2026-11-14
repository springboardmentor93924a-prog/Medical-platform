# MediStock — Medical Inventory Intelligence Platform

[![Java](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://adoptium.net)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

> A full-stack medical inventory and supplier intelligence platform for hospitals, pharmacies, clinics, and healthcare distribution networks.

---

## 1. Features & Role-Based Access Control

MediStock implements 4 security roles with dedicated user interfaces and database isolation:

### 🛡️ System Administrator (`ADMIN`)
- **System Administration:** Manage user accounts, role allocations, account activations, and suspensions.
- **Supplier Governance:** Approve, reject, or suspend supplier registrations and review supplier catalogs.
- **Full Inventory Control:** Add, update, monitor, and delete medicines, batches, and categories.
- **Regulatory Audit Trail:** Real-time log of every database write, user login, and stock transaction.
- **Wastage & Loss Management:** Review, approve, and track spoiled, damaged, or expired stock with automatic inventory reconciliation.
- **FEFO Monitoring:** Enforce First-Expired, First-Out dispensing and track regulatory override audits.
- **Backup & Disaster Recovery:** Create, download, and restore encrypted JSON database snapshots with SHA-256 integrity verification, plus automatic nightly backups.
- **In-App Notification Center:** Real-time role-based notifications for inventory alerts, purchase orders, expiry warnings, and system events.
- **Feedback & Inquiries:** Respond to user queries, support requests, and feature feedback.
- **Reporting & Export:** Generate and download PDF and Microsoft Excel reports.

### 💊 Pharmacist (`PHARMACIST`)
- **Medicine Inventory:** Manage stock batches, pricing, reorder levels, and categories.
- **Procurement:** Draft and issue purchase orders to approved suppliers.
- **Stock Movements:** Record inflows, patient dispensing, returns, and disposals with proper SKU and movement types.
- **Expiry Intelligence & FEFO:** Proactive notifications for medicines expiring within threshold, with FEFO dispensing guidance.
- **Wastage & Loss Reporting:** Report expired or contaminated batches directly for administrative write-off.
- **Reporting & Feedback:** Export inventory reports and submit feedback or operational inquiries.

### 🏥 Hospital Staff (`STAFF`)
- **Quick Medicine Check:** Search medicines by name, SKU, or generic composition.
- **Operational Dispensing:** Record permitted stock dispensing (`STOCK_OUT`) and returns.
- **Safety Checks:** Automatic blocking of expired medications from patient dispensing.
- **Receipts:** Verify and receive inbound purchase order shipments.
- **Wastage Reporting:** Submit reports for damaged or mishandled medications.
- **FEFO Assistance:** Consult optimal batch selection before dispensing.

### 🚚 Pharmaceutical Supplier (`SUPPLIER`)
- **My Supplied Medicines:** View comprehensive portfolio of medicines supplied by the organization, including Medicine Name, Category, Manufacturer, Batch Number, Available Quantity, Unit Price, Manufacturing Date, Expiry Date, and Medicine Status, with real-time search and category/status filtering.
- **Vendor Portal:** View purchase orders assigned to the supplier company with complete order lifecycle tracking.
- **Order Acceptance & Fulfillment:** Accept or reject purchase orders with mandatory reason modal, update statuses to `SHIPPED` and `DELIVERED`.
- **Supplier Business Profile:** View and edit company contact details, address, drug license, and inspect supplied medicine catalog.
- **Strict Data Isolation:** Suppliers can only view their own orders and products.
- **Supplier Registration:** Direct portal registration with automatic account activation and linking.

---

## 2. Technology Stack

- **Backend:** Java 21 LTS, Spring Boot 3.3.5, Spring Security, Spring Data JPA, Hibernate, JJWT 0.12.6, OpenPDF 2.0.3, Apache POI 5.3.0, JUnit 5, Mockito.
- **Frontend:** JavaScript (React 18), Vite, React Router v6, Axios, Tailwind CSS, Lucide React, Framer Motion, Chart.js. *(Strictly pure JavaScript — NO TypeScript)*.
- **Database:** MySQL / MariaDB (Local Development / XAMPP) & PostgreSQL (Production).
- **DevOps & Containers:** Docker, Docker Compose, Nginx.

---

## 3. Getting Started & Local Setup

### Prerequisites
1. **Java Development Kit (JDK 21 LTS):** Ensure `java -version` returns Java 21.
2. **Node.js (v18+ or v20+):** Ensure `node -v` and `npm -v` are accessible.
3. **Maven (3.8+):** Included as Maven Wrapper (`./mvnw` or `mvnw.cmd`).
4. **Database:** MySQL / MariaDB (e.g. XAMPP) running on `localhost:3306`.

---

### Step 1: Database Setup (MySQL)
Open your MySQL client or phpMyAdmin and execute:
```sql
CREATE DATABASE IF NOT EXISTS medistock_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
*(The schema DDL is located at `database/schema.sql` if you wish to inspect the table structure).*

---

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```
Default configuration values for local development:
```properties
SPRING_PROFILES_ACTIVE=dev
DB_HOST=localhost
DB_PORT=3306
DB_NAME=medistock_db
DB_USER=root
DB_PASSWORD=
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
ADMIN_BOOTSTRAP_ENABLED=true
ADMIN_BOOTSTRAP_EMAIL=admin@medistock.com
ADMIN_BOOTSTRAP_PASSWORD=Admin@MediStock2026!
ADMIN_SETUP_KEY=MediStockAdminSecretSetupKey2026!
```

---

### Step 3: Run the Spring Boot Backend (Windows PowerShell)

Open a PowerShell terminal in the `backend/` directory:
```powershell
cd backend
.\mvnw.cmd clean spring-boot:run
```
*(Or use packaged jar)*:
```powershell
java -jar target/medistock-backend-1.0.0.jar --spring.profiles.active=dev
```
The backend will initialize the database, bootstrap the initial administrator account, and listen on **`http://localhost:8080`**.

---

### Step 4: Run the React Frontend (Windows PowerShell)

Open a second PowerShell terminal in the `frontend/` directory:
```powershell
cd frontend
npm install
npm run dev
```
The React development server will start and be available at **`http://localhost:5173`**.

---

## 4. Default Bootstrap Credentials

When first launched with `ADMIN_BOOTSTRAP_ENABLED=true`, MediStock provisions a secure administrator account if no admin accounts exist:

- **Email:** `admin@medistock.com`
- **Password:** `Admin@MediStock2026!`
- **Role:** `ADMIN`

Additional administrators can only be created via the protected Admin Setup endpoint (`/api/v1/auth/admin-setup`) using the secret setup key:
- **Admin Setup Key:** `MediStockAdminSecretSetupKey2026!`

---

## 5. Running with Docker Compose

To start the entire platform with containerized MySQL, backend, and frontend:
```bash
docker compose up -d --build
```
- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:8080`
- MySQL Database: `localhost:3306`

To run with PostgreSQL (Production profile):
```bash
docker compose --profile prod up -d --build
```

---

## 6. Running Automated Tests

### Backend Unit & Integration Tests (JUnit 5 & Mockito)
```powershell
cd backend
.\mvnw.cmd test
```
*(Passes 28 automated test suites covering Spring Boot full application context, root & public status endpoints, authentication, JWT issuance, password reset security, medicine inventory, purchase orders, supplier data isolation, FEFO recommendations, wastage write-offs, and dedicated backup snapshots).*

### Frontend Production Build Verification
```powershell
cd frontend
npm run build
```
*(Verifies 100% clean production build of React JavaScript SPA with zero errors).*

---

## 7. Project Documentation

- **[REST API Documentation](docs/API_DOCUMENTATION.md):** Complete catalog of endpoints, payload structures, and response schemas.
- **[Architecture & Data Model](docs/ARCHITECTURE.md):** Architectural diagrams, ER diagram, and security isolation design.
- **[Database Schema](database/schema.sql):** SQL DDL definitions for all entities.
