# Client-to-Us (AR) Payment Workflow — Shopee Express

**Purpose:** Shared understanding of the client payment (AR) process and how it will be supported in the system, including **reverse billing CSV upload**, **auto-dispute**, and **client-listed-no-record** handling. **For review only** — no implementation until you confirm.

---

## 1. Your Process (Restated)

### Cut-off batching (client side)
- The client (Shopee Express) pays **per service category** and **per cut-off period**.
- **Cut-off periods**: **1–15** and **16–31** of the month (two batches per month per category).
- For each such batch, the client produces a **reverse billing** (their list of trips they are confirming for payment in that batch).

### Three outcomes when we receive the reverse billing (client’s list)

1. **Included in reverse billing and we have the trip** — Client validated these trips; we have a matching record. These are attached to the AR batch and will be invoiced/paid in the normal flow.
2. **We have the trip but it was NOT in the client’s list (dispute)** — We have a record for that period/category, but it was **not** in the client’s reverse billing. We **dispute / bill separately** with Shopee; they are not part of this batch payment flow.
3. **In the client’s list but we DON’T have a record** — The client included a trip/reference in their reverse billing, but we have **no matching trip** in our system. Possible scenarios: (a) the trip is **not really for us** (wrong vendor / client error), or (b) we **missed recording** the trip. We need to **record** these so we can investigate, add the trip later if we missed it, or confirm it’s not ours.

### End-to-end flow (after we have delivered and documented)

| Step | What happens | Who |
|------|----------------|-----|
| 1 | **DOC received by Finance** — We have the supporting document (e.g. runsheet/POD verified); trip is ready for our billing process. | Us (Finance) |
| 2 | **Reverse billing released by client** — Client sends their list (per category, per cut-off). That list = **client’s confirmation** of trips they will pay in that batch. | Client |
| 3 | **We attach our Invoice** — For that batch (per category, per cut-off), Finance attaches/creates **our Invoice**. **Invoice date** = start of the 30-day count. | Us (Finance) |
| 4 | **30 days from invoice date** — Client must send the **Payment List** (email) within this period. The Payment List can reference multiple invoices (e.g. per category, per cut-off). | Client |
| 5 | **Payment list received** — We receive the email with the Payment List. | Us (Finance) |
| 6 | **+4 days** — From the date we received the Payment List, we wait 4 days, then we can **pick up the check**. | Us |
| 7 | **Deposit** — Check is deposited to our account. Payment received; AR for that batch is closed. | Us (Finance) |

So: **Doc received → Client reverse billing (batch confirmed) → We invoice (invoice date) → Payment list (within 30 days) → +4 days → Check pickup → Deposit.**

---

## 1b. Reverse Billing CSV Upload and Bulk Update

### Purpose
Finance receives the client’s reverse billing as a **list of trips** (e.g. Excel/CSV). We need to **upload this CSV** so the system can:
1. **Bulk update** — Attach the reverse billing to an AR batch and match each row to our trips where we have a record.
2. **Auto-update disputes** — Any trip we have in that period (same client, same service category, same cut-off) that is **not** in the uploaded list is automatically marked as **dispute** (billing dispute).
3. **Record “client listed, we don’t have”** — Any row in the CSV that **does not match** a trip in our system is stored as a separate record. Possible reasons: trip is not for us, or we missed recording it. We need this list for follow-up (investigate, add trip later, or confirm not ours).

### CSV upload flow (proposed)

| Step | Action | System behavior |
|------|--------|------------------|
| 1 | User selects/create AR batch (client + service category + cut-off period). | Batch identifies which period and category the list belongs to. |
| 2 | User uploads CSV file (reverse billing from client). | Parse CSV; one row = one trip reference. Matching to our trips will use an agreed identifier (e.g. our `internalRef`, or a client trip ID column — column name and format to be agreed at implementation; can be configurable per client). |
| 3 | **Match** each row to our trips (e.g. by `internalRef` or agreed identifier). | For each match: link trip to this AR batch; mark as “in reverse billing” for this batch. |
| 4 | **Auto-dispute** | For the same period + client + category: all our trips that are **not** in the matched set → set **billing dispute** (and optionally reason = “Not in client reverse billing for this cut-off”). |
| 5 | **Record unmatched CSV rows** | For each CSV row that did **not** match any trip: create a record “client listed this reference but we have no trip” (store reference, batch id, uploaded at, optional notes). So we have: list of **client-listed-no-record** for this batch. |

