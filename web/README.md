# Ace Truckers ERP — Web (Dashboards)

The dashboard is a **Vite + React** SPA under **`src/`** (`index.html`, `src/main.tsx`, `src/App.tsx`). Legacy Next.js routes under `app/` have been removed; do not reintroduce a second framework in this package.

Minimal React app with **Finance** and **Operations** dashboards.

- **Finance:** `GET /finance/lookups`, `GET /finance/dashboard` (with optional filters: date range, client, service category, operator).
- **Operations:** `GET /dispatch/dashboard/operations`.

## Setup

```bash
cd web
npm install
```

Optional: copy **`.env.example`** to **`.env`** in this folder. For local dev the defaults are usually enough (`VITE_API_URL=/api` uses the Vite proxy to the API on port 3001).

## Run

1. Configure the API: copy **`api/.env.example`** to **`api/.env`**, set `DATABASE_URL`, then start the API: `cd api && npm run start:dev` (default port **3001**).
2. `VITE_API_URL` — if unset, **`/api`** uses the Vite proxy to `http://localhost:3001` (see `vite.config.ts`).
3. For authenticated requests, set `VITE_AUTH_TOKEN` in `.env` or in browser: `sessionStorage.setItem('auth_token', 'YOUR_JWT')`.
4. Start the web app: `npm run dev` (default http://localhost:3000).

## Company logo

Save your logo in the **public** folder so it appears in the app header:

- **Path:** `web/public/logo.png` (or `logo.svg` / `logo.jpg`)
- **Usage:** The app loads `/logo.png`. Recommended height ~36–40px (width auto).
- If the file is missing, the text “Ace Truckers ERP” is shown instead.  
  To use a different filename (e.g. `logo.svg`), change `LOGO_PATH` in `src/App.tsx`.

## Build

```bash
npm run build
npm run preview   # serve dist
```
