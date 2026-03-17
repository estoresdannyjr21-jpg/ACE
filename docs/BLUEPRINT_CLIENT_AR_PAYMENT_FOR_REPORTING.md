# Ace Truckers Corp — Client Payment (AR) Process Blueprint  
## End-to-End Process for Receiving Payment from Shopee Express

**Document purpose:** This blueprint describes how Ace Truckers receives payment from the client (Shopee Express) for completed trips. It is written in business terms for reporting and alignment. It includes the full flow from document receipt to deposit, plus handling of the client’s reverse billing list (including CSV upload), disputes, and cases where the client lists a trip we do not have on record.

---

## 1. Overview

**Who pays whom**

- **Client (Shopee Express)** pays **Ace Truckers** for trips we have completed and documented. This is our **Accounts Receivable (AR)**.
- **Ace Truckers** pays **operators (subcontractors)** for the same trips. That payout process is separate and follows its own schedule (e.g. doc received, batch, approval, release).

This document focuses only on **how we get paid by the client** — from the time we have the supporting documents until the check is deposited in our account.

**How the client groups payments**

- The client uses **cut-off periods**: **1st to 15th** of the month, and **16th to last day** of the month.
- Within each cut-off, payments are grouped by **service segment** (three groupings). Each segment contains several **service categories** (the 8 SPX categories we use in the system). See the table below.
- For each **cut-off** and **segment** (or per category, depending on how the client sends the list), the client prepares one list of trips they will pay in that batch. That list is called the **reverse billing** (or client remittance advice).

**The three service segments**

| Service segment | Service categories (SPX) in this segment |
|-----------------|----------------------------------------|
| **FM Oncall** | SPX FM 4W Oncall, SPX FM 6WCV Oncall, SPX FM 10W Oncall |
| **FM Wetlease** | SPX FM 4WCV Wetlease, SPX FM 6WCV Wetlease |
| **MFM Oncall** | SPX MEGA FM 6W, SPX MEGA FM 10W, SPX MFM Shunting 6W |

We use the term **service segment** for this middle level (the three groupings); **service category** is the specific type (e.g. SPX FM 4W Oncall). Full detail is in the document *Batching Segments and Categories*.

---

## 2. End-to-End Flow: From Document to Deposit

Below is the full sequence from “we have the document” to “we have the money in the bank.”

| Step | What happens | Who does it |
|------|----------------|-------------|
| **1. Document received by Finance** | We have the supporting document (e.g. proof of delivery verified). The trip is ready to be included in our billing process. | Ace Truckers – Finance |
| **2. Reverse billing from client** | The client sends their list of trips they will pay for that batch (per service category and cut-off). This is their confirmation of which trips are in that payment batch. | Shopee Express (client) |
| **3. We attach our Invoice** | For that batch (same category and cut-off), Finance creates and attaches **our Invoice** to the client. The **Invoice date** we put on that invoice is important: it is the **start date** for counting the 30-day payment period. | Ace Truckers – Finance |
| **4. 30-day period** | The client has **30 days from the Invoice date** to send us the **Payment List** (usually by email). The Payment List may cover several of our invoices (e.g. different categories or cut-offs). | Client must send within 30 days |
| **5. Payment list received** | We receive the email with the Payment List from the client. We record the **date we received** it. | Ace Truckers – Finance |
| **6. Wait 4 days** | From the date we received the Payment List, we wait **4 days**. After that, we can go to pick up the check. | Ace Truckers |
| **7. Check pickup** | We pick up the check from the client (or as per agreed process). | Ace Truckers |
| **8. Deposit** | The check is deposited into our bank account. Once deposited, we consider that batch **paid** and close the AR for that batch. | Ace Truckers – Finance |

**Short summary:**  
Document received → Client sends reverse billing (list of trips for that batch) → We issue our Invoice (Invoice date = start of 30 days) → Client sends Payment List within 30 days → We record Payment List date → 4 days later we can pick up the check → We deposit the check.

---

## 3. Key Terms (Glossary)

| Term | Meaning |
|------|---------|
| **Cut-off period** | The client’s time window for a batch: either **1st–15th** or **16th–last day** of the month. |
| **Reverse billing** | The list the client sends showing which trips they will pay in that batch (per category and cut-off). Same idea as “client remittance advice” or “client batch confirmation.” |
| **AR batch (or Client billing batch)** | Our internal batch that matches one client + one service category + one cut-off period (e.g. Shopee Express, Category A, 1–15 February). |
| **Document received / Finance doc received** | We have the supporting document (e.g. POD verified) and the trip is ready for billing. |
| **Ready to bill** | The trip is computed and eligible to be included in an invoice batch. |
| **Reverse billing received / Client batch confirmed** | We have received the client’s list (reverse billing) for that batch. |
| **Invoiced / Billed** | We have created and attached **our** Invoice for that batch (with Invoice number and Invoice date). The **Invoice date** starts the 30-day count. |
| **Payment due date** | 30 days from the Invoice date. By this date we expect to receive the Payment List (email). |
| **Payment list received** | We received the client’s Payment List (email). We record the date received. |
| **Check pickup date** | The date we can pick up the check = Payment list received date + 4 days. |
| **Deposited / Payment received** | The check has been deposited; AR for that batch is closed. |
| **Dispute (billing dispute)** | We have a trip on our records for that period and category, but it was **not** in the client’s reverse billing. We handle these separately (dispute or bill separately with the client). |
| **Client-listed, no record** | The client included a trip/reference in their reverse billing, but we have **no matching trip** in our records. It could be not our trip (client error) or we missed recording it. We keep a list of these for follow-up. |