### Outcomes after upload (summary)

| Scenario | Our system | Action |
|----------|------------|--------|
| CSV row matches our trip | Trip exists, in period/category | Attach trip to AR batch; include in batch for invoicing. |
| We have trip in period/category, not in CSV | Trip exists | Mark as **dispute** (auto). We bill/dispute separately. |
| CSV row, no matching trip | No trip in our system | **Record** as “client listed, no record” (trip not for us, or we missed recording). Keep for review. |

### Suggested terms for “client listed, no record”
- **Client-listed, no record** — Client included this reference in reverse billing; we have no matching trip.
- **Orphan reverse billing line** / **Unmatched reverse billing line** — Same idea; stored per batch for follow-up.

---

## 2. Suggested Terms (for system and UI)

We need clear, consistent names for **trip-level** vs **batch-level** and for **our status** vs **client actions**.

### Trip-level (existing + alignment)

| Concept | Suggested term | Notes |
|--------|----------------|-------|
| We have received supporting doc (POD verified, etc.) and can use it for billing | **Finance doc received** | Already in use. |
| Trip is computed and ready to be included in a billing batch | **Ready to bill** | Maps to current `BillingStatus.READY_TO_BILL`. |
| Trip is included in our invoice to client | **Invoiced** / **Billed** | Maps to `BillingStatus.BILLED`; we have sent/attached invoice. |
| Client has paid (we have deposited); AR closed for this trip | **Paid** | Maps to `BillingStatus.PAID`. |
| Trip in period but **not** in client’s reverse billing | **Dispute** / **Billing dispute** | Separate handling; we bill/dispute with client. |

So on the **trip**:  
**Doc received** → (included in batch) → **Ready to bill** → (we issue invoice for batch) → **Billed** → (client pays batch) → **Paid**.  
Trips not in client’s list = **Dispute** (we don’t mark as Billed until resolved).

### Batch-level (client cut-off + our invoice + payment)

| Concept | Suggested term | Description |
|--------|----------------|-------------|
| Client’s cut-off period | **Cut-off period** | 1–15 or 16–31 of the month. |
| Client’s list of trips they will pay for this batch | **Reverse billing** (incoming) / **Client remittance advice** / **Client batch confirmation** | Same thing: client’s “we will pay these trips for this period.” |
| Our batch aligned to client (category + cut-off) | **AR batch** / **Client billing batch** | One batch = one client + one service category + one cut-off (1–15 or 16–31). |
| We received client’s reverse billing for this batch | **Client batch confirmed** / **Reverse billing received** | Client has validated which trips are in this payment batch. |
| We created/attached our invoice for this batch | **Invoiced** | We have an **invoice number** and **invoice date**; invoice date starts the 30-day clock. |
| 30 days from invoice date | **Payment due date** (from client) | By this date we expect the Payment List (email). |
| Client sent the Payment List (email) | **Payment list received** / **Remittance advice received** | We record the **payment list received date**. |
| 4 days after payment list | **Check pickup date** | When we can pick up the check. |
| We deposited the check | **Deposited** / **Payment received** | AR for this batch is closed. |

### Clarification: “Doc received” and “Ready to bill”

- **Doc received** = We have the document (e.g. POD verified, finance doc received). This is **trip-level** and already in the system.
- **Ready to bill** = Trip is computed and eligible to be **included in an invoice batch**. So:  
  **Doc received** + (finance computation done) → trip is **Ready to bill**.  
  So “Ready to bill” is the right term for “we have the doc and we’re ready to put this trip into a billing batch.” No change needed for that term.

### When does “Billed” happen?

- **Billed** = We have **issued our Invoice** for the batch that includes this trip. So “reverse billing released by client” is **not** “Billed”; it is **client batch confirmed**.  
- **Billed** = after we attach/issue **our** Invoice (with invoice date). So:  
  **Client batch confirmed** (reverse billing received) → **We create/attach Invoice** → then trip (and batch) become **Billed** (invoice date set, 30-day count starts).

