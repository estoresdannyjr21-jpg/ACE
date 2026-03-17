# Finance Dashboard UI Specification

**Route:** `/dashboard/finance` (or `/finance`)

**Reference implementation:** `web/` — Vite + React app with a Finance dashboard page that calls `GET /finance/dashboard`. See `web/README.md` for run instructions.

**API:** `GET /finance/dashboard` with query params: `clientAccountId`, `serviceCategoryId`, `operatorId`, `dateFrom`, `dateTo`, `billingStatus`, `payoutStatus`.

---

## 1. Top bar — Filters

| Control | Type | Query param | Notes |
|--------|------|-------------|--------|
| Date range | From / To date pickers | `dateFrom`, `dateTo` | Optional; filter by trip runsheet date |
| Client | Dropdown (client list from lookups or API) | `clientAccountId` | Optional |
| Service category | Dropdown | `serviceCategoryId` | Optional |
| Operator | Dropdown | `operatorId` | Optional |
| Billing status | Dropdown (READY_TO_BILL, BILLED, PAID) | `billingStatus` | Optional |
| Payout status | Dropdown (READY_FOR_PAYOUT, IN_BATCH, …) | `payoutStatus` | Optional |
| Apply / Reset | Buttons | — | Apply sends request with current filters; Reset clears them |

---

## 2. KPI tiles (from `response.counts`)

Display as a grid of cards. Each tile shows a number and a short label.

### Doc & compute pipeline
| Tile label | API count key |
|------------|----------------|
| POD verified, doc not received | `podVerifiedNotReceived` |
| Doc received, not computed | `docReceivedNotComputed` |

### Billing pipeline (AR)
| Tile label | API count key |
|------------|----------------|
| Ready to bill | `billingReadyToBill` |
| Billed | `billingBilled` |
| Paid | `billingPaid` |

### Payout pipeline (AP)
| Tile label | API count key |
|------------|----------------|
| Ready for payout | `payoutReadyForPayout` |
| In batch | `payoutInBatch` |
| Fin mgr approved | `payoutFinMgrApproved` |
| CFO approved | `payoutCfoApproved` |
| Released | `payoutReleased` |
| Paid | `payoutPaid` |

### Reimbursables & overrides
| Tile label | API count key |
|------------|----------------|
| Reimbursables pending approval | `reimbursablesPendingApproval` |
| Reimbursables approved, pending batch | `reimbursablesApprovedPendingBatch` |
| Override requests pending CFO | `overridesPendingCfo` |

### Subcontractor deadlines
| Tile label | API count key |
|------------|----------------|
| Subcon deadline expiring in 7 days | `subconExpiringSoon` |
| Subcon deadline expired (not overridden) | `subconExpiredBlocked` |

---

## 3. Tables (from dashboard response)

### 3.1 “POD verified, no Finance doc” — `podVerifiedNotReceivedList`

| Column | Source |
|--------|--------|
| Internal ref | `internalRef` |
| Runsheet date | `runsheetDate` |
| Driver | `assignedDriver.firstName` + `assignedDriver.lastName` |
| POD status | `podStatus` |

Limit: 50 rows (API returns up to 50). Optional: link to trip detail (e.g. `/trips/:id` or scan by internalRef).

### 3.2 “Doc received, not computed” — `docReceivedNotComputedList`

| Column | Source |
|--------|--------|
| Internal ref | `internalRef` |
| Runsheet date | `runsheetDate` |
| Doc received at | `finance.financeDocReceivedAt` |
| Driver | `assignedDriver.firstName` + `assignedDriver.lastName` |

Limit: 50 rows.

### 3.3 “Override requests pending” — `overridesPendingList`

| Column | Source |
|--------|--------|
| Internal ref | `trip.internalRef` |
| Runsheet date | `trip.runsheetDate` |
| Status | `status` (e.g. PENDING) |

Limit: 50 rows. Optional: link to override approval flow.

---

## 4. Links to other pages

- **AR ledger / aging** — Navigate to AR report (uses `GET /finance/reports/ar-ledger` with same filters). Show summary or “View AR ledger” button.
- **AP ledger / aging** — Navigate to AP report (uses `GET /finance/reports/ap-ledger`).
- **AR batches** — Navigate to AR batch list (uses `GET /finance/ar/batches`). For reverse billing, attach invoice, payment list, deposited flow.

---

## 5. Response shape (reference)

```ts
{
  counts: {
    podVerifiedNotReceived: number;
    docReceivedNotComputed: number;
    billingReadyToBill: number;
    billingBilled: number;
    billingPaid: number;
    payoutReadyForPayout: number;
    payoutInBatch: number;
    payoutFinMgrApproved: number;
    payoutCfoApproved: number;
    payoutReleased: number;
    payoutPaid: number;
    reimbursablesPendingApproval: number;
    reimbursablesApprovedPendingBatch: number;
    subconExpiringSoon: number;
    subconExpiredBlocked: number;
    overridesPendingCfo: number;
  };
  podVerifiedNotReceivedList: Array<{ id, internalRef, runsheetDate, podStatus, assignedDriver? }>;
  docReceivedNotComputedList: Array<{ id, internalRef, runsheetDate, finance?, assignedDriver? }>;
  overridesPendingList: Array<{ id, status, trip: { id, internalRef, runsheetDate } }>;
}
```

---

## 6. Loading and errors

- Show a loading state while `GET /finance/dashboard` is in progress.
- On error (4xx/5xx), show a message and optional retry.
- Empty tables: show “No records” when the list array is empty.
