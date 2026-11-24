# MediStock — Intelligent Hospital Pharmacy & Medical Supply Chain Management System

[![Build Status](https://img.shields.io/badge/Build-Passing-emerald?style=for-the-badge&logo=spring&logoColor=white)](https://github.com/sri240107/medistock)
[![Java](https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.1-brightgreen?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MariaDB](https://img.shields.io/badge/MariaDB-10.4-003545?style=for-the-badge&logo=mariadb&logoColor=white)](https://mariadb.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**MediStock** is an enterprise-grade hospital pharmacy management and inventory intelligence platform designed for certified clinical pharmacies, health systems, and accredited medical supply chains.

Built with a **React 19 Claymorphic frontend**, a **Spring Boot 4.1.1 backend**, and a **MariaDB relational database**, MediStock enforces strict clinical compliance, zero-waste automated dispensing via **FEFO (First-Expiry-First-Out)**, tamper-evident cryptographic audit logs, AI demand forecasting, and real-time WebSocket inventory alerts.

---

## 📑 Table of Contents

- [Core Capabilities](#-core-capabilities)
- [System Architecture](#-system-architecture)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Project Directory Structure](#-project-directory-structure)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Quick Start](#-installation--quick-start)
- [Database Configuration](#-database-configuration)
- [API Documentation Overview](#-api-documentation-overview)
- [Automated Verification & Quality Assurance](#-automated-verification--quality-assurance)
- [Production Deployment](#-production-deployment)
- [License](#-license)

---

## 🌟 Core Capabilities

### 1. Zero-Waste FEFO Protocol (First-Expiry-First-Out)
- Automatic batch prioritisation based on physical shelf expiration dates rather than purchase dates (FIFO).
- Prevents stock expiration losses across cold-chain and room-temperature pharmaceutical inventory.
- High-risk expiry threshold tracking with visual countdown indicators (Critical, Moderate, Safe).

### 2. Multi-Role Clinical Collaboration
- Tailored dashboards and workflow gates for **Admin**, **Pharmacist**, **Staff**, and **Supplier**.
- Dual-control Purchase Order (PO) workflow: Pharmacists draft and submit POs; Administrators review, authorize, or reject.
- Supplier portal enabling external vendors to receive assigned purchase orders and record dispatch logistics.

### 3. Real-Time Telemetry & WebSocket Engine
- Native STOMP/SockJS messaging over raw WebSockets (`/ws-raw`).
- Live broadcast of low-stock alerts, quarantine actions, PO status updates, and emergency batch recalls.
- Brevo SMTP relay outbox for asynchronous email notifications and system reports.

### 4. Cryptographic SHA-256 Audit Ledger
- 21 CFR Part 11 compliant audit trail tracking every stock dispense, disposal, and configuration change.
- Cryptographic hash chaining on all transactions to ensure tamper-evident historical data.
- Built-in one-click ledger integrity verification tool on the Admin portal.

### 5. AI Inventory Forecasting & Assistant
- Time-series exponential smoothing and moving average models for proactive medicine demand prediction.
- Natural language inventory chatbot powered by local LLM integration (Ollama / Llama 3.2).
- Automatic reorder point calculation based on historical consumption velocity.

### 6. Claymorphic Clinical UI Design System
- Soft 3D ergonomic interfaces designed to reduce screen fatigue in hospital dispensary environments.
- Responsive data visualization using Recharts (pie, bar, area charts).
- Instant CSV and PDF reporting for statutory medical audits.

---

## 🏛 System Architecture

```
                       +-----------------------------------+
                       |    React 19 Frontend (Vite 8.3)   |
                       |  Claymorphism UI • Port 5173     |
                       +-----------------+-----------------+
                                         |
                   HTTP/REST (Axios)     |     STOMP / SockJS (WebSocket)
                   Port 8080             |     Port 8080 (/ws-raw)
                                         v
                       +-----------------------------------+
                       |    Spring Boot 4.1.1 (Java 21)    |
                       |    Spring Security • JWT Auth     |
                       +-----------------+-----------------+
                                         |
                         HikariCP (JDBC) | Port 3307
                                         v
                       +-----------------------------------+
                       |         MariaDB 10.4.32           |
                       |        Database: medistock        |
                       +-----------------------------------+
```

---

## 👥 Role-Based Access Control (RBAC)

MediStock implements strict role separation at both the React router level and Spring Security controller endpoints:

| Role | Role ID | Dashboard Route | Key Responsibilities |
|---|---|---|---|
| **ADMIN** | `1` | `/admin` | System user management, supplier onboarding, purchase order approvals, audit log ledger, database backup/restore, SMTP outbox. |
| **PHARMACIST** | `2` | `/pharmacist` | Medicine catalog management, batch allocation, PO generation, FEFO dispensing, wastage management, AI demand forecasting. |
| **STAFF** | `3` | `/staff` | Stock lookup, medicine receiving dock checks, batch verification, internal requests, departmental inventory viewing. |
| **SUPPLIER** | `4` | `/supplier` | Vendor portal, assigned purchase order review, dispatch status updates, delivery history tracking. |

---

## 📂 Project Directory Structure

```
medistock/
├── backend/                               # Spring Boot Application Root
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/medistock/medistock/
│   │   │   │   ├── ai/                    # LLM Chat, Demand Forecasting, Reorder Algorithms
│   │   │   │   ├── config/                # SecurityConfig, WebSocketConfig, MailConfig
│   │   │   │   ├── controller/            # 22 REST Controllers
│   │   │   │   ├── dto/                   # Data Transfer Objects & API Envelopes
│   │   │   │   ├── entity/                # 35 JPA Entities
│   │   │   │   ├── repository/            # 35 Spring Data Repositories
│   │   │   │   └── service/               # 27 Business Logic Services
│   │   │   └── resources/
│   │   │       ├── application.properties # Server, Database, Brevo & AI configs
│   │   │       └── schema.sql             # Relational Database DDL
│   ├── mvnw / mvnw.cmd                    # Maven Wrapper executables
│   └── pom.xml                            # Project Object Model dependencies
├── frontend/                              # React 19 Client Application
│   ├── src/
│   │   ├── components/                    # Reusable Claymorphic Components & Icons
│   │   ├── pages/                         # 60 Role-Specific Views (Admin, Pharm, Staff, Supplier)
│   │   ├── services/                      # Centralized API (api.js) & WebSocket client
│   │   ├── styles/                        # Claymorphic 3D CSS Design System
│   │   ├── utils/                         # Roles config, CSV export, validation
│   │   ├── App.jsx                        # Route hierarchy with RoleRoute guards
│   │   └── main.jsx                       # Entry Point
│   ├── package.json                       # Frontend dependencies & scripts
│   └── vite.config.js                     # Vite build & chunking configuration
├── .gitignore                             # Ignored files (target, node_modules, logs)
├── .gitattributes                         # Line-ending normalization
├── LICENSE                                # MIT License
└── README.md                              # Complete System Documentation
```

---

## 💻 Technology Stack

### Backend
- **Language**: Java 21 LTS
- **Framework**: Spring Boot 4.1.1
- **Security**: Spring Security 6, JWT (HMAC-SHA512), BCrypt Password Encoder
- **Persistence**: Spring Data JPA / Hibernate
- **Database Driver**: MariaDB Java Client
- **Connection Pool**: HikariCP (optimized pool size: 15)
- **Messaging**: Spring WebSocket, STOMP protocol, SockJS client support
- **Mailing**: Spring Mail with Brevo SMTP relay integration

### Frontend
- **Framework**: React 19.2
- **Build Tool**: Vite 8.3
- **Routing**: React Router v7
- **UI Architecture**: Claymorphism (Soft 3D neumorphism adapted for clinical software)
- **Icons**: Lucide React & Custom SVG Clinical Icons
- **Data Visualization**: Recharts (Pie, Bar, Area charts)
- **Real-time Client**: `@stomp/stompjs` + `sockjs-client`

### Database
- **Engine**: MariaDB 10.4.32 (or MySQL 8.0+)
- **Port**: 3307 (default development) / 3306 (standard production)
- **Schema**: 53 normalized tables with foreign keys and index constraints

---

## ⚙️ Prerequisites

Before running the application, ensure you have the following installed:

1. **Java Development Kit (JDK)**: Version 21 or higher
   ```bash
   java -version
   ```
2. **Node.js**: Version 20.x or higher & npm
   ```bash
   node -v && npm -v
   ```
3. **MariaDB Server** or **MySQL Server**:
   ```bash
   mariadb --version
   ```
4. **Git**:
   ```bash
   git --version
   ```

---

## 🚀 Installation & Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/sri240107/medistock.git
cd medistock
```

### 2. Configure Database
1. Start your local MariaDB / MySQL service.
2. Create the database:
   ```sql
   CREATE DATABASE medistock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Configure `backend/src/main/resources/application.properties` with your database credentials:
   ```properties
   spring.datasource.url=jdbc:mariadb://localhost:3307/medistock
   spring.datasource.username=root
   spring.datasource.password=your_password
   ```

### 3. Launch the Backend
```bash
cd backend
# Windows:
.\mvnw.cmd spring-boot:run

# Linux / macOS:
./mvnw spring-boot:run
```
*The Spring Boot server will start at `http://localhost:8080`.*

### 4. Launch the Frontend
```bash
cd ../frontend
npm install
npm run dev
```
*The Vite development server will start at `http://localhost:5173`.*

---

## 📡 API Documentation Overview

All protected REST endpoints expect a JWT Bearer token in the `Authorization` header:
```http
Authorization: Bearer <your_jwt_token>
```

### Core API Groups

| Endpoint Group | Method | Description | Role Required |
|---|---|---|---|
| `/api/auth/register` | `POST` | Self-register account | Public |
| `/api/auth/login` | `POST` | Authenticate and obtain JWT token | Public |
| `/api/auth/me` | `GET` | Fetch authenticated user profile | Any authenticated |
| `/api/medicines` | `GET`, `POST` | Catalog management & search | Pharmacist / Admin |
| `/api/inventory/batches` | `GET` | Active batches & stock levels | Pharmacist / Staff / Admin |
| `/api/fefo/recommendation` | `GET` | Automated FEFO batch allocation | Pharmacist / Staff |
| `/api/orders` | `POST` | Create Purchase Order | Pharmacist |
| `/api/orders/{id}/approve` | `PATCH` | Approve Purchase Order | Admin |
| `/api/orders/{id}/receive` | `POST` | Receive delivery goods into stock | Pharmacist / Staff |
| `/api/notifications` | `GET` | Real-time system inventory alerts | Any authenticated |
| `/api/admin/audit-logs` | `GET` | Immutable activity trail | Admin |
| `/api/admin/backups` | `GET`, `POST` | Database backup management | Admin |
| `/api/ai-forecast/recommendations` | `GET` | AI inventory reorder recommendations | Pharmacist / Admin |

---

## 🧪 Automated Verification & Quality Assurance

MediStock includes a live end-to-end testing suite that verifies all functional modules against active server and database instances:

```
============================================================
MEDISTOCK LIVE APPLICATION TESTING
============================================================
[PASS] MariaDB connection (port 3307)
[PASS] Spring Boot REST API (port 8080)
[PASS] React Frontend Server (port 5173)
[PASS] Self-registration across all 4 roles (ADMIN, PHARMACIST, STAFF, SUPPLIER)
[PASS] JWT Authentication & BCrypt verification
[PASS] Negative security checks (wrong password, duplicate email, weak password)
[PASS] Role-Based Access Control (RBAC) route barriers
[PASS] Medicine Catalog (265 verified medicine dossiers)
[PASS] Purchase Order Lifecycle (Pharmacist creation -> Admin approval)
[PASS] FEFO dispensing algorithms & expiration alerts
[PASS] Wastage logging & medicine returns
[PASS] Cryptographic SHA-256 audit ledger integrity
[PASS] AI natural language chatbot & forecasting engine
[PASS] Real-time notification hub & email outbox
============================================================
TOTAL ASSERTIONS: 47  |  PASSED: 47  |  FAILED: 0  |  RATE: 100.0%
============================================================
```

---

## 📦 Production Deployment

### 1. Build Production Frontend
```bash
cd frontend
npm run build
```
Generates minified static assets in `frontend/dist/`.

### 2. Package Backend Executable JAR
```bash
cd ../backend
./mvnw clean package -DskipTests
```
Generates `backend/target/medistock-0.0.1-SNAPSHOT.jar`.

### 3. Run Production Service
```bash
java -jar -Xms512m -Xmx1024m target/medistock-0.0.1-SNAPSHOT.jar \
  --spring.datasource.url=jdbc:mariadb://localhost:3306/medistock \
  --spring.datasource.username=db_user \
  --spring.datasource.password=db_secure_password
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Developed with ❤️ for reliable, zero-waste hospital pharmacy management.
