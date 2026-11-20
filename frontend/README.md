# MediStock — frontend

React 19 + Vite 8 + Tailwind CSS v4 client for the MediStock pharmacy inventory
API.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
npm run lint     # oxlint
```

Point the app at a different API at **build time**:

```bash
# .env.local
VITE_API_URL=https://medistock-api-pxmy.onrender.com/api
```

Default is `http://localhost:8080/api`.

Full documentation — layout, role routing, HTTP layer, menus, every page, and
deploy notes: [`../docs/FRONTEND.md`](../docs/FRONTEND.md).

## Structure at a glance

```
src/
├── App.jsx              # token/role switch (no router)
├── services/api.js      # apiFetch, downloadFile, cold-start retry
├── components/          # AppShell, AuthLayout, AssistantChat, WastageReport
├── lib/theme.js         # light/dark persistence
└── pages/
    ├── admin/  pharmacist/  staff/  suppliers/
```

## Notes

- Tokens live in **`sessionStorage`** (`medistock_token`, `medistock_role`).
- The API wakes slowly on Render's free tier; requests retry `502/503/504`
  responses automatically (JSON error responses are returned immediately).
- The build warns about a >500 kB chunk (Recharts). It is expected.
