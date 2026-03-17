# Blueprint Verification: Ace Truckers Corp ERP SaaS Phase 1 (Shopee Express) v2

This document verifies the current codebase against the **exact** Phase 1 Consolidated Blueprint you provided. Items are marked as **Done**, **Partial**, or **Gap**.

---

## 1) Overview & Phase 1 Scope

| Blueprint item | Status | Notes |
|----------------|--------|--------|
| Client: Shopee Express (SPX) only | **Done** | Seed + schema support single client; SPX account and 8 categories seeded |
| Auth + RBAC + Audit Logs | **Done** | JWT auth, RolesGuard, AuditService + GET /audit-logs, logging on POD verify/reject and rate create |
| Fleet Acquisition (operators/drivers/vehicles/docs/assignment history) | **Done** | CRUD + assignments on create; driver/vehicle docs in schema |
| Operator–Driver–Vehicle assignment history + fleet inventory tagging | **Partial** | Assignment history done; fleet_inventory table exists but **no API** for tagging (PRIMARY/SECONDARY, effective dates) |
| Operations Dispatch + Trip Monitoring | **Done** | Create trip, operator enforcement, get trips, verify/reject POD |
| Driver Android App (installable, offline, GPS+photo, acceptance, reminders) | **Gap** | Not implemented in repo (mobile/ placeholder or missing) |
| POD workflow (upload → verify/reject → verified gate) | **Done** | POD status flow + Finance gate (scan/mark doc only when POD_VERIFIED) |
| Rates Directory (origin/dest, effective dates, wetlease tiers, bill/pay) | **Partial** | Route rates CRUD + effective dates + runsheet_date matching **done**; **wetlease tier override not implemented** (see §10) |
| Finance (scan, doc received, computation, AR/AP ledgers) | **Partial** | Scan, mark doc received, compute from rate, batch create **done**; **computation formula and invoice-type logic differ from blueprint** (see §11); **no AR/AP ledger APIs or aging** |
| Payout batching + approvals (Fin Mgr, CFO) + payslips after CFO approval | **Partial** | Batch create, Fin Mgr/CFO approve **done**; **payslip generation/download not implemented**; **RELEASED/PAID** not used |
| Incident Reporting (driver + coordinator + finance visibility) | **Done** | Create, updates, resolve, close, media; Finance roles can view |
| Dashboards (Operations + Finance, KPIs, aging, compliance, incidents) | **Gap** | Web has placeholder pages (dispatch, finance, etc.); **no KPI widgets, filters, or dashboard APIs per blueprint** |

---

## 2) Roles and Permissions (RBAC)

| Blueprint role | In schema? | API usage | Gaps |
|----------------|------------|-----------|------|
| Super Admin | Yes | All endpoints | None |
| Admin / Manager | Yes | Same as Super Admin | Blueprint: “Update operator invoice type” — **no dedicated PATCH operator (invoice type only)** restricted to Admin/Manager; Fleet Acquisition can set on create only |
| Fleet Acquisition Team | Yes | Operators, drivers, vehicles only | **No explicit “must not access dispatch”** — enforced only by not granting dispatch roles |
| Operations Account Coordinator | Yes | Dispatch, POD, incidents | None |
| Finance Personnel | Yes | Finance scan, doc received, compute, batches, view incidents | None |
| Finance Manager | Yes | + approve batch (Level 1) | None |
| CFO | Yes | + approve batch (final), approve/reject override | **Override request submit/approve/reject API not implemented** |
| Driver | Yes | Incidents, trip list (implied) | **No driver-scoped trip/assignment APIs** (e.g. “my trips”, accept/decline) in API; Android app not built |
| Operator User | Yes | **Not used in any controller** | **Gap:** No operator-scoped endpoints (fleet, trip status, payout batch status, payslip download) |

---

## 3) SPX Service Categories and Segments

| Blueprint item | Status | Notes |
|----------------|--------|--------|
| Client: Shopee Express (SPX) | **Done** | Seed creates SPX |
| 8 categories (FM 4W/6WCV/10W Oncall, 4WCV/6WCV Wetlease, MEGA FM 6W/10W, MFM Shunting 6W) | **Done** | Seed matches names and segment types |
| Segment fields (AB status, runsheet date, vehicle type, driver, plate, route code, trip order, call time, stops, POD) | **Partial** | Trip has all fields; **stops/events/documents** exist in schema but **trip creation does not create stops**; POD = document upload + verify/reject |
| Wetlease tier (4WCV: 2550/1840, 6WCV: 3600/2520 by trip_order) | **Gap** | **Not implemented**; computation uses route rate only |

