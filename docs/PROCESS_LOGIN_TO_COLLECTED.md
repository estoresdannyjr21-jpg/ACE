# Ace Truckers Corp ERP — In-Depth Process: Login to Collected

**Document purpose:** This document walks through the **entire process** from when a user logs in to when money is **collected** — both when **we collect** from the client (Shopee Express) and when **operators collect** their payout from us. It is written as a step-by-step narrative for training, reporting, and alignment. Suitable for copying into Word.

**What “collected” means here:**
- **We have collected** — The client’s payment has been **deposited** into our bank account (AR closed for that batch).
- **Operator has collected** — The payout batch has been **released** (and the operator can receive payment / download the payslip); from our side, the obligation is released.

---

## Part A — Login and Daily Starting Point

### A.1 Who Logs In and Where

- **Web (desktop)** — Fleet Acquisition, Operations Coordinators, Finance Personnel, Finance Manager, CFO, Admin/Manager. They log in with email and password. The system shows a **home or dashboard** and a **menu** that depends on their role (e.g. Fleet Acquisition sees operators/drivers/vehicles; Operations sees trips and dashboard; Finance sees finance menu and reports).
- **Driver mobile app** — Drivers log in with their company credentials. They see their **trips list** and options for availability, trip details, and actions (accept/decline, submit event, upload POD, etc.).
- **Operator portal** — Operator users (subcontractor company staff) log in to see only **their** trips and **their** payout batches; they can download payslips for approved and released batches.

### A.2 What Happens at Login

- The user enters email and password (and for the app, the same is done on the device).
- The system checks the credentials and the user’s **role**.
- Access is granted only to the screens and actions allowed for that role (e.g. a driver cannot see Finance; an operator cannot see another operator’s data).
- From that moment, every important action (e.g. create trip, verify POD, approve batch, mark doc received) is **recorded in the audit log** (who, when, what), so the full path from login to “collected” can be traced.

**Starting point for the rest of this document:** We assume the organisation has already set up **operators, drivers, vehicles, and rates**. The in-depth flow below starts from **creating a trip** and follows it all the way to **collected** (client paid us; we released operator payout). The steps before that (Fleet Acquisition login and maintaining operators/drivers/vehicles, and setting rates) are summarised in Part B so the full picture is clear.

---

## Part B — Prerequisites (Before a Trip Exists)

These steps are usually done in advance or periodically, not for every trip. They are part of “end to end” because without them, the process cannot run.

### B.1 Fleet Acquisition (Operators, Drivers, Vehicles)

- **Fleet Acquisition** (or Admin) logs in to the web app and goes to Fleet Acquisition.
- **Operators** — They create or edit operator companies: name, contact, tax details, bank account details (for paying them later), and invoice type (e.g. VATable / Non-VATable). Only roles that need to process payouts see full bank details; others may see masked data.
- **Drivers** — They create drivers and **assign each driver to an operator** (with start date). Driver details and any client-specific IDs (e.g. SPX driver ID) are stored. Assignment history is kept (which driver was with which operator, from when to when).
- **Vehicles** — They create vehicles and **assign each vehicle to an operator** (with start date). Plate number and details are stored. Assignment history is kept.
- **Fleet inventory** — They tag which vehicles are available for which client (e.g. Shopee Express) as primary or secondary. This supports planning and compliance.
- **Outcome:** We have a pool of operators, each with their drivers and vehicles, and we know which vehicles are tagged for the client. The **rule** is: when we later create a trip, the **driver and vehicle must belong to the same operator**.

### B.2 Rates

- **Admin or authorised user** logs in and goes to Rates (or equivalent).
- They create or edit **route rates**: **origin area**, **destination area**, **service category** (e.g. FM 4W Oncall, FM 6WCV Wetlease), **amount**, and **effective from / to dates**.
- The system uses these to compute how much we pay the operator for a trip (and for billing the client). Trip creation will **block** creating a trip if there is **no active rate** for the trip date; it may **warn** if the rate is expiring within 7 days.
- **Outcome:** Every trip we create must have a valid rate for the runsheet date.

