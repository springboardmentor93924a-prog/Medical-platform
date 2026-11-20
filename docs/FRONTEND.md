# Frontend documentation

MediStock web client: React 19 + Vite 8 + Tailwind CSS v4, talking to the Spring
Boot API in `../backend`.

- **Dev URL:** `http://localhost:5173`
- **Live:** https://medistock-web-230a.onrender.com
- **API base:** build-time `VITE_API_URL` (default `http://localhost:8080/api`)

---

## 1. Stack

| Layer | Choice |
|---|---|
| Framework | React 19.2 (function components + hooks) |
| Build | Vite 8.3 (`@vitejs/plugin-react`) |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` — no `tailwind.config.js`, tokens live in `src/index.css` |
| Charts | Recharts 3 |
| Icons | `lucide-react` |
| Lint | `oxlint` (`npm run lint`) |
| Routing | none — role switch in `App.jsx`, menu state inside each dashboard |

Declared but **unused**: `axios` (the app uses `fetch`). See §10.

---

## 2. Quick start

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
npm run lint     # oxlint
npm run preview  # serve the production build
```

Point it at another API without editing code:

```bash
# .env.local
VITE_API_URL=https://medistock-api-pxmy.onrender.com/api
```

`VITE_API_URL` is baked in at **build time**, so a Render deploy must set it
before `npm run build`.

---

## 3. Project layout

```
src/
├── main.jsx                 # createRoot + initTheme()
├── App.jsx                  # token/role switch, login -> dashboard
├── index.css                # Tailwind import, @theme tokens, dark variant
├── api/
│   ├── api.js               # legacy duplicate of services/api.js (unused)
│   └── pharmacistApi.js     # axios-shaped wrapper over apiFetch
├── components/
│   ├── AppShell.jsx         # sidebar + mobile drawer + header
│   ├── AuthLayout.jsx       # split-screen login/signup chrome
│   ├── AssistantChat.jsx    # floating local assistant (ADMIN/PHARMACIST)
│   ├── WastageReport.jsx    # wastage cards + tables (shared by admin/pharmacist)
│   ├── ThemeToggle.jsx
│   └── icons.jsx            # name -> lucide icon map
├── lib/theme.js             # theme persistence
├── services/api.js          # THE HTTP layer (apiFetch, downloadFile)
└── pages/
    ├── Login.jsx, Signup.jsx
    ├── admin/       (16 files)
    ├── pharmacist/  (14 files)
    ├── staff/       (9 files)
    └── suppliers/   (4 files)
```

---

## 4. Entry point and role routing

`main.jsx` applies the saved theme, then renders `<App />` inside `StrictMode`.

`App.jsx` is the only "router":

```js
const [token, setToken] = useState(() => sessionStorage.getItem("medistock_token"));
const [role, setRole]   = useState(() => sessionStorage.getItem("medistock_role")?.toUpperCase() || null);
```

Behaviour:

| State | Renders |
|---|---|
| no token | `Login` (or `Signup` when `page === "signup"`) |
| `ADMIN` | `AdminDashboard` |
| `PHARMACIST` | `PharmacistDashboard` |
| `STAFF` | `StaffDashboard` |
| `SUPPLIER` | `SupplierDashboard` (or `SupplierNotifications` sub-page) |

- `handleLogin(data)` validates `data.token` and a known role, stores
  `medistock_token` / `medistock_role` in **`sessionStorage`**, and switches the
  dashboard.
- `handleLogout()` clears those keys plus the older `localStorage` keys and
  returns to login.
- An effect logs out if the stored role is not one of the four valid roles.

> **Session storage, not local storage.** Closing the tab signs you out. The
> token also expires server-side after 8 h.

Each dashboard keeps its own `active` menu id in React state, so the URL never
changes while navigating — refreshing returns you to that dashboard's default
page.

---

## 5. HTTP layer (`src/services/api.js`)