---

## 4) Core Data Model (PostgreSQL)

| Blueprint area | Status | Notes |
|----------------|--------|--------|
| Tenancy (tenant_id on tables) | **Done** | Prisma schema |
| Operators (identity, contacts, bank, invoice_type, status) | **Done** | |
| Drivers (SPX driver id, name, contact, status) + driver_documents | **Done** | |
| Vehicles (plate unique, type, body, status) + vehicle_documents | **Done** | |
| driver_operator_assignments / vehicle_operator_assignments (start/end) | **Done** | |
| fleet_inventory (client, vehicle, PRIMARY/SECONDARY, effective dates) | **Partial** | Table exists; **no CRUD or tagging API** |
| service_categories + client_service_configs (payout terms, doc day, cycle day, exclude weekends, 30-day deadline, call time grace) | **Partial** | Schema has config; **single config per client** (clientAccountId @unique) — blueprint implies **per (client, service_category)**; no business-day or payout-due-date computation in code |
| Trips (all listed fields including operator_id_at_assignment) | **Done** | |
| trip_stops, trip_events, trip_event_media, trip_documents | **Done** in schema | **Stops/events not created by dispatch**; documents linked to POD workflow |

---

## 5) POD/Runsheet Workflow

| Blueprint item | Status | Notes |
|----------------|--------|--------|
| States: POD_NOT_UPLOADED → POD_UPLOADED_PENDING_REVIEW → POD_VERIFIED or POD_REJECTED_NEEDS_REUPLOAD | **Done** | Schema + verify/reject in DispatchService |
| pod_last_reviewed_by, pod_last_reviewed_at, pod_rejection_comment | **Done** | |
| Finance gate: only POD_VERIFIED for doc received / computation | **Done** | Enforced in FinanceService |

---

## 6) Barcode Cover Sheet PDF

| Blueprint item | Status | Notes |
|----------------|--------|--------|
| Generate only when POD_VERIFIED | **Gap** | **Not implemented** — only `// TODO` in dispatch.service |
| Content: Code128 internal_ref, trip summary | **Gap** | |
| Store as trip_documents BARCODE_COVER_SHEET | **Gap** | |

---

## 7) Incident Reporting

| Blueprint item | Status | Notes |
|----------------|--------|--------|
| trip_incidents (all fields including replacement_trip_id) | **Done** | |
| trip_incident_media, trip_incident_updates | **Done** | |
| Driver creates (description + ≥1 photo, GPS, OPEN); notify coordinator | **Partial** | Create + media API **done**; **no FCM/notification send** |
| Coordinator acknowledges/resolves; can link replacement trip; CLOSED | **Done** | Resolve + close + replacementTripId |
| Finance can view | **Done** | Roles on GET incidents |

---

## 8) Notification System

| Blueprint item | Status | Notes |
|----------------|--------|--------|
| FCM + in-app list; no SMS | **Gap** | **NotificationsModule is empty**; no FCM, no notification types, no storage usage |
| Types (TRIP_ASSIGNED, reminders, POD, incident, etc.) | **Gap** | Schema has enum; no sending logic |
| Hourly acceptance reminders (no expiration) | **Gap** | |
| Call-time-based reminders (call_time − 3h, hourly, coordinator escalation) | **Gap** | |
| notifications table (user_id, type, title, body, payload_json, status, read_at) | **Done** in schema | No API to create/list/read |

---

## 9) Driver Android App

| Blueprint item | Status | Notes |
|----------------|--------|--------|
| Installable, offline-first, GPS+timestamp+photo, sync on reconnect | **Gap** | Not in repo / not implemented |
| Accept/Decline trip; stops (Arrived/Departed); incident; POD upload; history (POD status, Finance Doc Received, no amounts) | **Gap** | No driver-specific API (e.g. accept/decline, “my trips”) |

---

## 10) Rates Module

| Blueprint item | Status | Notes |
|----------------|--------|--------|
| route_rates (client, service_category, origin, destination, effective_start, effective_end, bill_rate, trip_payout_rate_vatable) | **Done** | |
| Match by client + category + origin + destination; trip date = runsheet_date; effective_end | **Done** | getActiveRateForTrip used in finance compute |
| **Wetlease tier override** (4WCV: 2550/1840, 6WCV: 3600/2520 by trip_order) | **Gap** | **Not implemented**; finance uses directory rate only |
| Effective end: block trip creation if rate expired unless Admin override; alerts for rates ending soon | **Gap** | No check on trip create; no alerts |

