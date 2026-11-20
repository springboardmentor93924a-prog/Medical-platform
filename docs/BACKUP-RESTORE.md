# Backup & restore

Admin-only database backup and restore for MediStock.

The feature lives in the UI at **System Monitoring → Backup & Restore tab**
(`frontend/src/pages/admin/BackupRestore.jsx`) and is backed by
`DatabaseBackupController` + `backup/DatabaseBackupService`.

---

## 1. What it does

| Action | Endpoint | Result |
|---|---|---|
| Create | `POST /api/admin/database-backups` | writes `medistock_backup_YYYYMMDD_HHMMSS.zip` |
| List | `GET /api/admin/database-backups` | `[{filename, size, createdAt}]`, newest first |
| Download | `GET /api/admin/database-backups/{filename}/download` | `application/zip` |
| Restore | `POST /api/admin/database-backups/restore` | replaces table data from an uploaded ZIP |

All four routes are under `/api/admin/**`, so only **ADMIN** can call them.
Every restore also triggers a safety backup before touching data.

---

## 2. Backup format

A backup is a single ZIP archive:

```
medistock_backup_20261114_145741.zip
├── manifest.json          # version, database name, table + column list
└── tables/
    ├── table_0.jsonl      # one JSON object per row
    ├── table_1.jsonl
    └── ...
```

`manifest.json`:

```json
{
  "format": "MEDISTOCK_BACKUP",
  "version": 1,
  "database": "medistock",
  "createdAt": "2026-11-14T14:57:41",
  "tables": [
    { "name": "medicines", "columns": ["medicine_id", "medicine_name", "..."] }
  ]
}
```

- **JSON Lines** (`.jsonl`) keeps memory flat — rows are streamed, not parsed
  into one object.
- The table list is discovered from JDBC metadata, so new tables are included
  automatically after a schema change.
- Limits: **100 MB** per backup, **500 entries** in the archive.

### Restore validation

Before any data is written, `restoreBackup` checks:

1. `manifest.json` exists and `format` is `MEDISTOCK_BACKUP`.
2. `version` matches `FORMAT_VERSION` (currently `1`).
3. Every table in the manifest still exists.
4. Every column in the manifest still exists.
5. The uploaded file is a `.zip` and ≤ 100 MB.
6. The request carries the confirmation text `RESTORE MEDISTOCK`.

Then it:

1. Creates a safety backup of the current data.
2. `DELETE FROM` each table listed in the manifest, in manifest order.
3. Inserts the archived rows.
4. Returns `{"message":"Database restore completed successfully."}`.

Only the listed tables are touched — other schemas in the same database are
left alone.

---

## 3. Where files are stored

```
<working directory>/backups
```

For the Docker image that is `/app/backups`. The image creates the directory and
hands it to the non-root app user:

```dockerfile
RUN mkdir -p /app/backups && chown -R app:app /app
USER app
```

`DatabaseBackupService.resolveBackupDirectory()` also falls back to
`<java.io.tmpdir>/medistock-backups` if the working directory is not writable,
so a locked-down container cannot break the page with a 500.

Log line at startup:

```
BACKUP DIRECTORY: /app/backups
```

### Ephemeral storage — important

Render containers are **ephemeral**. Backup files survive while the instance
runs, but are wiped on the next deploy, restart or idle spin-down.

➡️ **Download any backup you want to keep before deploying.**

---

## 4. Using it from the UI

1. Sign in as `admin@medistock.local` (`Password@123`).
2. Sidebar → **System Monitoring**.
3. Open the **Backup & Restore** tab.
4. **Create backup** — the new file appears in the history table with size and
   timestamp.
5. **Download** — saves the `.zip` through your browser.
6. **Restore** — choose a `.zip`, type `RESTORE MEDISTOCK`, confirm.

---

## 5. Using it from the API

```bash
BASE=https://medistock-api-pxmy.onrender.com/api
TOKEN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@medistock.local","password":"Password@123","role":"ADMIN"}' \
  | sed -E 's/.*"token":"([^"]+)".*/\1/')

# create
curl -X POST "$BASE/admin/database-backups" -H "Authorization: Bearer $TOKEN"

# list
curl "$BASE/admin/database-backups" -H "Authorization: Bearer $TOKEN"

# download
curl -H "Authorization: Bearer $TOKEN" \
  "$BASE/admin/database-backups/medistock_backup_20261114_145741.zip/download" \
  -o backup.zip

# restore
curl -X POST "$BASE/admin/database-backups/restore" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@backup.zip" \
  -F "confirmation=RESTORE MEDISTOCK"
```

On Windows PowerShell use `curl.exe` (not `Invoke-WebRequest`) and keep JSON
bodies in a file with `--data-binary "@body.json"`; inline quoting breaks.

---

## 6. Verified results (production)

| Check | Result |
|---|---|
| `GET /api/admin/database-backups` before | `200 []` |
| `POST /api/admin/database-backups` | `200`, created `medistock_backup_20261114_145741.zip` |
| `GET` after create | `200`, one row, 8,007 bytes |
| `GET .../download` | `200`, `application/zip`, 8,007 bytes |

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `500` with `"/app/backups"` | directory missing or owned by root | the `chown` line in `backend/Dockerfile`; redeploy |
| Backup list empty after deploy | container storage is ephemeral | expected — download before deploying |
| `400 Only MediStock ZIP backup files are supported` | wrong extension | upload the `.zip` from this feature |
| `400 Please provide the exact confirmation text` | confirmation typo | type `RESTORE MEDISTOCK` exactly |
| `400 Backup file cannot exceed 100 MB` | archive too large | split the data or raise `MAX_BACKUP_SIZE` |
| Restore rejected after a schema change | table/column in the archive no longer exists | take a fresh backup with the current schema |

---

## 8. Limitations & recommended next steps

- **No off-container storage.** A real deployment should push backups to S3 /
  Cloudflare R2 / a backup volume, or use the managed database's own snapshots.
- **No scheduled backups.** Add a Render cron job calling `POST` on a schedule.
- **No encryption.** Archives contain all data in plain JSON — encrypt before
  uploading anywhere.
- **No partial restore.** The restore is all-or-nothing per table.
- **MySQL 5.5-compatible SQL only.** Restore uses plain inserts; no bulk loader.
