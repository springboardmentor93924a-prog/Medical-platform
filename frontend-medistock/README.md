# MediStock frontend (React + Vite + Tailwind)

## You need
- Node.js 20 or newer
- The MediStock backend running on http://localhost:8080 (see the backend repository)

## Run
```bash
npm install
npm run dev
```
Open http://localhost:5173 and sign in with the Admin account you set up in the backend.

## Different API address
By default the app calls http://localhost:8080. To point it somewhere else, create a file named `.env.local`
(it is git-ignored) containing:
```
VITE_API_URL=https://your-backend-address
```

## Roles
Admin, Pharmacist, Staff and Supplier each get their own sidebar and pages.