---

## 11) Finance Processing, Computation, AR/AP

| Blueprint item | Status | Notes |
|----------------|--------|--------|
| Finance gate (POD_VERIFIED, finance_doc_received_at) | **Done** | |
| trip_finance snapshot + billing/payout ledger fields | **Partial** | Snapshot and payout status **done**; **billing ledger/AR not exposed** |
| **Payout computation formula** | **Partial** | **Differs from blueprint:** |
| | | Blueprint: **Non-Vat Base = Vatable ÷ 1.12**; **Admin Fee = 2% of Vatable Base**; **payout_base by invoice type** (VATABLE = Vatable Base; NON_VATABLE = Non-Vat Base; NO_OR = formula with 12% and 2% withholding); **net_trip_payout_before_reimb = payout_base − admin_fee**. |
| | | Current: **adminFee = billRate − payoutRate** (margin); **payoutBase = tripPayoutRateVatable**; **no invoice_type** or nonVatBaseRate/NO_OR logic; **netTripPayoutBeforeReimb = payoutRate** (no admin deduction in current formula). |
| Reimbursables (toll/gas/parking, status DRAFT→SUBMITTED→APPROVED/REJECTED; only APPROVED in batch) | **Gap** | Schema has fields; **no API to encode or update reimbursable status**; batch uses approvedReimbursableAmount but it’s never set by workflow |
| AR: READY_TO_BILL → BILLED → PAID; aging | **Gap** | Schema only; no APIs or reports |
| AP: READY_FOR_PAYOUT → IN_BATCH → … → PAID; due date from business-day logic | **Partial** | Status flow and batch **done**; **payoutDueDate not computed**; RELEASED/PAID not used in flow |

---

## 12) Weekly Cycle and Business-Day Computation

| Blueprint item | Status | Notes |
|----------------|--------|--------|
| Submission Tuesday; cycle start Wednesday; exclude weekends; add_business_days | **Gap** | **No business-day function or payout-due-date computation**; config fields exist in schema only |
| Payout due from payout_terms_business_days in client_service_configs | **Gap** | |

---

## 13) Subcontractor Invoice Deadline (30 Days) + Override

| Blueprint item | Status | Notes |
|----------------|--------|--------|
| deadline = base_date + 30 days; block payout if past deadline without invoice | **Gap** | **Not implemented**; overrideExpiredDeadline/overrideRequestId in schema unused |
| Admin/Manager submits override; CFO approves/rejects | **Gap** | **PayoutOverrideRequest** in schema; **no submit/approve/reject API** |

---

## 14) Cashbond (₱500 per driver per batch, cap ₱50,000)

| Blueprint item | Status | Notes |
|----------------|--------|--------|
| driver_cashbond_accounts, driver_cashbond_ledger | **Done** in schema | |
| Deduct ₱500 per driver per batch when balance < 50k and batch has trip payout; stop at cap; no deduction for reimbursement-only | **Gap** | **No cashbond logic in createPayoutBatch or elsewhere**; totalCashbondDeduction on batch never set |

---

## 15) Payout Batches, Approvals, Payslips

| Blueprint item | Status | Notes |
|----------------|--------|--------|
| payout_batches (operator, client, period, status, totals) | **Done** | |
| payout_batch_trips (snapshot fields) | **Done** | |
| Fin Mgr approve (Level 1), CFO approve (final) | **Done** | |
| **Payslip generated after CFO approval**; operator can view/download | **Gap** | **payslipFileKey** exists but **no generation or download API**; **OPERATOR_USER** has no batch/payslip endpoints |

---

## 16) Barcode Scanning (Finance)

| Blueprint item | Status | Notes |
|----------------|--------|--------|
| Code128 = internal_ref; scan or manual input | **Partial** | **GET /finance/trips/scan/:internalRef** supports manual/internal ref; no physical scanner integration (expected on client) |

---

## 17) Dashboards and KPIs