---

## 3. Integration Into What We’re Building

### 3.1 Concepts to add

1. **AR batch (client billing batch)**  
   - One record per: tenant + client + service category + **cut-off period** (e.g. “2026-02-01 to 2026-02-15” or “2026-02-16 to 2026-02-28”).  
   - Holds: reverse billing received date, our invoice number, invoice date, payment list received date, check pickup date, deposited date, status.

2. **Cut-off period**  
   - Stored as period start/end (e.g. 1–15 and 16–end-of-month) or as a single “cut-off identifier” (e.g. `2026-02-1-15`, `2026-02-16-31`).

3. **Trip ↔ AR batch**  
   - Trips are **included** in an AR batch when they fall in that cut-off (runsheet date), belong to that client/category, and are marked “in client’s reverse billing” (or we auto-include and flag disputes).  
   - Option A: Many-to-many (trip can be in one AR batch per category/cut-off).  
   - Option B: A “billing batch” id on trip or TripFinance pointing to the AR batch they’re invoiced in.

4. **Dispute**  
   - Trips in our records for that period/category but **not** in the client’s reverse billing: mark as **dispute** (e.g. `billingDispute: true` or status `IN_DISPUTE`), and handle separately (we bill/dispute with client).

5. **Reverse billing CSV upload**  
   - **Upload CSV** for a given AR batch (client + category + cut-off). Parse rows (trip reference per row, e.g. internal ref or client trip ID).  
   - **Match** each row to our trips → link matched trips to this AR batch (“in reverse billing”).  
   - **Auto-dispute**: our trips in same period/category not in the CSV → set billing dispute.  
   - **Record unmatched**: CSV rows that don’t match any trip → store as “client-listed, no record” (e.g. `ArBatchUnmatchedLine` or `ReverseBillingOrphanLine`) so we can review (not ours vs missed recording).

6. **Client-listed, no record**  
   - Store one record per CSV row that had no matching trip: reference from CSV, AR batch id, uploaded at, optional notes. No link to Trip (we don’t have one). Used for follow-up and reporting.

### 3.2 Suggested data model (summary)

- **ArBatch** (or **ClientBillingBatch**)  
  - `tenantId`, `clientAccountId`, `serviceCategoryId`  
  - `periodStart`, `periodEnd` (e.g. 2026-02-01 to 2026-02-15)  
  - `reverseBillingReceivedAt` (when client sent reverse billing)  
  - `invoiceNumber`, `invoiceDate` (our invoice; invoice date = start of 30-day count)  
  - `paymentListReceivedAt` (when we got the Payment List email)  
  - `checkPickupDate` (payment list date + 4)  
  - `depositedAt` (when we deposited the check)  
  - `status`: e.g. DRAFT | REVERSE_BILLING_RECEIVED | INVOICED | PAYMENT_LIST_RECEIVED | CHECK_PICKED_UP | DEPOSITED  

- **TripFinance** (existing)  
  - Keep `billingStatus`: READY_TO_BILL | BILLED | PAID.  
  - Add optional `arBatchId` (FK to ArBatch) when trip is included in an AR batch.  
  - Add optional `billingDispute` (Boolean) or `billingDisputeReason` for trips not in client’s reverse billing.

- **ArBatchUnmatchedLine** (or **ReverseBillingOrphanLine**) — “Client-listed, no record”  
  - `arBatchId`, `clientProvidedRef` (e.g. trip ref from CSV), `uploadedAt`, `uploadedByUserId`, optional `notes` (e.g. “Not ours” / “To add”).  
  - No `tripId`; we don’t have a matching trip. Used for review and follow-up.

- **Reporting**  
  - AR ledger/aging can use `billingStatus` and, when present, `arBatchId` and `invoiceDate` for aging (e.g. 30 days from invoice date = payment due).

### 3.3 Workflow in the system

1. **Trip level**  
   - POD verified → Finance doc received → Compute → **Ready to bill** (`READY_TO_BILL`).  
   - When we form an AR batch and add trips (that are in client’s reverse billing) and then attach our invoice → set trip to **Billed** (`BILLED`), set `invoiceDate` from batch.  
   - When batch is deposited → set trip to **Paid** (`PAID`).  
   - Trips not in reverse billing → mark as dispute; do not add to AR batch until resolved (or add to a “dispute” batch).

