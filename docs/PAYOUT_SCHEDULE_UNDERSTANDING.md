# Payout Schedule — My Understanding (for Your Review & Validation)

This document states my understanding of the payout schedule and release logic based on your clarification. **Please review and confirm or correct.**

---

## 1. Submission and cycle

- **Doc submission** for the week is **Monday or Tuesday** (operator submits documents on one of these days).
- **Start of counting** is **Wednesday** of that same week (the “cycle start”).
- So: submission window = Mon/Tue → counting starts **Wednesday** → we add **N business days** (payout terms) from that Wednesday.

**Example (3-day terms):**  
Submission Mon/Tue → Wednesday = day 0 → +3 business days (Thu, Fri, Mon) → **release target = Monday of the following week**.

---

## 2. Release date = target, not automatic release

- The date we get from “Wednesday + N business days” is the **target release date** (e.g. Monday of the following week for 3-day terms).
- **That date does not mean payout is automatically released on that day.**
- There is an option to **Hold** the payout (so it is not released even when the target date is reached).
- **CFO approval is at batch level:** CFO approves a **payout batch**, not each “doc received” action. So one batch can contain many trips and has one approval decision and one target release date (and can be held).

---

## 3. One release date can combine different payout terms

- A single **target release date** (e.g. **Monday, March 2, 2026**) can include trips from categories with **different** payout terms.
- Those trips qualified because their **submission week** and **cycle start** + their **N** business days land on that same release date:

| Payout terms | Interpretation (for release target Mar 2, 2026) |
|--------------|---------------------------------------------------|
| **3 days**   | Submission Mon/Tue **Feb 24** week → cycle start **Wed Feb 25** → +3 business days → **Mon Mar 2**. |
| **8 days**   | Submission Mon/Tue **Feb 17** week → cycle start **Wed Feb 18** → +8 business days → **Mon Mar 2**. |
| **13 days**  | Submission Mon/Tue **Feb 10** week → cycle start **Wed Feb 11** → +13 business days → **Mon Mar 2**. |

So: **“Payout for release on March 2, 2026”** = batch that includes:
- 3-day terms: submitted in the week of Feb 24 (cycle start Wed Feb 25),
- 8-day terms: submitted in the week of Feb 17 (cycle start Wed Feb 18),
- 13-day terms: submitted in the week of Feb 10 (cycle start Wed Feb 11).

---

## 4. Payout terms per service category (your list)

| Service category        | Category code             | Payout terms (business days) |
|-------------------------|---------------------------|-------------------------------|
| SPX FM 4W Oncall        | SPX_FM_4W_ONCALL          | **13**                        |
| SPX FM 6WCV Oncall      | SPX_FM_6WCV_ONCALL        | **8**                         |
| SPX FM 10W Oncall       | SPX_FM_10W_ONCALL         | **8**                         |
| SPX FM 4WCV Wetlease    | SPX_FM_4WCV_WETLEASE      | **13**                        |
| SPX FM 6WCV Wetlease    | SPX_FM_6WCV_WETLEASE      | **8**                         |
| SPX MEGA FM 6W          | SPX_MEGA_FM_6W            | **3**                         |
| SPX MEGA FM 10W         | SPX_MEGA_FM_10W           | **3**                         |
| SPX MFM Shunting 6W     | SPX_MFM_SHUNTING_6W       | **3**                         |

- Doc submission: **Monday or Tuesday** (for the week).
- Cycle start: **Wednesday** (same week).
- Business days: exclude weekends (as per your config).

---

## 5. Batching rules: eligibility and mandatory remarks

**5a. What can be included in a batch**

- A batch is created **for a specific target release date** (e.g. “batch for release on March 2, 2026”).
- **Only trips that are ready for release on that date** can be included in that batch.
  - “Ready for release” = trip has **doc received**, finance computed, 30-day/override satisfied, **and** its submission week + cycle start + payout terms land on **that** target release date.

**5a(i). “Not ready for release” = doc received but schedule not yet met**

- **Docs not yet received** → those trips are **not shown as choices** at all when building the batch (they can’t be in the batch, so they don’t appear as options).
- **“Not ready for release”** for a given batch means: **doc has been received**, but the **release target for that trip is a different date** (so the schedule for this batch is not yet met for that trip).
  - **Example (batch for release March 2, 2026):** For **8-day** payout terms, only submission week **Feb 17** (cycle start Wed Feb 18) qualifies for Mar 2. If a trip was **submitted Feb 24, 2026** with 8-day terms, its release target is **March 9** (Wed Feb 25 + 8 biz days), not March 2. So that trip is **not ready for release** for the March 2 batch — it must not be included; it would be eligible for the March 9 batch instead.
- So: we **cannot** include in the March 2 batch any trip whose computed release target is not March 2 (e.g. received but submitted Feb 24 with 8-day terms → release Mar 9).

