# AR Import CSV Formats & Batch APIs

Reference for Client AR batch APIs and CSV import endpoints.

---

## AR batch endpoints

- **GET /finance/ar/batches** — List AR batches. Query: `clientAccountId`, `serviceSegment`, `status`, `cutoffFrom`, `cutoffTo`.
- **GET /finance/ar/batches/:id** — Get one batch with trips and unmatched lines.
- **PATCH /finance/ar/batches/:id/attach-invoice** — Body: `{ invoiceNumber, invoiceDate }`. Sets batch status to INVOICED and trip billing status to BILLED.
- **PATCH /finance/ar/batches/:id/deposited** — Marks batch as DEPOSITED and trip billing status to PAID (only when batch is PAYMENT_LIST_RECEIVED).

---

## 1. Reverse Billing Import

**Endpoint:** `POST /finance/ar/reverse-billing/import`

**Query parameters (all required with file):**
- `client_code` — e.g. `SPX`
- `service_segment` — one of: `FM_ONCALL`, `FM_WETLEASE`, `MFM_ONCALL`
- `cutoff_start_date` — ISO date, e.g. `2026-02-01`
- `cutoff_end_date` — ISO date, e.g. `2026-02-15`
- `commit` — `true` to apply changes; omit or `false` for preview only

**CSV columns:**

| Column               | Required | Description |
|----------------------|----------|-------------|
| `client_trip_ref`    | Yes      | Client’s trip reference (matching priority 1) |
| `our_internal_ref`   | No       | Our internal ref (matching priority 2 if client_trip_ref has multiple matches) |
| `service_category_code` | No   | Stored on unmatched lines only |
| `runsheet_date`      | No       | Stored on unmatched lines only |
| `amount_client`      | No       | Stored on unmatched lines only |

**Matching:** Rows are matched to our trips by `client_trip_ref` first (against `Trip.clientTripRef` or `Trip.externalRef`), then by `our_internal_ref`. Trips must be in the same tenant, client, segment (category in that segment), and runsheet date within the cut-off range.

**Preview:** With `commit=false`, returns `matched`, `disputes`, `unmatched` counts and up to 50 unmatched rows. No DB changes.

**Commit:** Creates/updates the AR batch, links matched trips, marks our trips in the same period not in the CSV as dispute, and creates `ArBatchUnmatchedLine` for each unmatched CSV row.

---

## 2. Payment List Import

**Endpoint:** `POST /finance/ar/payment-list/import`

**Query parameters (required with file):**
- `client_code` — e.g. `SPX`
- `payment_list_received_date` — ISO date, e.g. `2026-03-10`
- `commit` — `true` to apply; omit or `false` for preview

**CSV columns:**

| Column          | Required | Description |
|-----------------|----------|-------------|
| `invoice_number` | Yes    | Our invoice number (must exist on an ArBatch for this client) |
| `amount_paid`   | No       | Amount received from client for that invoice |

**Behavior:** For each row, finds the AR batch with that `invoice_number` and updates: `paymentListReceivedAt`, `checkPickupDate` (received date + 4 days), optional `amountPaidFromClient`, status `PAYMENT_LIST_RECEIVED`. Invoices not found are returned in `notFound`.

**Preview:** With `commit=false`, returns `updated` count and up to 50 `notFound` invoice numbers.

---

## Example CSV (Reverse Billing)

```csv
client_trip_ref,our_internal_ref,service_category_code,runsheet_date,amount_client
REF-001,SPX-2026-0001,SPX_FM_4W_ONCALL,2026-02-05,1200.00
REF-002,,SPX_FM_6WCV_ONCALL,2026-02-10,
```

## Example CSV (Payment List)

```csv
invoice_number,amount_paid
INV-2026-02-FM-001,150000.00
INV-2026-02-FM-002,98000.50
```
