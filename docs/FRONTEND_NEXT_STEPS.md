# Frontend – Recommended Order to Finish

## Already done
- **Login** – Email/password, session expired, loading state
- **Dashboard** – Ops summary (pending acceptance, POD, incidents) + Finance summary (POD verified, doc received, ready to bill, payout ready), role-based
- **Auth** – 401 interceptor, redirect to login, clear storage
- **Trips** – List (filters, search by ref), detail page (schedule, driver/vehicle, finance, incidents, stops)
- **Global search** – Topbar → Trips with `?q=`
- **Dispatch** – Ops summary pills + Create trip form with client/category/driver/vehicle dropdowns (`GET /dispatch/lookups`)
- **Incidents** – List with filters (date, status), search, link to trip
- **Rates** – List + filters + create rate form (with lookups)
- **Admin** – Hub with current session (email/role), placeholder cards for User management & Tenant settings, link to Reports

---

## Recommended order to finish

### 1. **Finance page** (high impact – “login to collected”)
- Use `GET /finance/dashboard` for counts and lists (same as dashboard but full Finance view).
- Add links/cards: POD verified not received, Doc received not computed, Ready to bill, Payout ready.
- Link to **AR Ledger** (`GET /finance/reports/ar-ledger`) and **AP Ledger** (`GET /finance/reports/ap-ledger`) – simple table views or export.
- Optional: list **Payout batches** (`GET /finance/payout-batches`), trip scan by internal ref.

### 2. **Fleet Acquisition** (unblocks Dispatch dropdowns)
- **Operators** – List (`GET /fleet-acquisition/operators`), Create (`POST /fleet-acquisition/operators`). Simple table + form.
- **Drivers** – List + Create, assign to operator (dropdown from operators).
- **Vehicles** – List + Create, assign to operator.
- Then: in Dispatch “Create trip”, load operators/drivers/vehicles and use dropdowns for client, category, driver, vehicle.

### 3. **Rates**
- List route rates (`GET /rates`) with filters (client, category, origin, destination, date).
- Create rate form (`POST /rates`) – client, category, origin, destination, effective start/end, amounts.
- Link from Dispatch when “no active rate” error appears.

### 4. **Reports**
- **AR Ledger** – Page calling `GET /finance/reports/ar-ledger` (table: trip, internal ref, aging, amount).
- **AP Ledger** – Page calling `GET /finance/reports/ap-ledger` (table: trip, operator, payout status, amount).
- Optional: date range filter, export CSV.

### 5. **Admin** (done)
- Admin hub: current session (email/role), link cards for User management and Tenant settings (disabled until API exists), link to Reports.

---

## Quick reference – API base

| Module            | Base path                  | Key endpoints                              |
|-------------------|----------------------------|--------------------------------------------|
| Auth              | `/auth`                    | POST `/login`                              |
| Dispatch          | `/dispatch`                | GET/POST `/trips`, GET `/dashboard/operations` |
| Finance           | `/finance`                 | GET `/dashboard`, `/reports/ar-ledger`, `/reports/ap-ledger`, `/payout-batches` |
| Fleet Acquisition | `/fleet-acquisition`       | GET/POST `/operators`, `/drivers`, `/vehicles` |
| Rates             | `/rates`                   | GET/POST `/`, GET `/lookups`, GET `/:id`   |
| Incidents         | `/incidents`               | GET `/trip/:tripId`, GET `/:id`, POST etc. |

Use `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:3001`) and send `Authorization: Bearer <token>` for protected routes.
