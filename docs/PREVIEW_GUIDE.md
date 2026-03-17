# How to Preview the Project

Quick steps to run the Ace Truckers ERP app locally and open it in your browser.

---

## Prerequisites

- **Node.js** 18+ and **npm**
- **PostgreSQL** (running locally or a connection string)

---

## 1. One-time setup

### Database and API env

1. Create a PostgreSQL database named `ace_truckers_erp` (or use your own name).
2. In the **api** folder, create `.env` from the example:

   **Windows (PowerShell):**
   ```powershell
   cd api
   copy .env.example .env
   ```

   **Mac/Linux:**
   ```bash
   cd api
   cp .env.example .env
   ```

3. Edit **api/.env** and set:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/ace_truckers_erp?schema=public"
   ```
   Replace `USER` and `PASSWORD` with your PostgreSQL credentials.

### Install and migrate

From the **api** folder:

```bash
cd api
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

(If you prefer not to use migrations: `npx prisma db push` then `npx prisma db seed`.)

### Web app (no env required for basic preview)

From the **web** folder:

```bash
cd web
npm install
```

The web app uses Vite and proxies `/api` to the API; no `.env` is required for a basic preview.

---

## 2. Preview the app (every time)

Use **two terminals**: one for the API, one for the web app.

### Terminal 1 — Start the API

```bash
cd api
npm run start:dev
```

Wait until you see something like: **Application is running on: http://localhost:3001**

### Terminal 2 — Start the web app

```bash
cd web
npm run dev
```

Vite will show the local URL; the app is configured to run at **http://localhost:3000**.

### Open in browser

1. Open **http://localhost:3000** in your browser (or the URL shown in the terminal).
2. On the **login** screen, use the seeded user:
   - **Email:** `admin@acetruckers.com`
   - **Password:** `admin123`
3. After login you’ll see the dashboard (Operations, Fleet, Dispatch, Finance, Reports, etc.).

---

## 3. Optional: API docs (Swagger)

With the API running:

- Open **http://localhost:3001/api** in your browser to use Swagger UI and try endpoints.

---

## 4. Optional: Production-style web build

To preview the web app as a built bundle:

```bash
cd web
npm run build
npm run preview
```

Then open the URL shown in the terminal (e.g. **http://localhost:4173**). The API must still be running separately on port 3001 for API calls to work.

---

## 5. Optional: Driver app (Expo)

```bash
cd driver-app
npm install
npx expo start
```

Use the QR code or an emulator to open the app. Configure the API base URL in the app or env as needed.

---

## Quick reference

| What              | URL / Command                          |
|-------------------|----------------------------------------|
| Web app (dev)     | `cd web` → `npm run dev` → open URL in browser |
| API (dev)         | `cd api` → `npm run start:dev` → http://localhost:3001 |
| Swagger           | http://localhost:3001/api              |
| Login (seed)      | admin@acetruckers.com / admin123      |

---

## Troubleshooting

| Problem | What to do |
|--------|------------|
| API won’t start | Check `DATABASE_URL` in **api/.env**, PostgreSQL is running, and you ran `npx prisma generate`. |
| 401 after login on web | Ensure the API is running and the web app is using the correct dev URL (so `/api` is proxied to the API). |
| Blank or error on web | Open DevTools (F12) and check the Console/Network; ensure the API is on port 3001 and the proxy in **web/vite.config.ts** points to it. |

For more detail (JWT, proxy, driver app config), see **docs/TESTING_GUIDE.md**.
