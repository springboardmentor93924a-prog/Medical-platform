# MediStock — documentation

Start here. Each guide is self-contained and written for someone opening the
repo for the first time.

## Guides

| Document | What it covers |
|---|---|
| [`../README.md`](../README.md) | Project overview, module status, demo accounts, hosting |
| [`FRONTEND.md`](FRONTEND.md) | React app: stack, layout, role routing, HTTP layer, menus, pages, build/deploy |
| [`../backend/API.md`](../backend/API.md) | Every endpoint: roles, payloads, responses, status codes |
| [`../backend/README.md`](../backend/README.md) | Backend setup, environment variables, auth model, gotchas |
| [`BACKUP-RESTORE.md`](BACKUP-RESTORE.md) | Database backup format, restore rules, storage limits, troubleshooting |
| [`POSTMAN-TESTING.md`](POSTMAN-TESTING.md) | API test suite: 49 requests across auth, RBAC and modules |
| [`../database/README.md`](../database/README.md) | Schema, seeds and migration order |

## Postman assets

```
docs/postman/
├── MediStock-API.postman_collection.json
├── MediStock-Production.postman_environment.json
└── MediStock-Local.postman_environment.json
```

Import all three, pick the **Production** environment, then run the collection
for the full 49-request pass.

## Database scripts

```
database/
├── schema.sql              # tables, indexes, constraints
├── seed-demo.sql           # baseline demo data
├── seed-demo-extra.sql     # extra suppliers, medicines, batches, POs, returns
├── seed-demo-old-roles.sql # data for the four original quick-login accounts
└── migrations/             # incremental, idempotent changes
```

All seeds are idempotent — safe to re-run.

## Live deployment

| Service | URL |
|---|---|
| Web | https://medistock-web-230a.onrender.com |
| API | https://medistock-api-pxmy.onrender.com |
| Health | https://medistock-api-pxmy.onrender.com/api/health |

Demo accounts use password `Password@123`:
`admin@` · `pharmacist@` · `staff@` · `supplier@medistock.local`.

> Render's free tier sleeps after ~15 minutes of inactivity and the API needs
> ~75 seconds to boot. The first login after idle can take a minute or two; the
> frontend retries automatically.