### B.3 Driver Availability (Ongoing)

- **Drivers** log in to the mobile app and can set their **availability** by date (e.g. available, unavailable, coding day). This is used for advance planning.
- **Operations** can view driver availability when planning trips so they assign only drivers who are available.

---

## Part C — Trip Creation to POD Verified (Operations and Driver)

This is the path from “we have a job” to “we have verified proof that the job was done.”

### C.1 Operations Creates a Trip

- **Operations Account Coordinator** logs in to the web app and goes to Dispatch / Trips.
- They create a **new trip**: choose **runsheet date**, **call time**, **origin and destination areas**, **service category**, **client** (e.g. Shopee Express), and **assigned driver and vehicle**.
- The system checks: (1) the **vehicle must belong to the same operator** as the driver; (2) there must be an **active route rate** for this origin, destination, category, and **runsheet date**. If not, the system blocks creation or shows a warning (e.g. rate expiring soon).
- When the trip is saved, the system generates an **internal reference** (e.g. for barcode scanning later). The trip status is “assigned, pending acceptance” and POD status is “not uploaded.”
- **Driver** may receive a **notification** (in-app or push): “You have a new trip assignment.”
- **Outcome:** Trip exists; driver is assigned; driver must accept or decline.

### C.2 Driver Accepts or Declines

- **Driver** logs in to the mobile app and sees the new trip in the list. They open the trip details.
- They choose **Accept** or **Decline**. If they decline, they may enter a reason. The trip then leaves their active list (or is marked declined) and Operations may assign another driver.
- If they **Accept**, the trip status becomes “accepted” and the driver can now perform actions for this trip (events, POD, reimbursables).
- **Outcome:** Trip is accepted; driver is committed to execute.

### C.3 Driver Executes the Trip (Events and POD)

- **Driver** performs the trip in the field. At key moments (e.g. arrived at pickup, departed, loading start, loading done, unloading start, unloading done), they open the trip in the app and **submit an event**.
- For each event they must provide: **event type**, **time**, and **at least one photo**. They can optionally add **location** (GPS). The app sends this to the system; the system stores the event and links it to the trip.
- When the delivery is complete, the driver **uploads Proof of Delivery (POD)** — they take or select a photo (e.g. runsheet signed, delivery note) and upload it for this trip. The system sets POD status to “uploaded, pending review.”
- If there are **reimbursable expenses** (e.g. toll, gas, parking), the driver can **upload documents** for each type (Toll, Gas, Parking). These are linked to the trip; Finance will later approve or reject amounts.
- If something goes wrong (e.g. accident, breakdown), the driver can **report an incident** from the app (type, severity, description) and optionally attach photos. Operations can then track and resolve it (or do it on behalf of the driver via “proxy”).
- **Outcome:** Trip has events (with photo and time), POD is uploaded and pending review, and any reimbursables and incidents are recorded.

### C.4 Operations Verifies POD

- **Operations Account Coordinator** logs in and goes to the trip (e.g. from the Operations dashboard list “POD pending review” or by searching the trip).
- They review the **POD image** (and any supporting info). They either **Verify** or **Reject** POD.
- If they **Reject**, they can add a comment (e.g. “Signature unclear”). The trip’s POD status becomes “rejected, needs re-upload.” The driver must upload a new POD; the cycle repeats until Operations verifies.
- If they **Verify**, the trip’s POD status becomes **“Verified.”** From this moment, **Finance is allowed** to process this trip (mark doc received, compute, include in payout). Until POD is verified, Finance cannot do those steps.
- Optionally, the system can generate a **barcode cover sheet** PDF for the verified POD for filing or scanning.
- **Outcome:** POD is verified; the trip is **ready for Finance** to process.

---

## Part D — Finance: From Document Received to Payout Released (We Pay Operators)

This is the path from “we have verified POD” to “operator can collect” (payout released).

### D.1 Finance Marks Document Received