```js
import { apiFetch, downloadFile, API_BASE } from "../../services/api";
```

### `apiFetch(path, options)`

- Prefixes `API_BASE`, adds `Content-Type: application/json` when a body is
  present and not `FormData`, and attaches
  `Authorization: Bearer <sessionStorage.medistock_token>`.
- Parses JSON when the content type says JSON, otherwise returns text.
- On a non-2xx response it throws an `Error` whose `.message` comes from
  `data.message || data.error || data.detail`, with `.status` and `.data` set.

### Cold-start retry (`fetchWithWake`)

Render's free tier sleeps after ~15 minutes and Spring Boot needs ~75 s to
boot. `fetchWithWake` retries up to 5 times with delays of
`0, 15, 30, 45, 45` seconds.

A retry only happens when the status is `502/503/504` **and** the response is
not JSON:

```js
const serverIsStarting =
  [502, 503, 504].includes(response.status) &&
  !contentType.includes("application/json");
```

That distinction matters: the SMTP test endpoint answers `503` with a JSON
message when mail is not configured, and that must surface immediately instead
of looping for two minutes.

`401` and `403` are never retried.

### `downloadFile(path, filename)`

Fetches with the auth header, turns the body into a Blob, and triggers a
temporary `<a download>` click. Used by every CSV report and by backup
downloads.

### `src/api/pharmacistApi.js`

A thin axios-compatible wrapper:

```js
const { data } = await pharmacistApi.getMedicines();
// errors keep error.response.data for the legacy call sites
```

It exists so the pharmacist screens could be ported without rewriting their
`try/catch` blocks. New code should call `apiFetch` directly.

---

## 6. Design system

- **Tailwind v4.** `src/index.css` declares `@import "tailwindcss"`, the dark
  variant, and custom tokens:
  - `--color-brand-*` (blue 50→700)
  - `--color-ink-*` (deep green used by the auth screen)
- **Dark mode.** `@custom-variant dark (&:where(.dark, .dark *))` — the toggle
  adds `.dark` to `<html>`.
- **Theme resolution order** (`src/lib/theme.js`):
  1. `?theme=light|dark` in the URL
  2. `localStorage.medistock_theme`
  3. `prefers-color-scheme`
- **Styling convention:** utility classes inline, `dark:` variants next to the
  light ones, e.g.
  `bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100`.
  Form inputs share an `inputClass` constant per page or component.
- **Layout:** `AppShell` provides the fixed sidebar, the mobile drawer with
  overlay, the header (role badge, theme toggle, sign out) and the content
  gutter. `AuthLayout` is the split-screen wrapper for Login/Signup.

---

## 7. Role menus

### Admin — exactly 12 items

`Dashboard` · `Medicine Management` · `Categories` · `Supplier Management` ·
`Purchase Orders` · `Stock Management` · `Expiry Tracking` · `Reports &
Analytics` · `User Management` · `Notifications` · `System Monitoring` ·
`Settings`

Backup & Restore is a tab **inside System Monitoring**, not a separate item.

### Pharmacist — 13 items

`Dashboard` · `Medicines` · `Categories` · `Stock Monitoring` ·
`Dispatch Medicine` · `Expiry Tracking` · `AI Recommendations` ·
`Medicine Returns` · `Purchase Orders` · `Suppliers` · `Inventory Reports` ·
`Notifications` · `My Profile`

> "Dispatch Medicine" is the UI label for the FEFO feature; the API path stays
> `/api/fefo`.

### Staff — 8 items

`Dashboard` · `View Medicines` · `Search Medicines` · `Stock Checking` ·
`Receive Medicines` · `Expiry Checking` · `Notifications` · `My Profile`

### Supplier — 5 items

`Dashboard` · `My Purchase Orders` · `Medicine Returns` · `Notifications` ·
`My Profile`

---

## 8. Pages

### Admin (`src/pages/admin`)

