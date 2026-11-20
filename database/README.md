# MediStock — database

MySQL / MariaDB schema and demo data for the MediStock app.

## Files

| File | Purpose |
|---|---|
| `schema.sql` | tables, indexes, foreign keys, constraints |
| `seed-demo.sql` | baseline demo data (users, medicines, suppliers, batches) |
| `seed-demo-extra.sql` | extra suppliers, medicines, batches, purchase orders, returns |
| `seed-demo-old-roles.sql` | demo data for the four original quick-login accounts |
| `migrations/001-role-modules.sql` | pharmacist / staff / supplier role columns and tables |
| `migrations/002-medicine-returns.sql` | `medicine_returns` table |
| `MediStock.mwb` | MySQL Workbench model |

## Order of operations (fresh database)

```bash
mysql -h <host> -u <user> -p -e "CREATE DATABASE medistock_db"
mysql -h <host> -u <user> -p medistock_db < schema.sql
mysql -h <host> -u <user> -p medistock_db < seed-demo.sql
mysql -h <host> -u <user> -p medistock_db < seed-demo-extra.sql
mysql -h <host> -u <user> -p medistock_db < seed-demo-old-roles.sql
```

For an existing database, apply the migrations in filename order instead:

```bash
mysql -h <host> -u <user> -p medistock_db < migrations/001-role-modules.sql
mysql -h <host> -u <user> -p medistock_db < migrations/002-medicine-returns.sql
```

## Notes

- **All seeds are idempotent** — safe to re-run. Rows are matched by natural keys
  (email, medicine name, batch number) before inserting.
- The app uses `spring.jpa.hibernate.ddl-auto=none`; Hibernate never changes the
  schema, so these scripts are the source of truth.
- Demo accounts use password `Password@123`:
  `admin@` · `pharmacist@` · `staff@` · `supplier@medistock.local`.
- Database-level backup and restore is handled by the app, not these scripts —
  see [`../docs/BACKUP-RESTORE.md`](../docs/BACKUP-RESTORE.md).
- Schema targets MySQL 5.5 compatibility: no window functions, no CTEs. Report
  and dashboard aggregations run in Java for that reason.
