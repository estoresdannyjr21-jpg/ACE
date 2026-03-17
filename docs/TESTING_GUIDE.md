# Ace Truckers ERP — Testing Guide

Step-by-step guide to run **automated tests** and to **manually test** the API, web dashboards, and (optionally) the driver app.

---

## 1. Running automated tests

### 1.1 API unit tests (Jest)

The backend uses **Jest** for unit tests. Test files are next to the code and match `*.spec.ts`.

**From the project root:**

```bash
cd api
npm install
npm test
```

**Useful commands (run from `api/`):**

| Command | Description |
|--------|--------------|
| `npm test` | Run all unit tests once |
| `npm run test:watch` | Run tests in watch mode (re-run on file changes) |
| `npm run test:cov` | Run tests and generate a coverage report in `api/coverage/` |
| `npm run test:debug` | Run tests with Node inspector for debugging |

**Notes:**

- Unit tests do **not** require PostgreSQL; they use mocks and run in Node.
- Tests are under `api/src/` (e.g. `api/src/common/guards/rbac.guard.spec.ts`).
- To add a test: create a file named `*.spec.ts` next to the module (e.g. `my.service.spec.ts`) and run `npm test` from `api/`.

### 1.2 API end-to-end (e2e) tests

The API defines an e2e script, but the e2e config file may need to be created:

```bash
cd api
npm run test:e2e
```

If you see a missing config error, add `api/test/jest-e2e.json` and point it at your e2e test files. E2E tests typically need a running database (e.g. test DB or Docker).

### 1.3 Web app tests

The **web** app (Vite + React) does **not** currently have a test runner configured. To add one later you can use **Vitest** (e.g. `npm install -D vitest @testing-library/react jsdom` and a `test` script in `web/package.json`). For now, verify the web app manually (see sections 6–7 below).

---

## 2. Prerequisites

- **Node.js** 18+ and **npm**
- **PostgreSQL** running locally (or a remote database URL)
- **Git** (repo already cloned)

---

## 3. Database setup

### 3.1 Create the database

In PostgreSQL, create a database (if it doesn’t exist):

```sql
CREATE DATABASE ace_truckers_erp;
```

### 3.2 Configure the API

In the **api** folder, copy the env example and set your database URL:

```bash
cd api
# Windows (Command Prompt or PowerShell):
copy .env.example .env
# Mac/Linux:
# cp .env.example .env
```

Edit **api/.env** and set:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/ace_truckers_erp?schema=public"
```

Replace `USER` and `PASSWORD` with your PostgreSQL user and password.

Optionally set:

- `JWT_SECRET` (default is fine for local dev)
- `PORT=3001` (API port; default 3001)

### 3.3 Run migrations and seed

From the **api** folder:

```bash
cd api
npm install
npx prisma migrate dev --name init
npx prisma db seed
```

- **migrate** creates/updates tables (run again with a new name if you add schema changes, e.g. `npx prisma migrate dev --name add_ar_batch`).
- **seed** creates (requires `"prisma": { "seed": "ts-node prisma/seed.ts" }` in api/package.json):
  - Tenant “Ace Truckers Corp”
  - User **admin@acetruckers.com** / **admin123** (SUPER_ADMIN)
  - Client “Shopee Express” (SPX) and 8 service categories
  - Sample operators, drivers, vehicles (if present in seed)

If you use `db push` instead of migrate:

```bash
npx prisma db push
npx prisma db seed
```

---

## 4. Start the API

From the **api** folder:

```bash
cd api
npm run start:dev
```

You should see:

- `API running on http://localhost:3001`
- `Swagger docs at http://localhost:3001/api`