- **Finance Personnel** has the **physical or digital supporting document** (e.g. runsheet, verified POD printout or file) in hand. They find the trip in the system (e.g. by **scanning the barcode** on the document using the trip’s internal reference, or by searching).
- They open the trip and choose **“Mark Finance Doc Received”** (or equivalent). The system records the **date and time** we received the document. The trip is now in “document received” state for finance.
- **Important:** The system only allows this action if the trip’s POD status is **Verified**. If not, the button is blocked or an error is shown.
- **Outcome:** Trip is marked “document received”; the system can now compute payout and will use this date for **payout due date** (e.g. submission week, cycle start Wednesday, then add N business days by category).

### D.2 Finance Computes Trip Payout

- **Finance Personnel** opens the same trip and runs **“Compute”** (or the system does it when doc is received, depending on design). The system calculates:
  - **Rate** — From the active route rate for that trip (origin, destination, category, runsheet date). Some categories use a **wetlease tier** (e.g. different amount for first trip vs rest of the day).
  - **VAT / Non-VAT** — Based on the **operator’s invoice type** (VATable or Non-VATable), the system derives the **payout base** and any **admin fee** (e.g. 2%).
  - **Reimbursables** — Toll, gas, parking: Finance can enter or adjust amounts and set status (e.g. submitted to client, approved, rejected). **Approved** amount is added to payout; **rejected** is not.
  - **Payout due date** — From “document received” date: the system uses the **cycle start** (e.g. Wednesday of that week) and adds **N business days** (N depends on service category — e.g. 3, 8, or 13 days). That date is when this trip becomes **eligible for release** in a batch.
- The system stores the computed amounts and the **payout due date**. The trip’s payout status is “ready for payout” (or equivalent).
- **Outcome:** Trip has a computed payout and a payout due date; it can be included in a **payout batch** when its due date matches the batch’s target release date.

### D.3 Reimbursables (If Any)

- For trips with **reimbursable documents** (toll, gas, parking), **Finance** reviews and sets **amounts** and **status** (e.g. approved or rejected). Only approved amounts are included in the operator’s payout. Rejected reimbursables are not paid.
- **Outcome:** Reimbursables are finalised; the trip’s net payout (base + approved reimbursables) is clear.

### D.4 Building the Payout Batch

- **Finance Personnel** (or authorised user) goes to **Payout Batches**. They choose to create a batch for a **target release date** (e.g. “Monday, March 2, 2026”), for a specific **operator** and **client**.
- The system shows **eligible trips**: trips that have document received, computed, and whose **payout due date** equals this **target release date** (and that meet any other rules, e.g. 30-day deadline or override). Only these trips can be **included** in this batch.
- Finance selects which eligible trips to **include** in the batch. Any eligible trip they **do not include** must have a **reason** (e.g. “On hold for dispute,” “Waiting for document”). The system enforces: every eligible trip is either included or excluded with a reason.
- The system may apply **cashbond** logic (e.g. deduct a fixed amount per driver per batch, capped at a maximum). Reimbursement-only trips may be excluded from cashbond.
- When the batch is created, it is in **Draft** status. It contains: total trip payout, total admin fee, total reimbursables, cashbond deduction, and **net payable** to the operator.
- **Outcome:** A payout batch exists with a clear list of trips and amounts; it is ready for approval.

### D.5 Override Request (If a Trip Is Past Deadline)

- Some trips might be **past the subcontractor invoice deadline** (e.g. 30 days from delivery). The system may block them from being included in a batch unless an **override** is approved.
- **Finance** submits an **override request** for that trip (with a reason, e.g. “Document received late due to client delay”). **CFO** logs in, reviews override requests, and either **approves** or **rejects** (with a reason). If approved, the trip can be included in a batch.
- **Outcome:** Override is either approved (trip can be batched) or rejected (trip stays out until policy allows).

### D.6 Finance Manager Approves the Batch

- **Finance Manager** logs in and goes to Payout Batches. They open the batch and review: trips, amounts, operator, client, target release date.
- They **approve** the batch (first level). The batch status becomes “Finance Manager approved” (or equivalent).
- **Outcome:** Batch has passed first approval; it goes to CFO.

