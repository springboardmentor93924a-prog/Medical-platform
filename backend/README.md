# MediStock backend (Spring Boot + MySQL)

REST API for the MediStock medical inventory platform: login with JWT and roles (Admin, Pharmacist, Staff, Supplier),
medicines and batches, suppliers, purchase orders with approval, returns, wastage, stock counts, alerts, reports,
audit logs, settings, notifications, backup and restore.

## You need
- JDK 21 or newer
- MySQL 8 (with MySQL Workbench, or any MySQL client)
- IntelliJ IDEA, or any editor plus the Maven wrapper included here

## Set up (about 10 minutes)

### 1. Create an empty database
```sql
CREATE DATABASE medistock CHARACTER SET utf8mb4;
```
No SQL script is needed. The tables are created automatically the first time the app starts.

### 2. Create your private settings file
In `src/main/resources`, copy `application-local.properties.example` to `application-local.properties`
and fill in your own values. This file is git-ignored, so your passwords stay on your computer.

Generate a JWT secret:
- Windows PowerShell:
  ```powershell
  $b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
  ```
- Git Bash, Mac or Linux: `openssl rand -base64 48`

### 3. Run it
- IntelliJ: open this folder, wait for Maven to finish, run the main application class.
- Or in a terminal: `./mvnw spring-boot:run` (Windows: `mvnw.cmd spring-boot:run`)

It is ready when the console shows `Started ...Application` and `Created initial admin user`. The API runs on http://localhost:8080.

### 4. Run the frontend
See the frontend repository. It talks to this API on port 8080 and the browser app runs on http://localhost:5173.

## Good to know
- Sign in with the Admin account from your settings file. Other users can sign up on the login page (Staff, Pharmacist or Supplier) and the Admin manages them under User Management.
- A Supplier login must be linked to a supplier company by the Admin (User Management).
- Without mail settings, password reset links are printed in the console. Without SMS settings, text messages are printed in the console.
- Backups are written to a `backups` folder next to where the app runs. They contain password hashes, so never commit them.

## Never commit
`application-local.properties`, the `backups` folder, passwords, API keys, tokens.