- **Health:** open [http://localhost:3001](http://localhost:3001) (root may return 404; that’s OK).
- **Swagger UI:** open [http://localhost:3001/api](http://localhost:3001/api).

---

## 5. Get a JWT (for the web app)

The web app needs a JWT to call protected endpoints.

### Option A — Using Swagger

1. Open [http://localhost:3001/api](http://localhost:3001/api).
2. Find **POST /auth/login**.
3. Click **Try it out**.
4. Body:

```json
{
  "email": "admin@acetruckers.com",
  "password": "admin123"
}
```

5. Click **Execute**.
6. From the response, copy the **access_token** value.

### Option B — Using curl (PowerShell)

```powershell
$body = @{ email = "admin@acetruckers.com"; password = "admin123" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Body $body -ContentType "application/json"
```

Copy the `access_token` from the output.

### Option C — Using curl (bash / Git Bash)

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acetruckers.com","password":"admin123"}'
```

Copy the `access_token` from the response.

---

## 6. Run the web app (Finance & Operations dashboards)

The **web** app lives in the **repo root** (`web/`), not inside `api/`. From the project root:

### 6.1 Install and configure

```bash
cd "C:\Users\Ace Truckers Co\Downloads\ace-truckers-erp\web"
# Or from repo root:  cd web
# Windows: copy .env.example .env
# Mac/Linux: cp .env.example .env
npm install
```

Edit **web/.env**:

- `VITE_API_URL=/api` — keep this so the dev server proxies to the API.
- To avoid logging in in the UI, you can set the token (optional):

```env
VITE_AUTH_TOKEN=paste_your_jwt_here
```

If you don’t set `VITE_AUTH_TOKEN`, use the browser method below.

### 6.2 Start the dev server

```bash
cd web
npm run dev
```

The app will open at **http://localhost:3000**.

### 6.3 Set the token in the browser (if not using .env)

1. Open **http://localhost:3000**.
2. Open DevTools (F12) → **Console**.
3. Run (replace with your actual token):

```javascript
sessionStorage.setItem('auth_token', 'YOUR_ACCESS_TOKEN_HERE');
```

4. Refresh the page (F5).

### 6.4 Test the dashboards

- **Finance**
  - Use the **Finance** tab.
  - Use filters (date range, client, service category, operator) and click **Apply** / **Reset**.
  - Check KPI tiles and tables (POD verified, doc received, overrides).
- **Operations**
  - Use the **Operations** tab.
  - Use filters (date range, client, service category, operator, driver) and click **Apply** / **Reset**.
  - Check KPI tiles and tables (pending acceptance, no-update trips, open incidents).

With no trips in the DB, counts may be 0 and tables empty; that’s expected. After creating trips (e.g. via Swagger **POST /dispatch/trips**), data will appear when filters match.

---

## 7. Verify API proxy (web → API)

The web app sends requests to `/api/...`. Vite proxies them to the API:

- **web/vite.config.ts** proxies `/api` to `http://localhost:3001`.
- So `GET /api/finance/dashboard` becomes `GET http://localhost:3001/finance/dashboard`.

If you see 401 or CORS errors:

- Ensure the API is running on port 3001.
- Ensure the token is set (`VITE_AUTH_TOKEN` or `sessionStorage.auth_token`).
- Ensure you’re opening the web app at **http://localhost:3000** (not another port).

---

## 8. Optional — Driver app (React Native / Expo)

```bash
cd driver-app
npm install
npx expo start
```

Use an emulator or “Expo Go” on your phone. The driver app uses the same API; configure its base URL (and login) as per your environment.

---

## 9. Optional — Test with Swagger only

1. Open [http://localhost:3001/api](http://localhost:3001/api).
2. **POST /auth/login** with `admin@acetruckers.com` / `admin123`.
3. Copy the **access_token**.
4. Click **Authorize** (top of the page), enter: `Bearer YOUR_ACCESS_TOKEN`, then **Authorize**.
5. Call any protected endpoint (e.g. **GET /finance/dashboard**, **GET /dispatch/dashboard/operations**, **GET /finance/lookups**, **GET /dispatch/lookups**).

---

## 10. Troubleshooting

| Issue | What to check |
|-------|----------------|
| API won’t start | `DATABASE_URL` in **api/.env**; PostgreSQL running; `npx prisma generate` run after schema changes. |
| 401 on web | Token set in **web/.env** as `VITE_AUTH_TOKEN` or in browser `sessionStorage.auth_token`; token not expired. |
| Empty dashboards | Normal if DB has no trips. Create trips via **POST /dispatch/trips** (Swagger) or seed more data. |
| CORS errors | Use the web app at **http://localhost:3000** so the proxy is used; API allows origin `http://localhost:3000` by default. |
| “Lookups failed” / 403 | User role must be allowed (e.g. SUPER_ADMIN from seed). Use **admin@acetruckers.com**. |
| Prisma client out of date | In **api**: `npx prisma generate` then restart `npm run start:dev`. |

---

## 11. Quick reference

| Item | Value |
|------|--------|
| API base | http://localhost:3001 |
| Swagger | http://localhost:3001/api |
| Web app | http://localhost:3000 (run from **repo root**: `cd web` then `npm run dev`) |
| Login (seed) | admin@acetruckers.com / admin123 |
| Web env | VITE_API_URL=/api, optional VITE_AUTH_TOKEN |