**5b. When something is ready but not included**

- Sometimes some trips (or an operator’s set of trips) **are** ready for release on the scheduled date, but Finance **chooses not to include** them in the batch for that release.
- In that case, **Finance must record a remark or reason** for not including it — i.e. a reason for **not releasing** that eligible item on that schedule.
- So: **if it’s ready for release on that date but not in the batch → mandatory remark/reason.**

**Summary**

| Situation | Rule |
|-----------|------|
| Doc **not yet received** | Not shown as choices for batching at all; cannot be in the batch. |
| Doc **received** but **release target ≠ this batch’s release date** (e.g. 8-day terms, submitted Feb 24 → release Mar 9; batch is for Mar 2) | **Not ready for release** for this batch; **must not** be included. |
| Trip **is** ready for release on that date (received + release target = this batch date) and **is** included | Normal case; no extra remark required. |
| Trip **is** ready for release on that date but **is not** included | Finance **must** provide a **remark or reason** for not including it (reason for not releasing it on that schedule). |

---

## 6. Alignment with current system logic

**We are not aligned.** Summary:

| Aspect | Your intended logic | Current system logic |
|--------|----------------------|------------------------|
| **When does “payout due” get set?** | From **submission week + cycle start (Wednesday) + N business days** → gives a **target release date** (e.g. Monday next week for 3-day). | From **when Finance marks “doc received”** per trip: `payoutDueDate = doc received date + N business days`. No submission week or cycle Wednesday. |
| **What is “release”?** | **Target** date; payout can be **held**; not auto-released on that date. | No “release” or “hold” concept. We only have batch status (DRAFT → Fin Mgr approved → CFO approved). No field for “target release date” or “held”. |
| **CFO approval** | Per **batch** (one approval for the whole batch). | **Aligned:** CFO approves the batch (approve-cfo), not per doc received. |
| **Batching** | Batch is tied to a **target release date** (e.g. Mar 2, 2026), and includes all trips whose (submission week + cycle + terms) land on that date (3-day from Feb 24 week, 8-day from Feb 17 week, 13-day from Feb 10 week). | Batch is created by **operator + period (periodStart, periodEnd)**. Period is date range (e.g. runsheet date). No concept of “target release date” or “submission week” when building the batch. |
| **Payout terms in data** | Per category: 3, 8, or 13 days as in your table. | Seed has **3** for all categories; not 8 or 13 where you specified. |

So:

- **Aligned:** CFO approves at batch level; doc submission can be Mon/Tue and cycle start Wednesday in config.
- **Not aligned:**  
  - No use of “submission week” or “cycle start Wednesday” to compute a **target release date**.  
  - No “release” vs “hold”; no batch-level target release date.  
  - Payout due is today computed from **doc received date + N**, not from **cycle Wednesday + N**.  
  - Seed has all categories at 3 days; your list has 3, 8, and 13 by category.

---

## 7. Summary for your validation

1. **Submission:** Mon or Tue for the week.  
2. **Counting starts:** Wednesday of that week.  
3. **Release target:** Wednesday + N business days (e.g. N=3 → Monday next week).  
4. **Release = target only:** Payout can be **held**; CFO approves the **batch**, not each doc receipt.  
5. **One release date, multiple terms:** e.g. Mar 2 batch includes 3-day (Feb 24 week), 8-day (Feb 17 week), 13-day (Feb 10 week).  
6. **Category terms:** as in the table above (3 / 8 / 13 days per category).  
7. **Batching:**  
   - Batch is for a **release date**; only trips **ready for release** on that date can be included.  
   - Trips **not** ready for release on that date **cannot** be included.  
   - If a trip **is** ready for release on that schedule but Finance **did not** include it in the batch, Finance **must** put a **remark or reason** for not releasing it on that schedule.

If anything above is wrong or missing, please correct it.

---

## 8. Implementation status (updated)

The following has been implemented in the codebase:

- **Seed:** Payout terms per category (3 / 8 / 13 days); doc submission Tuesday, cycle start Wednesday.
- **markFinanceDocReceived:** `payoutDueDate` = Wednesday of the week containing doc-received date + N business days (from category config).
- **getEligibleTripsForRelease:** Returns trips eligible for a given target release date (doc received, payoutDueDate on that day, 30-day/override pass).
- **createPayoutBatch:** Accepts `targetReleaseDate`, `includedTripIds`, `exclusions` (tripId + reason). Every eligible trip must be either included or excluded with a reason.
- **PayoutBatch:** `targetReleaseDate`, `held`, `releasedAt`; **PayoutBatchExclusion** table for reasons when eligible trips are not included.
- **PATCH payout-batches/:id/hold:** Set `held` (true = hold, false = release; releasing sets `releasedAt`).
