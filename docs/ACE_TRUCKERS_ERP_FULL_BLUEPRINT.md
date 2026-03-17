# Ace Truckers Corp ERP — Full Blueprint  
## Complete End-to-End Overview for Reporting

**Document purpose:** This document describes the **entire ERP** for Ace Truckers Corp (Phase 1 — Shopee Express). It is written in business terms so that management and stakeholders can understand what the system does, who uses it, and how the main processes work from start to finish. It is suitable for copying into Word for reporting.

---

## 1. What Is This System?

**Ace Truckers Corp ERP** is a single system that supports the day-to-day operations of Ace Truckers in serving **Shopee Express (SPX)** as a logistics partner. Phase 1 covers:

- **Onboarding and managing** subcontractors (operators), drivers, and vehicles.
- **Planning and dispatching** trips (assigning drivers and vehicles to jobs).
- **Drivers** using a mobile app to accept trips, record events (with photo and location), and submit proof of delivery and reimbursable documents.
- **Operations** verifying proof of delivery and handling incidents.
- **Finance** processing what we owe to operators (payables) and what the client owes us (receivables), including approvals, batching, and reporting.
- **Operators** viewing their trips and payout batches and downloading payslips.
- **Dashboards and reports** for operations and finance.
- **Notifications** (in-app and push) to keep drivers and coordinators informed.

The system does **not** replace human decisions; it records data, enforces rules, and automates steps so that the right people can act at the right time.

---

## 2. Who Uses the System? (Roles)

| Role | Main responsibilities |
|------|------------------------|
| **Super Admin / Admin / Manager** | Full or broad access across the company; can manage users, settings, and critical overrides. |
| **Fleet Acquisition** | Onboard and maintain operators, drivers, and vehicles; manage assignment history and fleet inventory (which vehicles are tagged for which client). Does **not** see full bank details of operators (masked for this role). |
| **Operations Account Coordinator** | Create trips, assign drivers and vehicles, view driver availability, verify or reject proof of delivery, handle incidents, and use “proxy” actions (e.g. submit events or POD on behalf of a driver when needed). Sees the operations dashboard. |
| **Finance Personnel** | Scan trips (e.g. by barcode), mark when finance documents are received, compute trip payouts, manage reimbursables (toll, gas, parking), and prepare payout batches. Does **not** approve batches. |
| **Finance Manager** | First-level approval of payout batches. |
| **CFO** | Final approval of payout batches, approval or rejection of override requests (e.g. past 30-day deadline), and ability to hold or release a batch after approval. |
| **Driver** | Uses the **driver mobile app**: view assigned trips, accept or decline, submit trip events (with photo and time), upload proof of delivery and reimbursable documents, and set availability. |
| **Operator User** | Uses the **operator portal**: view trips and payout batches for their company and download payslip PDFs for approved batches. |

---

## 3. High-Level End-to-End Flow

**From “we have a job” to “everyone is paid”:**

1. **Fleet Acquisition** onboard operators, drivers, and vehicles and keep assignment history and fleet inventory up to date.
2. **Rates** are set per route (origin–destination) and service category, with effective dates. Trip creation checks that a valid rate exists for the trip date.
3. **Operations** create trips (driver + vehicle from same operator), and the **driver** sees the trip in the app and accepts or declines.
4. **Driver** executes the trip: submits events (e.g. arrived, departed) with photo and optional location; uploads proof of delivery (POD) and any reimbursable documents (toll, gas, parking).
5. **Operations** verify or reject POD. If rejected, the driver may re-upload. Finance cannot process the trip until POD is verified.
6. **Finance** marks “document received” when they have the supporting docs, then computes the trip payout (based on rate, category, and reimbursables). Reimbursables can be approved or rejected.
7. **Payout to operators:** Trips are grouped into **payout batches** (by target release date, operator, client). Batches go through Finance Manager approval, then CFO approval. CFO can hold or release. When released, operators can download payslips. Cashbond deductions and override requests (e.g. past 30-day deadline) are part of this process.
8. **Payment from client:** The client (Shopee Express) sends their **reverse billing** (list of trips they will pay **per cut-off** and **per service segment** — or per service category). The three **service segments** are: **FM Oncall** (SPX FM 4W/6WCV/10W Oncall), **FM Wetlease** (SPX FM 4WCV/6WCV Wetlease), **MFM Oncall** (SPX MEGA FM 6W/10W, SPX MFM Shunting 6W). We can upload the list as a CSV: matched trips are attached to our AR batch; our trips not in the list are marked as dispute; client refs we don’t have are recorded for follow-up. We then issue our Invoice (invoice date starts 30-day count), receive Payment List within 30 days, wait 4 days, pick up the check, and deposit. (See the separate Client AR Payment Blueprint and *Batching Segments and Categories* for full detail.)

