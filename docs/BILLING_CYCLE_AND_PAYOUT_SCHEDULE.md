# Billing Cycle & Payout Schedule — Reference for Review

This document lists the **client account**, **service categories**, and **billing cycle config** stored in the system, and clarifies how **payout due date** and **submission date** are used.

---

## 1. Did you provide a “schedule date to release payout based on submission date”?

**Short answer:** The schema and seed contain **submission day** and **cycle start day** (e.g. Tuesday / Wednesday), but the application **does not** currently compute a “payout release date” from the submission date.

**What is implemented today:**

| Concept | Where it lives | How it’s used |
|--------|----------------|----------------|
| **Doc submission day** | `ServiceCategory.docSubmissionDay` (e.g. `"Tuesday"`) | Stored only; **not** used to compute payout date. |
| **Cycle start day** | `ServiceCategory.cycleStartDay` (e.g. `"Wednesday"`) | Stored only; **not** used to compute payout date. |
| **Payout due date** | `TripFinance.payoutDueDate` | **Computed when Finance marks “doc received”:**  
  `payoutDueDate = doc received date + payoutTermsBusinessDays` (business days, optionally excluding weekends). |

So:

- **Payout due** is driven by **when Finance marks the document as received** (and the config’s `payoutTermsBusinessDays` + `excludeWeekends`), not by the calendar “submission Tuesday” or “cycle start Wednesday.”
- There is **no** formula in code that says: “submission date = Tuesday → payout release date = &lt;some fixed schedule&gt;.”

If you want a **fixed schedule** (e.g. “submission Tuesday → payout release every Wednesday + N business days”), that would require an additional rule and/or field (e.g. “payout release date” derived from submission/cycle).

---

## 2. List of client account, service categories, and billing cycle config

Below is the list as defined in the **seed** (and schema). The billing cycle rules are fields **on the service category itself** (the old `ClientServiceConfig` table was merged into `ServiceCategory`), and can be edited per category via `PATCH /master-data/categories/:categoryId`.

### Client

| Client code | Client name   | Notes        |
|-------------|---------------|--------------|
| **SPX**     | Shopee Express | Seeded client; add more via `POST /master-data/clients` |

---

### Service categories and billing cycle (seed values)

| # | Service category name      | Category code             | Segment      | Doc submission day | Cycle start day | Payout terms (business days) | Exclude weekends | Subcon invoice deadline (days) | Call time grace (min) | First trip only payout |
|---|----------------------------|----------------------------|--------------|--------------------|-----------------|------------------------------|-------------------|---------------------------------|------------------------|------------------------|
| 1 | SPX FM 4W Oncall           | SPX_FM_4W_ONCALL           | FM_ONCALL    | Tuesday            | Wednesday       | 13                           | Yes               | 30                              | 15                     | No                     |
| 2 | SPX FM 6WCV Oncall         | SPX_FM_6WCV_ONCALL         | FM_ONCALL    | Tuesday            | Wednesday       | 8                            | Yes               | 30                              | 15                     | No                     |
| 3 | SPX FM 10W Oncall          | SPX_FM_10W_ONCALL          | FM_ONCALL    | Tuesday            | Wednesday       | 8                            | Yes               | 30                              | 15                     | No                     |
| 4 | SPX FM 4WCV Wetlease       | SPX_FM_4WCV_WETLEASE       | FM_WETLEASE  | Tuesday            | Wednesday       | 13                           | Yes               | 30                              | 15                     | Yes                    |
| 5 | SPX FM 6WCV Wetlease       | SPX_FM_6WCV_WETLEASE       | FM_WETLEASE  | Tuesday            | Wednesday       | 8                            | Yes               | 30                              | 15                     | Yes                    |
| 6 | SPX MEGA FM 6W             | SPX_MEGA_FM_6W             | MFM_ONCALL   | Tuesday            | Wednesday       | 3                            | Yes               | 30                              | 15                     | No                     |
| 7 | SPX MEGA FM 10W            | SPX_MEGA_FM_10W            | MFM_ONCALL   | Tuesday            | Wednesday       | 3                            | Yes               | 30                              | 15                     | No                     |
| 8 | SPX MFM Shunting 6W        | SPX_MFM_SHUNTING_6W        | MFM_ONCALL   | Tuesday            | Wednesday       | 3                            | Yes               | 30                              | 15                     | No                     |

**Notes on columns:**

- **Doc submission day** – Day of week when documents are submitted (stored; not used for payout date in code).
- **Cycle start day** – Day when the billing cycle starts (stored; not used for payout date in code).
- **Payout terms (business days)** – Number of business days **after the doc-received date** used to compute `payoutDueDate` when Finance marks “doc received.”
- **Exclude weekends** – If Yes, “business days” skip Saturday and Sunday when computing `payoutDueDate`.
- **Subcon invoice deadline (days)** – Used for 30-day rule: trip past deadline cannot be included in a payout batch unless an override is approved.
- **Call time grace (min)** – Used in operations (e.g. call-time reminders), not in payout schedule.

---

## 3. Schema reference (where these live)

- **Client** – `code`, `name` (e.g. SPX, Shopee Express); `code` is unique per tenant and is what rate / AR uploads reference.
- **ServiceSegment** – `name`, `code` (e.g. `FM_ONCALL`, `FM_WETLEASE`, `MFM_ONCALL`); belongs to one client.
- **ServiceCategory** – `name`, `code`; belongs to one client and one segment, and carries the rules:
  - `docSubmissionDay` (e.g. `"Tuesday"`)
  - `cycleStartDay` (e.g. `"Wednesday"`)
  - `payoutTermsBusinessDays` (e.g. `3`)
  - `excludeWeekends` (e.g. `true`)
  - `subcontractorInvoiceDeadlineDays` (e.g. `30`)
  - `callTimeGraceMinutes` (e.g. `15`)
  - `vatRate`, `adminFeePercent`, `withholdingPercent` (used by trip finance computation)
  - `firstTripOnlyPayout` (wetlease-style: only the first trip of the day per driver is paid)

---

## 4. Summary for verification

- **Document receipt logic** is unchanged: scan barcode → mark doc received (per trip) → create payout batch later for operator + period.
- **Payout due date** = date Finance marks “doc received” **+** `payoutTermsBusinessDays` business days (weekends excluded if `excludeWeekends` is true). No “submission date → release date” schedule is implemented.
- **Account/category and billing cycle** are as in the table above (one config per SPX category, same values in seed). Adjust the seed or add an API to change per-category values as needed.

If you want to add a **scheduled payout release date based on submission date** (e.g. “every Wednesday after submission Tuesday”), that can be designed as a separate rule and documented here once agreed.