| Blueprint item | Status | Notes |
|----------------|--------|--------|
| Operations: filters (account, category, operator, driver, date, status, incident, areas); widgets (pending acceptance, POD states, call-time reminders, incidents, fleet availability) | **Gap** | **No dashboard API or KPI aggregation**; web has placeholder pages only |
| Operations KPIs: on-time pickup, waiting time, late hotspots, POD compliance, incident frequency/resolution | **Gap** | |
| Finance: filters; widgets (POD verified not doc received, not computed, AR/AP aging, reimbursables, invoice compliance, overrides, incidents) | **Gap** | |
| Finance KPIs / aging | **Gap** | |

---

## 18) Audit Logs and Security

| Blueprint item | Status | Notes |
|----------------|--------|--------|
| Log sensitive reads/changes (rates, invoice type, assignments, POD, finance, overrides, approvals, incidents) | **Partial** | **Done:** POD verify/reject, route rate create. **Not done:** operator invoice type change, trip assign, finance doc received, compute, overrides, approvals, incident actions |
| Storage (signed URLs); RBAC server-side; field-level masking | **Partial** | RBAC **done**; **no signed URL or document storage implementation**; **no bank-detail masking** (schema has bank fields, no masking in API responses) |
| Timezone Asia/Manila | **Partial** | **.env.example has TZ=Asia/Manila**; no scheduling/business-day logic in code |

---

## 19) Build Order (Implementation Plan)

Blueprint order: (1) Auth+RBAC+audit, (2) Fleet Acquisition, (3) Dispatch, (4) Driver app, (5) POD+barcode, (6) Notifications, (7) Rates, (8) Finance, (9) Ledgers+batches+approvals+payslips, (10) Dashboards.

**Current state:** 1–3 largely done; 5 (POD) done except barcode PDF; 7 (Rates) done except wetlease tier; 8–9 partially done (finance compute formula and features differ); 4, 6, 10 and several 11–18 items are gaps.

---

## Summary: Aligned vs Gaps

**Aligned with blueprint (in whole or large part):**  
Auth, RBAC roles in schema and on endpoints, audit logging (foundation + some events), Fleet Acquisition (operators/drivers/vehicles/assignments), Dispatch (trip create, operator enforcement, POD verify/reject), POD state machine and Finance gate, Rates directory and effective-date matching, Incident reporting API, Finance scan + mark doc received + compute from rate + payout batch create + Fin Mgr/CFO approval, SPX seed (8 categories), data model (tenancy, operators, drivers, vehicles, assignments, trips, finance, batches, incidents, audit, notifications table).

**Gaps / not implemented:**

1. **Rates:** Wetlease tier override (4WCV/6WCV 2550/1840, 3600/2520 by trip_order); rate-expiry check on trip create; alerts for rates ending soon.
2. **Finance computation:** Exact formula (Non-Vat = Vatable/1.12, Admin Fee = 2%, payout_base by invoice type VATABLE/NON_VATABLE/NO_OR, net = payout_base − admin_fee); reimbursables encode + status workflow; AR/AP ledgers and aging.
3. **Barcode cover sheet:** PDF generation and storage as BARCODE_COVER_SHEET.
4. **Notifications:** FCM, in-app list, all notification types, hourly/call-time reminder logic, coordinator escalation.
5. **Driver Android app:** Full app (offline, accept/decline, events, POD, incidents, history); driver-scoped APIs.
6. **Operator User:** Operator-scoped trips, batch status, payslip download.
7. **Payout:** Cashbond deduction (₱500/driver/batch, cap 50k); payslip generation + download; RELEASED/PAID flow.
8. **Override:** 30-day deadline check; PayoutOverrideRequest submit/approve/reject (Admin/Manager + CFO).
9. **Business rules:** add_business_days; payout due date from config; timezone Asia/Manila in scheduling.
10. **Fleet inventory:** API for tagging (PRIMARY/SECONDARY, effective dates).
11. **Admin/Manager:** Dedicated PATCH for operator invoice type only (and restrict to Admin/Manager).
12. **Dashboards:** Operations and Finance dashboard APIs and KPIs as in blueprint.
13. **Audit:** Extend to invoice type, assignments, finance doc received, compute, overrides, approvals, incident actions.
14. **Storage & masking:** Signed URLs for documents; bank-detail masking in API responses.

If you want to prioritize, the blueprint’s build order and “Finance processing” section suggest fixing **finance computation formula + invoice type**, **wetlease tier**, **cashbond**, **override request API**, and **payslip** next, then **barcode PDF**, **notifications**, and **dashboards**.