---

## 4. Module-by-Module (What the System Does)

### 4.1 Fleet Acquisition

**Purpose:** Manage the pool of subcontractors (operators), their drivers and vehicles, and how they are assigned and tagged for the client.

- **Operators** — Company name, contact, tax details, bank details (for payouts), invoice type (e.g. VATable / Non-VATable). Only certain roles see full bank details.
- **Drivers** — Linked to an operator; personal and identification details; can be assigned to trips.
- **Vehicles** — Linked to an operator; plate number and details; must belong to the same operator as the driver when assigned to a trip.
- **Assignment history** — When a driver or vehicle was assigned to which operator, from when to when. Used for correct billing and accountability.
- **Fleet inventory** — Which vehicles are tagged for which client (e.g. Shopee Express) as primary or secondary. Used for planning and compliance.

**Key rule:** When a trip is created, the assigned vehicle must belong to the same operator as the assigned driver.

---

### 4.2 Rates

**Purpose:** Define how much we pay (or bill) per trip, by route and service category.

- **Route rates** — Origin area, destination area, service category, amount, and **effective date range** (from when to when the rate applies).
- **Trip creation** — When a trip is created, the system checks that an active rate exists for the trip date. If the rate is expiring within 7 days, a warning can be shown.
- **Service categories** — The 8 SPX categories (e.g. SPX FM 4W Oncall, SPX FM 6WCV Wetlease, SPX MEGA FM 6W, SPX MFM Shunting 6W). They are grouped into **3 service segments** for client batching: **FM Oncall** (4W, 6WCV, 10W Oncall), **FM Wetlease** (4WCV, 6WCV Wetlease), **MFM Oncall** (MEGA FM 6W/10W, MFM Shunting 6W). Some finance and payout rules depend on category (e.g. wetlease tier, payout terms in business days). See *Batching Segments and Categories* for the full mapping.

---

### 4.3 Operations and Dispatch

**Purpose:** Plan and create trips, use driver availability, and manage the trip lifecycle until proof of delivery is verified.

- **Trips** — Created by Operations: runsheet date, call time, origin/destination, service category, assigned driver and vehicle (same operator), client. Each trip has an internal reference (e.g. for barcode scanning).
- **Driver availability** — Drivers can set their availability (e.g. advance booking, coding day) by date. Operations can view this when planning.
- **Operations dashboard** — Counts and lists for: trips pending driver acceptance, trips with POD pending review, trips with no recent driver update, and open incidents. Filters by date, client, category, operator, driver, area, and status.
- **POD workflow** — See section 4.5.
- **Proxy actions** — If a driver cannot use the app, Operations can perform certain actions on their behalf: submit a trip event, upload POD, upload a reimbursable document, create or update or resolve an incident. These are logged for audit.

---

### 4.4 Driver Mobile App

**Purpose:** Let drivers receive assignments, confirm participation, record what happened on the trip, and submit proof and documents.

- **Login** — Driver logs in with company credentials.
- **Trips** — List of assigned trips; tap to see details. For trips pending acceptance, driver can **Accept** or **Decline**.
- **Trip events** — Driver submits events (e.g. Arrived, Departed, Loading start/done, Unloading start/done) with **photo** and **time** (and optional location). At least one photo per event is required.
- **Proof of delivery (POD)** — Driver takes or selects a photo and uploads it as POD for the trip. Status becomes “pending review” until Operations verify or reject.
- **Reimbursable documents** — Driver can upload documents for Toll, Gas, or Parking. These are linked to the trip and processed by Finance (approve amounts or reject).
- **Availability** — Driver can set availability by date (e.g. available, unavailable, coding day) for advance planning.

---

### 4.5 Proof of Delivery (POD) Workflow

**Purpose:** Ensure we have verified proof of delivery before Finance processes the trip.

- **States:** Not uploaded → Uploaded (pending review) → **Verified** or Rejected (driver may re-upload).
- **Verification** — Operations Account Coordinator verifies or rejects. If rejected, a comment can be added; driver must re-upload.
- **Finance gate** — Finance cannot mark “document received” or compute payout until POD is **Verified**. The system blocks these actions otherwise.
- **Barcode cover sheet** — When POD is verified, the system can generate a barcode cover sheet PDF for filing or scanning.

---

### 4.6 Incidents

**Purpose:** Record and track incidents during a trip (e.g. accident, delay, breakdown) until resolved.

- **Report incident** — Created for a trip; type, severity, and description. Can be created by the driver (via app) or by Operations (proxy).
- **Updates** — Status and comment updates can be added over time (driver or Operations).
- **Resolve** — Incident is marked resolved (with optional replacement trip reference).
- **Close** — Resolved incident can be closed.
- **Media** — Photos can be attached to the incident.
- **Operations** can create, update, and resolve incidents on behalf of the driver (proxy); all actions are audited.

