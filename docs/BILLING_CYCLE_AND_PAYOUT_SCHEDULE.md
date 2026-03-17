# Billing Cycle & Payout Schedule — Reference for Review

This document lists the **client account**, **service categories**, and **billing cycle config** stored in the system, and clarifies how **payout due date** and **submission date** are used.

---

## 1. Did you provide a “schedule date to release payout based on submission date”?

**Short answer:** The schema and seed contain **submission day** and **cycle start day** (e.g. Tuesday / Wednesday), but the application **does not** currently compute a “payout release date” from the submission date.

**What is implemented today:**

| Concept | Where it lives | How it’s used |
|--------|----------------|----------------|
| **Doc submission day** | `ClientServiceConfig.docSubmissionDay` (e.g. `"Tuesday"`) | Stored only; **not** used to compute payout date. |
| **Cycle start day** | `ClientServiceConfig.cycleStartDay` (e.g. `"Wednesday"`) | Stored only; **not** used to compute payout date. |
| **Payout due date** | `TripFinance.payoutDueDate` | **Computed when Finance marks “doc received”:**  
  `payoutDueDate = doc received date + payoutTermsBusinessDays` (business days, optionally excluding weekends). |

So:

- **Payout due** is driven by **when Finance marks the document as received** (and the config’s `payoutTermsBusinessDays` + `excludeWeekends`), not by the calendar “submission Tuesday” or “cycle start Wednesday.”
- There is **no** formula in code that says: “submission date = Tuesday → payout release date = &lt;some fixed schedule&gt;.”

If you want a **fixed schedule** (e.g. “submission Tuesday → payout release every Wednesday + N business days”), that would require an additional rule and/or field (e.g. “payout release date” derived from submission/cycle).

---

## 2. List of client account, service categories, and billing cycle config

Below is the list as defined in the **seed** (and schema). Each **service category** has one **ClientServiceConfig** (per client + category). Use this to review and verify.

### Client account

| Client code | Client name   | Notes        |
|-------------|---------------|--------------|
| **SPX**     | Shopee Express | Single client in seed |

---

### Service categories and billing cycle (seed values)

| # | Service category name      | Category code             | Segment type  | Doc submission day | Cycle start day | Payout terms (business days) | Exclude weekends | Subcon invoice deadline (days) | Call time grace (min) |
|---|----------------------------|----------------------------|--------------|--------------------|-----------------|------------------------------|-------------------|---------------------------------|------------------------|
| 1 | SPX FM 4W Oncall           | SPX_FM_4W_ONCALL           | FM           | Tuesday            | Wednesday       | 3                            | Yes               | 30                              | 15                     |
| 2 | SPX FM 6WCV Oncall         | SPX_FM_6WCV_ONCALL         | FM           | Tuesday            | Wednesday       | 3                            | Yes               | 30                              | 15                     |
| 3 | SPX FM 10W Oncall         | SPX_FM_10W_ONCALL         | FM           | Tuesday            | Wednesday       | 3                            | Yes               | 30                              | 15                     |
| 4 | SPX FM 4WCV Wetlease      | SPX_FM_4WCV_WETLEASE      | FM           | Tuesday            | Wednesday       | 3                            | Yes               | 30                              | 15                     |
| 5 | SPX FM 6WCV Wetlease      | SPX_FM_6WCV_WETLEASE      | FM           | Tuesday            | Wednesday       | 3                            | Yes               | 30                              | 15                     |
| 6 | SPX MEGA FM 6W            | SPX_MEGA_FM_6W            | MEGA_FM      | Tuesday            | Wednesday       | 3                            | Yes               | 30                              | 15                     |
| 7 | SPX MEGA FM 10W           | SPX_MEGA_FM_10W           | MEGA_FM      | Tuesday            | Wednesday       | 3                            | Yes               | 30                              | 15                     |
| 8 | SPX MFM Shunting 6W       | SPX_MFM_SHUNTING_6W       | MFM_SHUNTING | Tuesday            | Wednesday       | 3                            | Yes               | 30                              | 15                     |

**Notes on columns:**

- **Doc submission day** – Day of week when documents are submitted (stored; not used for payout date in code).
- **Cycle start day** – Day when the billing cycle starts (stored; not used for payout date in code).
- **Payout terms (business days)** – Number of business days **after the doc-received date** used to compute `payoutDueDate` when Finance marks “doc received.”
- **Exclude weekends** – If Yes, “business days” skip Saturday and Sunday when computing `payoutDueDate`.
- **Subcon invoice deadline (days)** – Used for 30-day rule: trip past deadline cannot be included in a payout batch unless an override is approved.
- **Call time grace (min)** – Used in operations (e.g. call-time reminders), not in payout schedule.

---

## 3. Schema reference (where these live)

- **ClientAccount** – `code`, `name` (e.g. SPX, Shopee Express).
- **ServiceCategory** – `name`, `code`, `segmentType` (FM, MEGA_FM, MFM_SHUNTING); belongs to one client.
- **ClientServiceConfig** – one per (client, service category):
  - `docSubmissionDay` (e.g. `"Tuesday"`)
  - `cycleStartDay` (e.g. `"Wednesday"`)
  - `payoutTermsBusinessDays` (e.g. `3`)
  - `excludeWeekends` (e.g. `true`)
  - `subcontractorInvoiceDeadlineDays` (e.g. `30`)
  - `callTimeGraceMinutes` (e.g. `15`)

---

## 4. Summary for verification

- **Document receipt logic** is unchanged: scan barcode → mark doc received (per trip) → create payout batch later for operator + period.
- **Payout due date** = date Finance marks “doc received” **+** `payoutTermsBusinessDays` business days (weekends excluded if `excludeWeekends` is true). No “submission date → release date” schedule is implemented.
- **Account/category and billing cycle** are as in the table above (one config per SPX category, same values in seed). Adjust the seed or add an API to change per-category values as needed.

If you want to add a **scheduled payout release date based on submission date** (e.g. “every Wednesday after submission Tuesday”), that can be designed as a separate rule and documented here once agreed.