2. **AR batch level**  
   - Create batch: client + category + cut-off (1–15 or 16–31).  
   - **Upload reverse billing CSV** → Parse CSV; match rows to our trips and link to this batch; auto-mark our trips in period not in CSV as dispute; save unmatched rows as “client-listed, no record”. Set batch status to REVERSE_BILLING_RECEIVED.  
   - Finance attaches **our Invoice** → set invoice number + invoice date; status INVOICED; set TripFinance to BILLED for included trips.  
   - Record **Payment list received** → payment list date; compute check pickup = payment list date + 4 days.  
   - Record **check picked up** (optional) and **deposited** → batch status DEPOSITED; set all trips in batch to PAID.

3. **30-day rule**  
   - Payment due date = `invoiceDate + 30 days`.  
   - Use this in AR aging (e.g. “overdue” if today > payment due date and status not yet PAYMENT_LIST_RECEIVED or later).

4. **4-day rule**  
   - Check pickup date = `paymentListReceivedAt + 4 days` (stored or computed).

---

## 4. Summary Table (terms and statuses)

| Step | Suggested term (batch) | Trip-level status | Notes |
|------|------------------------|-------------------|-------|
| We have doc; trip ready for billing | — | **Ready to bill** (READY_TO_BILL) | Already in system. |
| Client sent reverse billing for this cut-off | **Reverse billing received** / **Client batch confirmed** | — | New: AR batch status. |
| We attached our Invoice (invoice date set) | **Invoiced** | **Billed** (BILLED) | Invoice date = start of 30 days. |
| Client sent Payment List (email) | **Payment list received** | — | New: payment list date on batch. |
| 4 days after payment list | **Check pickup date** | — | Stored or computed. |
| We deposited the check | **Deposited** / **Payment received** | **Paid** (PAID) | Close AR for batch/trips. |
| Trip in period but not in client’s list | **Dispute** | **Billing dispute** (flag or status) | Separate process; we bill/dispute. |
| Client listed a trip ref but we have no record | **Client-listed, no record** | — | Stored per batch; we investigate (not ours vs missed recording). |

---

## 5. Next steps (implementation)

1. **Schema**  
   - Add **ArBatch** (or **ClientBillingBatch**) with fields above.  
   - Add **ArBatchTrip** (or link via `TripFinance.arBatchId`) to associate trips to a batch.  
   - Add **billingDispute** (and optional reason) on TripFinance.  
   - Add **ArBatchUnmatchedLine** (client-listed, no record): store CSV rows that didn’t match any trip.

2. **APIs**  
   - CRUD for AR batches (create by client + category + cut-off; update status, invoice details, payment list date, deposited date).  
   - **Upload reverse billing CSV**: accept file + AR batch id; parse; match rows to trips (e.g. by internal ref); link matched trips to batch; auto-mark our trips in period not in CSV as dispute; save unmatched rows to ArBatchUnmatchedLine. Return summary (matched count, dispute count, unmatched count + list).  
   - “Attach invoice”, “Record payment list received”, “Record deposited”.  
   - List trips for a cut-off (by runsheet date) with dispute vs included; list unmatched lines for a batch.

3. **AR reports**  
   - Use `invoiceDate` and batch status for aging (e.g. “Invoiced, payment due in 30 days”, “Overdue”, “Payment list received”, “Deposited”).  
   - Keep existing AR ledger/aging; extend with batch and invoice dates.

4. **UI**  
   - AR batch list and detail (per client, category, cut-off).  
   - **CSV upload** screen: select/create batch, upload file, show result (matched / dispute / unmatched) and list of “client-listed, no record” for follow-up.  
   - Screens to: attach invoice, record payment list, record deposit; and to view/flag disputes and unmatched lines.

---

**Note:** Schema and CSV import APIs are implemented. See `AR_IMPORT_CSV_FORMATS.md` for exact column names and query parameters. Run `npx prisma migrate dev` (or `db push`) to apply schema changes before using the import endpoints.