---

### 4.7 Finance — Payables to Operators (We Pay Subcontractors)

**Purpose:** From verified trip and documents to paying the operator: compute amounts, handle reimbursables, form payout batches, get approvals, and release (or hold) payment. Includes cashbond and override rules.

**Steps:**

1. **Document received** — Finance confirms they have the supporting document (e.g. verified POD and runsheet). Trip is then eligible for finance computation.
2. **Compute** — System calculates trip payout using the active route rate, service category (e.g. wetlease tier for first vs rest trip), operator invoice type (VATable/Non-VATable), admin fee, and reimbursables. **Payout due date** is set using business-day rules: document submission (e.g. Mon/Tue), cycle start (Wednesday), then add N business days (N depends on service category — e.g. 3, 8, or 13 days).
3. **Reimbursables** — Finance can set toll, gas, and parking amounts and set status (e.g. submitted to client, approved, rejected). Approved amount is included in payout; rejected is not.
4. **Payout batch** — Trips are grouped into a **batch** for a specific **target release date**, per operator and client. Only trips whose computed “release date” matches that target can be included. If an eligible trip is **not** included, a **reason must be given** (e.g. on hold for dispute).
5. **Approvals** — Finance Manager approves first; then CFO approves. After CFO approval, a **payslip PDF** can be generated for that batch.
6. **Hold / Release** — Even after CFO approval, payout can be **held**. When we are ready, we **release** the batch (release date is recorded). Operators can download the payslip only after CFO approval (and typically after release, per policy).
7. **Cashbond** — A fixed amount per driver per batch can be deducted (e.g. ₱500 per driver, capped at ₱50,000 total). Reimbursement-only trips may be excluded from cashbond logic.
8. **Override request** — If a trip would otherwise be blocked (e.g. past 30-day subcontractor invoice deadline), the Finance team can submit an **override request**. CFO can approve or reject with a reason.
9. **Operator portal** — Operator users can see their trips and payout batches and **download the payslip PDF** for batches that are CFO-approved (and released, if that is your policy).

**Payout terms by category (example):** Different service categories have different “N” business days (e.g. 3, 8, or 13) from the cycle start Wednesday. This defines when a trip is **eligible for release** on a given target date. One batch can contain trips from categories with different N, as long as their release target date is the same.

---

### 4.8 Finance — Receivables from Client (Client Pays Us)

**Purpose:** From our records and documents to receiving payment from Shopee Express: align with the client’s cut-off and reverse billing, record disputes and mismatches, issue our invoice, and track payment list and deposit.

**Summary of flow:**

1. **Document received** — We have the supporting document (e.g. POD verified); trip is **ready to bill**.
2. **Reverse billing** — Client sends their list of trips they will pay for a batch (per service category and **cut-off**: 1–15 or 16–31 of the month).
3. **CSV upload** — We can upload the client’s list (CSV). The system:
   - **Matches** each row to our trips and attaches matched trips to the correct **AR batch** (client + category + cut-off).
   - **Auto-dispute** — Our trips in that period/category that are **not** in the list are marked as **dispute** (we follow up separately).
   - **Client-listed, no record** — Rows that do not match any of our trips are **recorded** (e.g. trip not ours or we missed recording); we keep this list for follow-up.
4. **Our invoice** — For that batch we create/attach **our Invoice** (invoice number and **invoice date**). The **invoice date** is the **start of the 30-day period** for the client to send the Payment List.
5. **Payment list** — Client sends the Payment List (e.g. by email) within 30 days. We record the **date received**.
6. **4 days** — We wait 4 days from that date, then we can pick up the check.
7. **Deposit** — We deposit the check and close AR for that batch.

**AR/AP reports:** The system can produce **AR (receivables)** and **AP (payables)** reports: ledger by trip with amounts and **aging** (e.g. 0–30, 31–60, 61–90, 90+ days). AR uses billing status and invoice date; AP uses payout status and payout due date.

*Full detail (terms, roles, 30-day and 4-day rules, dispute and client-listed-no-record) is in the separate **Client AR Payment Blueprint** document.*

---

### 4.9 Notifications

**Purpose:** Keep drivers and coordinators informed and remind them of actions.

- **In-app notifications** — Users see a list of notifications (e.g. trip assigned, POD status, incident alert).
- **Push notifications** — Drivers (and optionally others) can register their device; the system sends push notifications (e.g. new trip, reminder to accept, call time reminder). Device registration and removal are supported.
- **Scheduled reminders** — Hourly jobs can send reminders (e.g. trips not yet accepted, call time approaching) so coordinators or drivers can act in time.

---

### 4.10 Operator Portal

**Purpose:** Give operator users visibility into their company’s activity and payouts.

