# MediStock — backend

Spring Boot REST API for the MediStock pharmacy inventory app.

- **Spring Boot 3.5.5**, Java 21, Maven
- Spring Web · Spring Data JPA · Spring Security + JWT (jjwt)
- MySQL / MariaDB (`mysql-connector-j`)
- Stateless auth; JWT subject = email, role re-read from DB on every request

Full endpoint reference: [`API.md`](API.md)

## Layout

```
src/main/java/com/medistock/
├── config/        SecurityConfig (roles, CORS, 401/403 JSON), GlobalExceptionHandler
├── controller/    one per module: auth, users, medicines, suppliers, inventory,
│                  stock movements, purchase orders, notifications, reports,
│                  search, dashboard, audit logs, health
├── dto/           request/response records (login, register, PO, movement, stats)
├── entity/        JPA mappings for 12 tables
├── repository/    Spring Data interfaces (+ JPQL search queries)
├── security/      JwtService, JwtAuthenticationFilter
└── service/       AuthService, AuditService, NotificationService,
                   StockMovementService, PurchaseOrderService
src/main/resources/application.properties
```

## Configuration

Everything comes from environment variables — no credentials in the repo.
Locally they are read from `backend/.env`
(`spring.config.import=optional:file:./.env[.properties]`, so **run from `backend/`**).

| Variable | Required | Default | Notes |
|---|---|---|---|
| `DB_URL` | yes | — | `jdbc:mysql://host:3306/db?sslMode=DISABLED&connectTimeout=15000&socketTimeout=30000` |
| `DB_USERNAME` | yes | — | |
| `DB_PASSWORD` | yes | — | |
| `JWT_SECRET` | yes | — | base64, ≥ 32 random bytes (`openssl rand -base64 32`) |
| `JWT_EXPIRATION_MS` | no | `28800000` (8 h) | token lifetime |
| `CORS_ORIGINS` | no | `http://localhost:5173` | comma-separated allowed origins |
| `SERVER_PORT` | no | `8080` | via `server.port` |

Other notable settings: `spring.jpa.hibernate.ddl-auto=none` (schema is managed
by SQL, not Hibernate), `open-in-view=false`, Hikari pool 5 (free DB limit),
`server.error.include-message=always`.

## Run

```bash
# 1) schema + demo data (once)
mysql -h <host> -u <user> -p <db> < ../database/schema.sql
mysql -h <host> -u <user> -p <db> < ../database/seed-demo.sql

# 2) env file
cp .env.example .env        # fill DB_*, JWT_SECRET

# 3) start
mvn spring-boot:run         # http://localhost:8080/api/health
```

Package and run the jar:

```bash
mvn -B -DskipTests package
java -Xmx350m -jar target/medistock-backend-0.0.1-SNAPSHOT.jar   # from backend/, for .env
```

Demo accounts (password `Password@123`): `admin@`, `pharmacist@`, `staff@`,
`supplier@medistock.local`.

## Auth model

1. `POST /api/auth/login` with email + password + selected role → JWT.
2. Client sends `Authorization: Bearer <token>`.
3. `JwtAuthenticationFilter` validates the token, then loads the user to get the
   current role and active flag — deactivating an account invalidates it on the
   next request.
4. Authorization is enforced twice: URL rules in `SecurityConfig` and
   `@PreAuthorize` on controllers (URL rules win; `/api/admin/**` is ADMIN-only).
5. 401 = not authenticated, 403 = wrong role. Both return `{"message":"..."}`.

## Error handling

`GlobalExceptionHandler` turns `ResponseStatusException` and validation failures
into `{"message":"..."}` with the right status. Controllers use
`ResponseStatusException` for business-rule failures (duplicate email, last-admin
guard, deleting a batch with movement history, etc.).

## Conventions

- Audit: every mutating action writes to `audit_logs` via `AuditService`
  (`record(action, entityType, entityId, summary[, performedBy])`).
- Low stock: a batch is low when `quantity <= minimumStock`; an OUT movement
  below that threshold raises a `LOW_STOCK` notification.
- Expiry: expired = `expiryDate < today`, expiring soon = within 30 days.
- Aggregations for the dashboard are computed in Java, so the SQL stays
  MySQL 5.5-compatible (no window functions, no CTEs).

## Tests

No automated tests yet (`spring-boot-starter-test` is on the classpath). The M2
feature set was verified with a PowerShell smoke suite covering auth, CRUD,
notifications, reports, search, dashboard and audit (38/39 checks against the
hosted DB).

## Deploy notes

- Target: Render web service from a Docker image (multi-stage Maven build →
  JRE 21, `-Xmx350m`). Set the env vars from the table above.
- Free hosted DB is MySQL 5.5 with a 5 MB cap and no TLS — demo only.
- If you add a reverse proxy or new frontend origin, update `CORS_ORIGINS`.

## Gotchas

- `.env` is resolved relative to the **working directory**; always start the app
  from `backend/` (or export the variables yourself).
- `JWT_SECRET` is base64-decoded — a plain string will fail at startup.
- Use `response.setStatus(...)` + write JSON for 401/403 (as `SecurityConfig`
  does). `sendError()` triggers an ERROR dispatch that loses the
  request-scoped `SecurityContext` and downgrades 403 to 401.
- `ddl-auto=none`: new entities need matching SQL in `database/schema.sql`
  (e.g. `audit_logs`).