### D.7 CFO Approves the Batch

- **CFO** logs in and opens the same batch. They review again and **approve** (final approval). The batch status becomes “CFO approved.”
- The system can now generate the **payslip PDF** for this batch (e.g. stored and linked to the batch). The operator will be able to download it (see D.9).
- **Outcome:** Batch is fully approved; payslip is available. Payment can still be **held** (see D.8).

### D.8 Hold or Release the Batch

- Even after CFO approval, the company may want to **hold** the payout (e.g. for cash flow or compliance). **CFO** (or authorised role) can set the batch to **Hold** so that the operator does not yet “collect.”
- When we are ready to pay, **CFO** (or authorised role) sets the batch to **Release**. The system records the **release date**. From this moment, the **operator has “collected”** in the sense that we have released the obligation and they can receive payment and download the payslip.
- **Outcome:** Batch is **released**; operator can collect (e.g. via bank transfer per our process) and download the payslip.

### D.9 Operator Sees Batch and Downloads Payslip

- **Operator User** (subcontractor company staff) logs in to the **Operator Portal**. They see only **their** company’s trips and payout batches.
- They open **Payout Batches** and see the batch that was **released**. They can **download the payslip PDF** (summary of trips, amounts, deductions, net payable).
- **Outcome:** Operator has **collected** (from our process perspective): payout is released and they have the payslip and can receive the money per our payment process.

---

## Part E — Finance: From Document to Deposit (We Collect from the Client)

This is the path from “we have the document” to “we have collected” the client’s payment (deposit in our bank).

### E.1 Same Trip: Document Received and Ready to Bill

- The same trip that Finance marked **document received** and **computed** (Part D) is on our side **ready to bill** the client. So the trip is in “ready to bill” or “billed” state depending on whether we have already issued our invoice for the batch it belongs to (see E.3–E.4).

### E.2 Client Sends Reverse Billing; We Upload and Match

- The **client (Shopee Express)** sends their **reverse billing** — a list of trips they will pay for a given **service category** and **cut-off period** (e.g. 1–15 or 16–31 of the month). This often comes as a **CSV or Excel file**.
- **Finance** logs in and goes to the **AR / Client Billing** area. They select or create the **AR batch** that matches: client, service category, and cut-off (e.g. Shopee Express, Category A, 1–15 February).
- They **upload the CSV** (reverse billing file). The system:
  - **Matches** each row to our trips (e.g. by trip reference or ID). Matched trips are **attached to this AR batch** and will be included when we issue our invoice.
  - **Auto-dispute** — For the same period and category, any **our trip that is not in the client’s list** is marked as **dispute**. We will follow up with the client separately (bill or dispute).
  - **Client-listed, no record** — Any row in the file that **does not match** any of our trips is **saved** as “client listed but we have no record” (could be not our trip or we missed recording). We keep this list for follow-up.
- Finance reviews the result: how many matched, how many disputes, how many client-listed-no-record. They can correct or add notes if needed.
- **Outcome:** We know exactly which trips are **in** this payment batch, which are **dispute**, and which client refs we need to **investigate**.

### E.3 We Issue Our Invoice for the Batch

- **Finance** creates **our Invoice** for this AR batch (same client, category, cut-off). They enter **invoice number** and **invoice date** and attach or link it to the batch.
- The **invoice date** is critical: it is the **start date** for the **30-day period** within which the client must send us the **Payment List** (email). The system may use this for reminders and AR reporting.
- Trips in this batch are marked as **Billed** (or Invoiced) on our side.
- **Outcome:** Our invoice is issued; the 30-day count has started.

### E.4 We Wait for the Payment List (Within 30 Days)

- The **client** must send the **Payment List** (e.g. by email) **within 30 days of the invoice date**. The Payment List may refer to several of our invoices (different categories or cut-offs).
- **Finance** monitors and, when we receive the email, records the **Payment List received date** in the system for this batch (or per invoice, depending on design).
- **Outcome:** We have confirmed receipt of the Payment List within the 30-day window (or we escalate if not received).

### E.5 Check Pickup (4 Days After Payment List)