- **Trips** — List of trips for their operator (filtered by their company).
- **Payout batches** — List of payout batches for their operator; view batch details.
- **Payslip** — Download the payslip PDF for a batch once it is CFO-approved (and released, as per policy). Only batches belonging to their operator are visible.

---

### 4.11 Dashboards and Reports

**Operations dashboard** — Counts and lists for: trips pending acceptance, POD pending review, trips with no recent update, finance doc received, and open incidents. Filters by date, client, category, operator, driver, area, and status.

**Finance dashboard** — Counts and lists for: POD verified but doc not yet received, doc received but not computed, billing and payout pipeline (ready to bill, billed, paid; ready for payout, in batch, approved, released, paid), reimbursables pending approval, override requests pending, and subcontractor deadline (e.g. expiring soon or expired). Filters by client, category, operator, date, and status.

**AR report** — Receivables from client: trips ready to bill or billed, with amounts and aging (0–30, 31–60, 61–90, 90+ days). Filter by client, category, date.

**AP report** — Payables to operators: trips not yet paid, with amounts and aging by payout due date. Filter by operator, client, category, date.

---

### 4.12 File Upload and Download

**Purpose:** Store and retrieve documents (POD, event photos, reimbursables, payslips, etc.) in a consistent way.

- **Upload** — User uploads a file (e.g. image or PDF); the system stores it and returns a reference (file key). That key is used when submitting POD, trip events, or reimbursable documents.
- **Download** — Authorized users can download a file by type and filename (e.g. for POD verification or operator payslip).

---

### 4.13 Audit Log

**Purpose:** Keep a record of sensitive actions for accountability and compliance.

- **Logged actions** — Examples: trip create, finance document received, finance compute, incident create/resolve, payout approvals, override approve/reject, and other critical changes. Who did what and when (and optionally what changed) is stored and can be listed with filters.

---

## 5. Key Business Rules (Summary)

- **Same-operator rule** — For a trip, the assigned vehicle must belong to the same operator as the assigned driver.
- **Rate required** — A trip cannot be created without an active route rate for the trip date; a warning can be shown if the rate is expiring within 7 days.
- **POD gate** — Finance cannot mark document received or compute payout until POD is verified.
- **Payout batch** — Only trips eligible for a given **target release date** (based on document received date, cycle start, and payout terms in business days) can be included in a batch for that date. Eligible trips not included must have a reason.
- **Approval chain** — Payout batch: Finance Manager then CFO. Override requests: CFO only.
- **Hold/release** — CFO can hold a batch after approval; release is a separate step and can set the “released at” date.
- **Client AR** — Invoice date starts the 30-day period for Payment List; 4 days after Payment List received we can pick up the check. Reverse billing CSV drives matching, dispute, and client-listed-no-record.

---

## 6. How the Pieces Fit Together (One-Page Picture)

| Stage | Who | What |
|-------|-----|------|
| **Setup** | Fleet Acquisition | Operators, drivers, vehicles, assignments, fleet inventory. |
| **Rates** | Admin/Manager | Route rates by category and effective dates. |
| **Plan** | Operations | View driver availability; create trips (driver + vehicle, same operator). |
| **Execute** | Driver (app) | Accept/decline; submit events (with photo); upload POD and reimbursables. |
| **Verify** | Operations | Verify or reject POD; handle incidents (and proxy actions if needed). |
| **Finance (us → operators)** | Finance | Doc received → Compute → Reimbursables → Payout batch → Approvals → Hold/Release → Payslip; cashbond and override. |
| **Finance (client → us)** | Finance | Doc received → Reverse billing (CSV: match, dispute, client-listed no record) → Our invoice → Payment list (30 days) → +4 days → Check pickup → Deposit. |
| **See results** | Operator | Portal: trips, batches, download payslip. |
| **Monitor** | Operations / Finance | Dashboards and AR/AP reports. |
| **Stay informed** | All | Notifications (in-app and push) and reminders. |

---

## 7. Related Documents

- **Batching Segments and Categories** — Defines the three **service segments** (FM Oncall, FM Wetlease, MFM Oncall) and which of the 8 **service categories** belong to each; cut-off + segment + category hierarchy for client payment batching.
- **Client AR Payment Blueprint** — Detailed description of the client payment (AR) process: cut-off, segment/category, reverse billing, CSV upload, dispute, client-listed no record, invoice date, 30 days, payment list, 4 days, deposit. Use for reporting and process alignment.
- **Payout Schedule Understanding** — Detailed rules for payout terms by category, cycle start (Wednesday), target release date, and batching. Use for finance and operations alignment.

---

*End of full ERP blueprint. This document is for reporting and stakeholder alignment. It reflects the current agreed scope and process for Ace Truckers Corp ERP Phase 1 (Shopee Express).*