---

## 4. Reverse Billing: How We Use the Client’s List

The client sends their reverse billing as a **list of trips** (often in Excel or CSV). We need to:

1. **Attach that list to the right batch** (same client, service category, and cut-off).
2. **Match** each line on the list to our own trip records.
3. **Update our records** so we know which trips are in this payment batch and which are not.

To do this in one go, we support **uploading a file** (e.g. CSV) that contains the client’s list. The system then does the following.

---

### 4.1 Uploading the Reverse Billing File (CSV Upload)

| Step | Action | Result |
|------|--------|--------|
| 1 | Finance selects or creates the correct **AR batch** (client + service category + cut-off period). | The system knows which period and category the list refers to. |
| 2 | Finance **uploads the file** (e.g. CSV) that contains the client’s reverse billing list (one row per trip reference). | The system reads the list and tries to match each row to a trip in our records. |
| 3 | **Matching** | For each row that matches one of our trips (e.g. same trip reference or ID): that trip is **linked to this AR batch** and will be included when we invoice. |
| 4 | **Auto-dispute** | For the **same** period, client, and service category: any trip we have that was **not** in the uploaded list is automatically marked as **Dispute**. We will handle those separately with the client. |
| 5 | **Client-listed, no record** | For each row in the file that **does not match** any trip in our system: we **save a separate record** (e.g. “client listed this reference but we have no trip”). This list is kept for follow-up: either the trip is not ours, or we missed recording it. |

So in one upload we:  
- Attach the reverse billing to the batch,  
- Bulk update which trips are “in” the batch,  
- Auto-mark our non-listed trips as dispute,  
- Record every client reference we don’t have so we can review.

---

### 4.2 Three Outcomes After We Process the Reverse Billing List

After we upload and process the client’s list, every trip or list line falls into one of three types:

| Outcome | Meaning | What we do |
|---------|---------|------------|
| **In the list and we have the trip** | The client included this trip and we have a matching record. | Link the trip to this AR batch. These trips will be included when we issue our Invoice and will move to “Billed” and then “Paid” when the check is deposited. |
| **We have the trip but it is NOT in the list** | We have a trip for that period and category, but the client did not include it in their reverse billing. | Mark as **Dispute**. These are not part of this batch; we follow up with the client separately (dispute or bill separately). |
| **In the list but we DON’T have a record** | The client listed a trip/reference, but we have no matching trip in our system. | **Record** it as “Client-listed, no record.” We keep this list so we can: confirm if it’s not our trip, or add the trip later if we missed recording it. |

---

## 5. Trip Status (From Our Side)

From our perspective, each trip goes through these stages:

- **Document received** — We have the supporting document; trip is ready for billing.
- **Ready to bill** — Trip is computed and can be included in an invoice batch.
- **In reverse billing** — After we process the client’s list, this trip was on the list and we matched it; it is linked to an AR batch.
- **Billed** — We have issued our Invoice for the batch that includes this trip (Invoice date is set; 30-day count has started).
- **Paid** — We have deposited the client’s payment for that batch; AR for this trip is closed.

Trips that we have but that were **not** in the client’s list are marked as **Dispute** and are not part of the normal batch payment flow until resolved.

---

## 6. Important Dates and Rules

| Rule | Description |
|------|-------------|
| **30 days from Invoice date** | The **Invoice date** we put on our Invoice is the **start** of the 30-day period. The client must send the Payment List (email) within 30 days of that date. |
| **4 days after Payment list** | We record the **date we received** the Payment List. We can pick up the check **4 days after** that date. |
| **Cut-off periods** | The client uses two periods per month: **1–15** and **16–end of month**. Each batch we track is for one client + one service category + one of these cut-offs. |

---

## 7. Roles and Responsibilities (Summary)

| Role | Responsibility in this process |
|------|--------------------------------|
| **Finance** | Receive and file supporting documents; create AR batches; upload reverse billing file; match and dispute handling; create and attach our Invoice (with Invoice date); record Payment List received date; record check pickup and deposit. |
| **Client (Shopee Express)** | Send reverse billing list (per category and cut-off); send Payment List (email) within 30 days of our Invoice date; make check available for pickup (after the 4-day wait). |

---

## 8. One-Page Summary for Management

**What this process is:**  
How we get paid by Shopee Express for completed trips — from the time we have the documents to the time the check is in our account.

**How the client pays:**  
Per **service category** and per **cut-off** (1–15 and 16–31 of the month). For each such batch, the client sends a **reverse billing** (list of trips they will pay).

**What we do:**  
1. Receive and record supporting documents.  
2. Receive the client’s reverse billing (we can upload a CSV to update our system in bulk).  
3. Match the list to our trips: **included** trips go into the batch; **our trips not in the list** are marked as dispute; **client refs we don’t have** are recorded for follow-up.  
4. We issue **our Invoice** for that batch; the **Invoice date** starts the **30-day** period.  
5. Client sends **Payment List** (email) within 30 days; we record the date.  
6. **4 days** after that, we can pick up the check.  
7. We **deposit** the check and close AR for that batch.

**Key terms:**  
Reverse billing = client’s list of trips for that batch. Dispute = we have the trip but it wasn’t on the list. Client-listed no record = on the list but we have no trip (follow up).

---

*End of blueprint. This document is for reporting and process alignment. It reflects the current agreed business process and is not a technical specification.*