| File | Purpose |
|---|---|
| `AdminDashboard.jsx` | shell + 12-item menu |
| `DashboardHome.jsx` | 10 KPI tiles, 7 Recharts charts, global search |
| `Medicines.jsx` | medicine CRUD |
| `Categories.jsx` | categories with bulk medicine tagging |
| `Suppliers.jsx` | supplier CRUD + status |
| `PurchaseOrders.jsx` | list, approve / reject / cancel |
| `StockManagement.jsx` | batches, stock in/out |
| `StockMovements.jsx` | movement history |
| `ExpiryTracking.jsx` | expired / expiring batches |
| `Reports.jsx` | 7 CSV exports + print |
| `Users.jsx` | user CRUD, activate/deactivate |
| `Notifications.jsx` | inbox, filters, mark read |
| `SystemMonitoring.jsx` | audit log + **Backup & Restore tab** |
| `Settings.jsx` | general/inventory/notification settings, SMTP test |
| `Inventory.jsx` | batch inventory view |
| `BackupRestore.jsx` | backup list, create, download, restore |

### Pharmacist (`src/pages/pharmacist`)

`DashboardOverview` (also hosts the stock-monitoring overview), `Medicines`,
`Categories`, `Inventory`, `FefoDispensing` (*Dispatch Medicine*),
`ExpiryTracking`, `AiRecommendations`, `MedicineReturns`, `PurchaseOrders`,
`Suppliers`, `Reports`, `MyProfile`, `PharmacistNotifications`.

### Staff (`src/pages/staff`)

`DashboardOverview`, `ViewMedicines`, `SearchMedicines`, `StockChecking`,
`ReceiveMedicines`, `ExpiryChecking`, `StaffNotifications`, `StaffProfile`.

### Supplier (`src/pages/suppliers`)

`SupplierDashboard`, `SupplierMedicineReturns`, `SupplierNotifications`,
`SupplierProfile`.

---

## 9. Shared components

| Component | Used by | Notes |
|---|---|---|
| `AppShell` | all four dashboards | sidebar, drawer, header, theme toggle |
| `AuthLayout` | Login, Signup | split screen with brand panel |
| `ThemeToggle` | `AppShell`, auth screens | writes `medistock_theme` |
| `AssistantChat` | admin + pharmacist | floating panel, `POST /api/assistant/chat` |
| `WastageReport` | admin reports, pharmacist reports | cards + tables, CSV download |
| `icons.jsx` | menus | name → lucide component |

---

## 10. Known issues / cleanup targets

1. **Duplicate API modules** — `src/api/api.js` repeats `services/api.js` and is
   imported nowhere. Delete it.
2. **Unused `axios`** in `package.json` — nothing imports it.
3. **Bundle size** — one 1.15 MB chunk (279 KB gzipped); Recharts dominates.
   `React.lazy` per role dashboard would fix first paint.
4. **`alert()`** is still used for a few failures (e.g. Settings save) while
   other pages use inline banners. Standardise on toasts.
5. **Settings are browser-local** — `Settings.jsx` persists to
   `localStorage.medistock_settings`; the backend does not store them, and
   "Maintenance Mode" is labelled as needing backend enforcement.
6. **No URL routing** — deep links and browser back/forward do not work inside a
   dashboard.
7. **No automated tests** — only `oxlint`.
8. **Large tables unpaged** — medicines, movements, notifications and purchase
   orders render every row.

---

## 11. Build & deploy

```bash
npm ci
VITE_API_URL=https://medistock-api-pxmy.onrender.com/api npm run build
# publish dist/
```

Render static site settings:

| Setting | Value |
|---|---|
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` |
| Env var | `VITE_API_URL` |

Notes:

- The SPA has no client-side router, so no rewrite rule is needed.
- Rebuild after changing `VITE_API_URL` — it is compiled into the bundle.
- The build prints a chunk-size warning; it is expected and does not fail the
  build.