- Our policy: we can **pick up the check** **4 days after** the date we received the Payment List.
- **Finance** (or Logistics) records the **check pickup date** (or the system computes it as Payment List date + 4 days). They physically pick up the check from the client as per agreement.
- **Outcome:** We have the check in hand.

### E.6 Deposit — We Have Collected

- **Finance** (or authorised person) **deposits the check** into our bank account. They record the **deposit date** (and possibly reference) in the system for this batch.
- The batch status becomes **Deposited** (or Paid). **We have collected**: the client’s payment is in our account; AR for this batch is closed.
- **Outcome:** **Collected** — money from the client is in our bank.

---

## Part F — Collected: Summary of the Two “Collected” Points

| Collected | Meaning | When it happens |
|-----------|---------|------------------|
| **Operator has collected** | We have **released** the payout batch; the operator can receive payment and has access to the payslip. | After CFO approves the batch and we set the batch to **Release** (and any hold is lifted). Operator logs in to the portal and downloads the payslip; payment is made per our process. |
| **We have collected** | The client’s payment has been **deposited** into our bank account. | After we record **Deposit** for the AR batch (following: reverse billing uploaded and matched, our invoice issued, Payment List received within 30 days, 4 days passed, check picked up). |

---

## Part G — End-to-End in One Table (Login to Collected)

| # | Phase | Who logs in / acts | What they do | Outcome |
|---|--------|---------------------|--------------|---------|
| 1 | **Login** | Any user | Email + password (web or app or operator portal). | Access to role-based screens and actions. |
| 2 | **Prerequisites** | Fleet Acquisition; Admin | Maintain operators, drivers, vehicles, assignments, fleet inventory; set route rates. Drivers may set availability. | Pool and rates ready for trips. |
| 3 | **Create trip** | Operations | Create trip: date, time, route, category, driver, vehicle (same operator). System checks rate exists. | Trip created; driver notified. |
| 4 | **Accept trip** | Driver (app) | Accept or decline. | Trip accepted. |
| 5 | **Execute trip** | Driver (app) | Submit events (with photo + time), upload POD, upload reimbursables; report incident if any. | Events and POD in system; POD “pending review.” |
| 6 | **Verify POD** | Operations | Verify or reject POD. If reject, driver re-uploads. | POD **Verified**; Finance can process. |
| 7 | **Doc received** | Finance | Find trip (e.g. barcode scan), mark “Finance doc received.” Allowed only if POD verified. | Trip ready for computation. |
| 8 | **Compute** | Finance | Compute payout (rate, category, operator type, reimbursables). Set reimbursable status. Payout due date set (e.g. Wed + N business days). | Trip has payout amount and due date. |
| 9 | **Payout batch** | Finance | Create batch for target release date, operator, client. Include eligible trips; exclude others with reason. Cashbond applied. Override if needed (CFO). | Batch in Draft. |
| 10 | **Approve batch** | Finance Manager → CFO | FM approves; CFO approves. Payslip generated. | Batch CFO-approved. |
| 11 | **Release batch** | CFO | Set batch to Release (or Hold first, then Release). | **Operator collected** — payout released; operator can download payslip and receive payment. |
| 12 | **Reverse billing** | Finance | Upload client’s CSV; system matches trips, auto-disputes non-listed, records client-listed-no-record. Attach to AR batch. | AR batch has trip list; disputes and orphans recorded. |
| 13 | **Our invoice** | Finance | Issue our Invoice (number + date) for AR batch. Invoice date = start of 30 days. | Client must send Payment List within 30 days. |
| 14 | **Payment list** | Finance | Record date we received Payment List (email) from client. | 4-day count starts for check pickup. |
| 15 | **Check & deposit** | Finance / Logistics | Pick up check (after 4 days); deposit check; record deposit. | **We have collected** — client payment in our bank; AR closed. |

---

*End of in-depth process. This document is for training, reporting, and alignment. It describes the path from login to collected (operator payout released and client payment deposited) in the Ace Truckers Corp ERP Phase 1 (Shopee Express).*
