# Batching Structure: Cut-off, Segment, and Service Category

**Document purpose:** This document defines the **three-level batching structure** for client payments (AR) and clarifies the **term for the middle level** (the three groupings). It reflects the current agreed structure for Shopee Express.

---

## 1. The Three Levels

When we batch trips for **client payment** (reverse billing, invoice, payment list), we use:

| Level | Term | What it is |
|-------|------|------------|
| **1** | **Cut-off period** | Time window: **1–15** or **16–31** of the month (two per month). |
| **2** | **Service segment** *(recommended term — see below)* | A grouping of similar service categories. There are **3 segments**. Each segment contains several **service categories**. The client may send one reverse billing **per segment per cut-off** (or per category per cut-off — to be confirmed with client). |
| **3** | **Service category** | The specific type of service (the 8 SPX categories we use in the system for rates, trips, and finance). |

So: **Cut-off** (e.g. 1–15 Feb) + **Segment** (e.g. FM Oncall) + **Service category** (e.g. SPX FM 4W Oncall) — and a **batch** is typically for one cut-off and one segment (or one category, depending on how the client sends the list).

---

## 2. Recommended Term for the Middle Level (the 3 groupings)

You asked for a **proper category term** for the three groupings. Below are options; the **recommended** one is **Service segment**.

| Term | Pros | Cons |
|------|------|------|
| **Service segment** | Common in logistics/transport; clear that it “segments” services (FM Oncall vs FM Wetlease vs MFM). Works well in reports: “AR by segment,” “Batch per segment per cut-off.” | None significant. |
| **Billing segment** | Emphasises use in billing/batching. | Slightly narrow if we also use the grouping in operations or reporting. |
| **Category group** | Very clear: a group of (service) categories. | “Category” appears twice (category group vs service category), which can be confusing. |
| **Product line** | Familiar in business. | “Product” is less natural for logistics services. |

**Recommendation: use “Service segment.”**

- **Segment** = one of the three: **FM Oncall**, **FM Wetlease**, **MFM Oncall**.
- **Service category** = one of the eight SPX categories (e.g. SPX FM 4W Oncall, SPX FM 6WCV Wetlease).

So we can say:
- “The client sends reverse billing **per cut-off per segment**” (or per cut-off per category, if they send at category level).
- “This batch is for **segment FM Oncall**, cut-off 1–15 February.”
- “Trips under **segment FM Wetlease** are SPX FM 4WCV Wetlease and SPX FM 6WCV Wetlease.”

If your team or the client already uses another word (e.g. “billing group,” “category group”), you can substitute it in the same way; the **structure** (3 groups and their members) stays as below.

---

## 3. The Three Service Segments and Their Service Categories

| # | Service segment (recommended name) | Service categories (SPX) in this segment |
|---|-----------------------------------|----------------------------------------|
| **1** | **FM Oncall** | SPX FM 4W Oncall, SPX FM 6WCV Oncall, SPX FM 10W Oncall |
| **2** | **FM Wetlease** | SPX FM 4WCV Wetlease, SPX FM 6WCV Wetlease |
| **3** | **MFM Oncall** | SPX MEGA FM 6W, SPX MEGA FM 10W, SPX MFM Shunting 6W |

So:
- **FM Oncall** = the three FM oncall categories (4W, 6WCV, 10W).
- **FM Wetlease** = the two FM wetlease categories (4WCV, 6WCV).
- **MFM Oncall** = MEGA FM 6W, MEGA FM 10W, and MFM Shunting 6W.

---

## 4. How This Fits Batching (AR / reverse billing)

- **Cut-off** — We always batch by **cut-off period** (1–15 or 16–31).
- **Segment** — The client may send reverse billing (and we may create AR batches) **per segment per cut-off**. So for one month we could have, for example:
  - Cut-off 1–15: FM Oncall, FM Wetlease, MFM Oncall (3 batches or 3 lists).
  - Cut-off 16–31: FM Oncall, FM Wetlease, MFM Oncall (3 batches or 3 lists).
- **Service category** — Each trip in the system belongs to **one service category** (one of the 8). That category belongs to **exactly one segment**. So when we upload the client’s reverse billing CSV for “FM Oncall, 1–15 Feb,” we match rows to our trips whose service category is one of: SPX FM 4W Oncall, SPX FM 6WCV Oncall, SPX FM 10W Oncall.

If the client sends **one list per segment per cut-off** (instead of one per category per cut-off), we have **3 batches per cut-off** (e.g. 6 batches per month). If they send per category, we have 8 categories × 2 cut-offs = 16 possible batches per month; the **segment** is still useful for reporting and grouping (e.g. “AR by segment,” “Disputes by segment”).

---

## 5. Updated Understanding (Summary)

- **Cut-off period** = 1–15 or 16–31 of the month.
- **Service segment** = the name we use for the **three groupings**:
  1. **FM Oncall** → SPX FM 4W Oncall, SPX FM 6WCV Oncall, SPX FM 10W Oncall  
  2. **FM Wetlease** → SPX FM 4WCV Wetlease, SPX FM 6WCV Wetlease  
  3. **MFM Oncall** → SPX MEGA FM 6W, SPX MEGA FM 10W, SPX MFM Shunting 6W  
- **Service category** = the 8 specific SPX categories used on trips and rates; each belongs to one segment.
- Batching for the client (reverse billing, invoice, payment) is done **per cut-off** and **per segment** (or per category, depending on how the client sends the list). The term **service segment** is the recommended label for the three category groupings.

---

*This document is for process and reporting alignment. Use “Service segment” in blueprints, training, and reports unless your organisation or the client adopts a different label (e.g. Billing segment, Category group).*
