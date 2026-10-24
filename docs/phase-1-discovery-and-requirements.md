# FINTRACK — PHASE 1: PROJECT DISCOVERY & REQUIREMENTS SPECIFICATION

**Project:** Fintrack (Personal Salary & Wealth Management Web Application)  
**Engineering & Product Council:** Senior Product Engineer, Software Architect, Business Analyst, UI/UX Designer, Database Architect, QA Engineer, Security Engineer, DevOps Engineer, Technical Project Manager  
**Phase:** Phase 1 — Project Discovery & Requirements  
**Status:** **PHASE 1 STATUS: COMPLETE** (Approved Baseline — Financial Period Model)  
**Document Version:** 2.0.0 (Canonical Baseline — Phase 1 Complete)  
**Date:** October 2026  

---

## 1. Project Purpose & Target Users

### 1.1 Project Purpose
Fintrack is a simple, manually maintained personal finance recording and management web application. It is **NOT** a commercial banking application, payment portal, or automated account aggregator.

The application addresses the common financial vulnerability experienced by salaried individuals: predictable monthly compensation being depleted by unmonitored cash flow leakages, conflation of fixed obligations with discretionary spending, and treating savings as a residual afterthought. 

Fintrack empowers the user to manually record and understand their salary, expenses, savings, budgets, financial obligations, history, and analytical reports. The system anchors the personal financial lifecycle around the **monthly salary event**, enforcing disciplined allocation of recorded income across living expenses, emergency reserves, and long-term targets before discretionary spending begins.

### 1.2 Target Users
- **Primary Demographic:** Salaried corporate professionals, civil servants, software engineers, and formal-contract employees who receive scheduled monthly compensation.
- **Geographic & Currency Focus:** Global salaried professionals. Localization and default currency settings are preconfigured for Pakistani Rupee (PKR), while fully supporting major international currencies (USD, EUR, GBP, AED, SAR).

### 1.3 Primary User Personas

| Attribute | Persona 1: "The Established Earner" (Zain, 34) | Persona 2: "The Career Starter" (Ayesha, 24) |
| :--- | :--- | :--- |
| **Role & Household** | Senior Manager, married with 2 dependents | Associate Engineer, entry-level corporate career |
| **Financial Inflow** | Substantial fixed monthly salary + periodic bonuses | Moderate monthly salary |
| **Commitments** | Heavy fixed obligations: rent, school fees, car installment, family health takaful | Low fixed obligations: living with family, high discretionary burn (dining, apparel, subscriptions) |
| **Primary Frustration** | Despite strong earnings, no cash remains at month-end; emergency fund adequacy is unknown | Uncertainty regarding how much can be safely saved vs. spent on lifestyle each pay cycle |
| **Core Need** | An intentional payday allocation workflow to partition funds for household overhead, reserves, and debt | Clear visual spending guardrails separating guilt-free spending money from untouchable savings |

---

## 2. Business Goals & Value Proposition

### 2.1 Business & Product Goals
1. **Payday Discipline:** Provide a structured, zero-based monthly allocation workflow that can be executed in under 5 minutes upon receiving salary.
2. **Deterministic Clarity:** Deliver a clear, zero-drift financial dashboard that immediately reflects savings rate, fixed-to-variable spending ratios, and remaining unspent salary.
3. **Emergency Fund Resilience:** Enable users to set up, track, and maintain a dedicated liquid emergency fund covering 3 to 6 months of baseline living expenses.
4. **Data Privacy & Tenant Isolation:** Guarantee absolute multi-tenant privacy where user data is strictly isolated and never shared or aggregated without authorization.

### 2.2 Value Proposition
*"Salary-First Financial Discipline."* Fintrack transforms payday into an intentional, planned monthly allocation event, securing your emergency reserves and non-negotiable living commitments before discretionary spending begins.

### 2.3 What Fintrack IS vs. What It Is NOT

| Fintrack IS | Fintrack IS NOT |
| :--- | :--- |
| A manually maintained personal cash-flow and salary ledger | A banking app, payment gateway, or account aggregator |
| A forward-looking monthly Zero-Based Budgeting tool | A high-frequency trading, stock picking, or crypto exchange |
| A deterministic tracker for fixed vs. variable spending | An automated bank synchronization tool (no screen scraping) |
| A privacy-first, user-owned personal balance sheet | A double-entry enterprise accounting system or corporate ERP |
| A tool for tracking emergency reserves and debt commitments | A corporate payroll disbursement or tax filing engine |

---

## 3. Product Scope & MVP Definition

### 3.1 The Financial Period Model & Core Domain Terminology
To prevent ambiguity and eliminate accounting drift, Fintrack establishes the **Financial Period** as the foundational architectural boundary of the personal financial lifecycle. Fintrack is a manually maintained ledger and planning tool, **NOT** a banking application. The user manually records financial information and explicitly determines which financial month that information belongs to.

#### Foundational Concepts:
1. **Financial Period (The Core Monthly Boundary):**
   - A Financial Period represents one user-selected calendar month (e.g., October 2026, November 2026, December 2026).
   - Each Financial Period is an independent, isolated monthly financial record.
   - The user must explicitly select the calendar month when recording salary, which creates and activates that user's Financial Period.
   - The system must **NOT** infer or guess the Financial Period from the salary payment date, entry date, or transaction timestamps. The user-selected Financial Period is strictly authoritative.
   - Every Financial Period is isolated: modifying records in one period (e.g., October 2026) never mutates another period (e.g., November 2026). Users can return to older periods to edit records; updating an older period recalculates that period's metrics and cross-period historical analytics from raw records.

2. **Sequential Record Gating (Salary Prerequisite):**
   - In Fintrack's MVP, a user must have an active Financial Period before any normal monthly financial records can be created.
   - Enforced Sequence: **Financial Period → Recorded Salary → Expenses / Savings**.
   - A user selects a month, records the salary for that month, and activates the period. Expenses and savings can then be added specifically to that active period.
   - The normal UI prevents monthly expense and savings entry when no Financial Period with a recorded salary exists for that month. (This removes previous ambiguity regarding "missing salary but existing expenses").

3. **Recorded Salary / Inflow (One Primary Salary in MVP):**
   - For MVP requirements, each Financial Period contains exactly **one primary recorded monthly salary**.
   - Stored as a manually entered numerical value for the user-selected Financial Period without bank-feed verification.
   - Stored salary records are never modified, decremented, or gated by verification states (no Pending/Received state machine in MVP).

4. **Actual Recorded Expenses:**
   - User-logged out-of-pocket expenditures categorized as Fixed (rent, tuition, utilities) or Variable (groceries, dining, entertainment) that belong strictly to an active Financial Period.
   - Transaction dates provide chronological ordering within the period but do not override the user-selected Financial Period.

5. **Actual Recorded Savings:**
   - Specific manual contributions logged into dedicated reserve goals (e.g., Emergency Fund) belonging to an active Financial Period.
   - Increments goal balance and monthly savings rate without being counted as an expense.

6. **Planned Budget Allocations (Zero-Based Budgeting):**
   - Forward-looking intentions assigning planned currency envelopes to specific categories for the Financial Period.
   - **Planned allocations are NOT actual spending and NOT actual savings.**
   - *Unallocated Budget Pool:* `Recorded Net Salary - Total Planned Allocations`. In Zero-Based Budgeting, this is purely a forward-looking planning state; the user's objective is to allocate every rupee of recorded salary across envelopes so this equals zero (`Income - Allocations = 0`). It does not represent cash movement.

7. **Recorded Salary Remaining (Estimate) & Excess Outflow Rule:**
   - *Formula:* `Recorded Net Salary - (Actual Recorded Expenses + Actual Recorded Savings Contributions)`.
   - Mathematical estimate of how much of the manually recorded salary has not yet been logged as expenses or savings for the selected Financial Period. It is **NOT** verified bank cash, liquid account balance, or guaranteed "available to spend." Stored salary records are never altered or decremented.
   - *Excess Outflow Presentation Rule:* When `Actual Expenses + Actual Savings > Recorded Salary`:
     - The underlying signed calculation (`Salary - Outflows < 0`) is preserved internally for arithmetic correctness and ratio calculations.
     - The primary user-facing Remaining display shows zero: **`Recorded Salary Remaining (Estimate): PKR 0`** (or base currency equivalent) to prevent communicating a misleading negative spendable amount.
     - An explicit visual warning exposes the exact excess outflow: **`Your recorded expenses and savings exceed this period's recorded salary by [Currency] [Amount].`**

#### 3.1.1 Mandated Financial Terminology Guide
To preserve domain integrity across all documentation, UI components, and calculation modules, the following terminology standards are strictly enforced:

| Strictly Preferred Terminology | Strictly Prohibited / Avoided Terminology | Architectural Rationale |
| :--- | :--- | :--- |
| **Financial Period** | Payday cycle, billing cycle | User-selected calendar month is the authoritative ledger boundary. |
| **Selected Financial Period** | Active bank cycle, current month | Explicit user context; system does not infer from system clock. |
| **Recorded Salary** | Salary Received, Verified Deposit | Manual user entry; system never verifies banking transactions. |
| **Actual Expenses** | Cash Spent, Money Out | Actual ledger entries distinguishing out-of-pocket spending from planned caps. |
| **Actual Savings / Goal Contribution** | Savings Deposit, Bank Transfer | Manual goal contributions; distinct from general unspent money. |
| **Recorded Salary Remaining (Estimate)** | Bank Balance, Available Cash, Spendable Cash | Calculated remainder is an estimate, not verified liquid cash. |
| **Unallocated Budget Pool** | Unallocated Cash Pool, Free Cash | Forward-looking planning state in Zero-Based Budgeting. |
| **Historical Financial Periods / Range** | Historical statement, bank history | Isolated monthly records aggregated across reporting ranges. |

### 3.2 MVP Scope (In Scope)
- **Financial Period Management:** User-selected calendar month boundary (e.g., October 2026); explicit selection is authoritative.
- **Sequential Monthly Gating:** Normal UI requires recording salary to activate a Financial Period before expenses or savings can be entered.
- **Single Primary Salary per Period:** One primary recorded monthly salary per Financial Period for MVP.
- **User Authentication:** Email/password authentication using Auth.js (self-managed credentials and session cookies).
- **User Financial Profile:** Default currency selection (PKR default; non-blocking optional income and emergency fund targets).
- **Expense Tracking:** Manual logging of expenditures with binary classification into **Fixed** or **Variable**, categorized across 14 pre-seeded categories.
- **Zero-Based Budget Allocation:** Setting planned category envelopes against recorded monthly salary and monitoring envelope burn.
- **Savings Goals & Emergency Reserve:** Dedicated emergency fund tracking and goal contribution logging (non-expense accounting).
- **Selected-Period Executive Dashboard:** Displays authoritative context (e.g. `Financial Period: October 2026`), Recorded Salary, Fixed vs. Variable Expenses, Total Savings, Recorded Salary Remaining (Estimate) (with zero-display and excess warning if outflows exceed salary), Savings Rate (%), and Expense Ratio (%).
- **Cross-Period Historical Analytics:** Aggregate reporting across predefined reporting ranges (**Last 3 Months, Last 6 Months, Last 12 Months / 1 Year, All Time**) for core MVP metrics: Total Recorded Salary, Total Expenses, Total Savings, Average Monthly Salary, Average Monthly Expenses, Average Monthly Savings, and Aggregate Savings Rate (`Total Savings ÷ Total Recorded Salary × 100`).
- **Independent Period Navigation & Editing:** Ability to switch between periods and edit older records without mutating neighboring months.
- **Responsive Application Shell:** Responsive desktop sidebar, top header with period switcher, and mobile navigation drawer.

### 3.3 Explicit Exclusions from MVP (Out of Scope)
- **No Bank Account Tracking:** No HBL, Meezan, checking, or cash accounts. No account balances or bank statement linking.
- **No Internal Transfers:** Because individual accounts do not exist, there are no internal transfers or transfer reconciliation workflows.
- **No Bank Verification:** No automated feeds, Plaid/Yodlee integrations, SMS scraping, or Open Banking APIs.
- **No Multi-Currency Mixing per User:** A user operates in a single chosen base currency per profile.
- **No Split-Transactions:** Transactions cannot be split across multiple categories in MVP.
- **Post-MVP Modules:** Loans & EMI tracking, Insurance policies, Investment portfolios, and CSV data export are deferred to Post-MVP.
- **Advanced Historical Visualizations:** Multi-variable trend line charts, predictive anomaly detection, and automated category burn simulators are deferred to Post-MVP.

### 3.4 Future Scope (Post-MVP & Long Term)
- **Post-MVP Phase A:** Loan & EMI commitment tracking with interest/principal amortization breakdown.
- **Post-MVP Phase B:** Insurance policy registry and annual premium burden tracking.
- **Post-MVP Phase C:** Investment asset registry and capital deployed tracking.
- **Post-MVP Phase D:** Advanced trend analytics (multi-month graphical comparisons, highest/lowest expense month detection, category shift analysis) and CSV ledger export.
- **Future Enhancements:** Multiple salary streams per period (secondary income, bonuses, freelance contracts), spending anomaly alerts, and optional statement import.

---

## 4. Functional Requirements Inventory

### Module 1: Authentication & User Profile (AUTH / PROF)

| Req ID | Requirement Description | Priority | Target | Dependencies | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-AUTH-01** | User Registration & Login | Must Have | MVP | None | Register with email and password; secure password hashing with bcrypt/argon2; issue HTTP-only session cookie. |
| **REQ-AUTH-02** | Session Persistence & Expiry | Must Have | MVP | REQ-AUTH-01 | Session persists across browser restarts; expired session redirects to login; protected routes reject unauthenticated requests. |
| **REQ-AUTH-03** | Multi-Tenant Data Isolation | Must Have | MVP | REQ-AUTH-01 | Queries and mutations strictly derive `userId` from authenticated session context; cross-tenant query returns `RecordNotFoundError`. |
| **REQ-PROF-01** | Financial Profile Initialization | Must Have | MVP | REQ-AUTH-01 | Onboarding requires base currency selection (PKR default) and provides optional proposed defaults for target monthly income and emergency fund target cushion (default: 6 months; non-blocking). |
| **REQ-PROF-02** | Currency Formatting Settings | Should Have | MVP | REQ-PROF-01 | Numbers render with localized symbols and appropriate decimal precision (0 decimals for PKR, 2 for USD/EUR). |

### Module 2: Salary & Financial Period Management (SAL)

| Req ID | Requirement Description | Priority | Target | Dependencies | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-SAL-01** | Record Primary Salary & Activate Financial Period | Must Have | MVP | REQ-PROF-01 | Form to manually log amount, explicitly selected calendar month (`periodYear`, `periodMonth`), payment date, employer/source, and notes. Positive amount with exact 2 decimals. Explicit selection creates/activates the Financial Period; system never infers period from payment date. |
| **REQ-SAL-02** | Single Primary Salary Rule | Must Have | MVP | REQ-SAL-01 | MVP enforces one primary recorded monthly salary per Financial Period. Additional income streams (`bonus`, `freelance`, `secondary`) are recorded as a future enhancement / open decision. |
| **REQ-SAL-03** | Financial Period Salary Modification | Must Have | MVP | REQ-SAL-01 | User can edit or delete an existing salary entry; recalculates affected period totals and cross-period aggregates immediately without mutating other periods. |
| **REQ-SAL-04** | Historical Salary Ledger | Must Have | MVP | REQ-SAL-01 | Paginated list (default 20 records) sorted descending by Financial Period (`periodYear`, `periodMonth`). |
| **REQ-SAL-05** | Sequential Monthly Record Gating | Must Have | MVP | REQ-SAL-01 | A user must have an active Financial Period with a recorded salary before monthly expenses or savings can be entered. The normal UI strictly blocks adding outflows to periods without recorded salary. |

### Module 3: Expense Management (EXP)

| Req ID | Requirement Description | Priority | Target | Dependencies | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-EXP-01** | Log Expense Record in Active Period | Must Have | MVP | REQ-SAL-05 | Fields: amount, date, category, expense type (fixed vs variable), description, notes. Rejects zero, negative, or sub-cent amounts. Associates expense strictly with the active Financial Period; normal UI prevents logging to unactivated periods. |
| **REQ-EXP-02** | Fixed vs. Variable Tagging | Must Have | MVP | REQ-EXP-01 | Enforces binary classification: Fixed (rent, utilities) vs. Variable (groceries, leisure); computes separate totals on dashboard. |
| **REQ-EXP-03** | Default Salaried Categories | Must Have | MVP | REQ-EXP-01 | 14 pre-seeded categories tailored to salaried lifestyles (Housing, Utilities, Groceries, Healthcare, Tuition, etc.). |
| **REQ-EXP-04** | Custom Expense Categories | Should Have | Post-MVP | REQ-EXP-03 | User can create custom categories with custom icons and fixed/variable defaults. |
| **REQ-EXP-05** | Expense Ledger & Filtering | Must Have | MVP | REQ-EXP-01 | Paginated list with filtering by Financial Period, category, and expense type. |
| **REQ-EXP-06** | Expense Edit & Deletion | Must Have | MVP | REQ-EXP-01 | Full CRUD; editing/deleting expense atomically recalculates Recorded Salary Remaining (Estimate) and category totals. Stored salary records remain unchanged. |

### Module 4: Zero-Based Budgeting & Allocation (BUD)

| Req ID | Requirement Description | Priority | Target | Dependencies | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-BUD-01** | Monthly Envelope Allocation | Must Have | MVP | REQ-SAL-01 | User assigns planned spending caps to categories for a specific Financial Period. Planned allocations do not count as actual spending. |
| **REQ-BUD-02** | Unallocated Budget Pool | Must Have | MVP | REQ-SAL-01, BUD-01 | Displays `Recorded Salary - Total Planned Allocations`. Visual indicator shows when unallocated budget pool equals exactly zero (`Income - Allocations = 0`). |
| **REQ-BUD-03** | Budget vs. Actual Variance | Must Have | MVP | REQ-EXP-01, BUD-01 | Category progress bars indicate % of planned envelope consumed by actual recorded expenses; highlights over-budget envelopes. |

### Module 5: Savings Goals & Emergency Reserves (SAV)

| Req ID | Requirement Description | Priority | Target | Dependencies | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-SAV-01** | Create Savings Goal | Must Have | MVP | REQ-PROF-01 | Fields: name, category (Emergency, Retirement, Down Payment, etc.), target amount, target date. |
| **REQ-SAV-02** | Dedicated Emergency Fund | Must Have | MVP | REQ-SAV-01 | Dedicated flag `isEmergencyFund`; tracks target months of living expenses based on monthly fixed costs. |
| **REQ-SAV-03** | Record Savings Contribution | Must Have | MVP | REQ-SAL-05, SAV-01 | User manually logs contribution into a goal; associates entry with the active Financial Period; increments goal balance without being counted as an expense. Blocked if period has no recorded salary. |
| **REQ-SAV-04** | Goal Progress Visualization | Must Have | MVP | REQ-SAV-03 | Displays target vs. accumulated balance, percentage progress bar, and remaining target amount. |

### Module 6: Executive Dashboard & Analytics (DASH / REP)

| Req ID | Requirement Description | Priority | Target | Dependencies | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-DASH-01** | Selected-Period Cash Flow Summary | Must Have | MVP | REQ-SAL-01, EXP-01 | Real-time aggregate for the selected Financial Period showing Recorded Salary, Fixed Expenses, Variable Expenses, Savings Contributions, and Recorded Salary Remaining (Estimate). Excludes Post-MVP modules (Investments, Loans, Insurance). |
| **REQ-DASH-02** | Financial Health Ratios | Must Have | MVP | REQ-DASH-01 | Renders Savings Rate (`Savings / Salary * 100`) and Expense Ratio (`Expenses / Salary * 100`) with color-coded badges and explicit denominators. |
| **REQ-DASH-03** | Period Month/Year Switcher | Must Have | MVP | REQ-DASH-01 | Interactive header control to switch between active month and historical Financial Periods; queries are read-only and never mutate stored records. |
| **REQ-DASH-04** | Selected Financial Period Context | Must Have | MVP | REQ-DASH-01 | Prominently displays the active period context (e.g. `Financial Period: October 2026`). All summary cards and metrics displayed belong strictly to that period. |
| **REQ-DASH-05** | Excess Outflow Warning Presentation | Must Have | MVP | REQ-DASH-01 | When `Expenses + Savings > Salary`, primary remaining display renders `0` and an explicit alert banner displays: `Your recorded expenses and savings exceed this period's recorded salary by [Amount]`. |
| **REQ-REP-01** | Historical Reporting Ranges & Core Aggregates | Must Have | MVP | REQ-DASH-01 | Supports multi-period aggregate analysis across predefined ranges: **Last 3 Months, Last 6 Months, Last 12 Months / 1 Year, All Time**. Computes Total Salary, Total Expenses, Total Savings, Monthly Averages, and Aggregate Savings Rate. |
| **REQ-REP-02** | Advanced Trend Analytics & Visualizations | Should Have | Post-MVP | REQ-REP-01 | Graphical expenditure trends, monthly comparison matrices, and category burn shifts without synthetic data interpolation. |
| **REQ-SET-01** | CSV Financial Ledger Export | Could Have | Post-MVP | REQ-EXP-01 | Generates clean CSV file of all recorded transactions for external backup. |

---

## 5. Non-Functional Requirements

### 5.1 Performance & Scalability
- **Server-Side Render Latency:** Dashboard page SSR time must not exceed **300ms** on standard broadband connections.
- **Database Query Performance:** All queries must use indexed lookups on `[userId, periodYear, periodMonth]` executing in **< 30ms** at the database layer.
- **Pagination Contracts:** Hard maximum limit of **100 records per page**; default page size enforced at **20 records** across all queries to prevent memory exhaustion.
- **Bounded In-Memory Processing:** Aggregations must run via MongoDB aggregation pipelines or scoped indexed queries rather than loading unbounded historical documents into Node.js process memory.

### 5.2 Security & Privacy
- **Strict Tenant Isolation:** Every database operation must enforce `{ userId }` scoping. Attempting to query, mutate, or delete an unauthorized record must return an ambiguous `RecordNotFoundError` to prevent resource probing.
- **Session Protection:** Auth sessions must be managed via encrypted, `HttpOnly`, `SameSite=Lax`, `Secure` cookies. Raw tokens must never be stored in browser `localStorage`.
- **Server-Side Validation:** All inputs must be strictly validated before reaching the database. Numbers must reject negative values, sub-cent precision (>2 decimals), and amounts exceeding 90 trillion.
- **Query Parameterization:** All MongoDB queries must use object-literal query builders; zero runtime string-evaluated code (`$where` is strictly prohibited).
- **Security Headers:** Enforce `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`.

### 5.3 Accessibility (a11y)
- **WCAG Compliance:** Baseline compliance with **WCAG 2.1 Level AA**.
- **Keyboard Traversal:** Complete keyboard navigation for all interactive buttons, inputs, modals, and mobile drawers. Escape key must dismiss drawers and modals.
- **Form Association:** All form inputs must have associated `<label>` elements via `htmlFor` attributes.
- **Color Contrast:** Minimum contrast ratio of 4.5:1 for body copy and 3:1 for large graphical indicators.

### 5.4 Responsiveness
- **Device Support:** Full responsive adaptation across **Mobile (320px–640px)**, **Tablet (641px–1024px)**, and **Desktop (1025px+)**.
- **Mobile Drawer:** Flyout navigation drawer with backdrop overlay on screens `< 768px`.
- **Mobile Touch Targets:** Minimum 44x44px touch targets on mobile viewports for all interactive controls.
- **Numeric Keypads:** Monetary input fields must specify `inputMode="decimal"` and `step="0.01"` to trigger appropriate mobile keyboards.

### 5.5 Reliability & Financial Correctness
- **Decimal128 Invariance:** All monetary amounts stored in MongoDB must use `Decimal128`. Floating-point `double` fields are strictly forbidden for money.
- **Minor-Unit Arithmetic:** All internal math in [`lib/calculations/financial.ts`](file:///c:/1.%20MY%20PROJECTS/SALARY%20MS/fin-track/lib/calculations/financial.ts) must scale to integer minor units (cents/paisa: `amount * 100`) before returning cleanly rounded results, guaranteeing zero floating-point drift.
- **Defensive Edge Handling:** Calculation utilities must safely return `0` on division-by-zero, `NaN`, or `Infinity` without throwing unhandled exceptions.

### 5.6 Maintainability
- **TypeScript Strictness:** Strict mode enabled (`"strict": true`) with zero untyped `any` allowances.
- **Modular Architecture:** Clear boundary separation: Presentation (`components/`), Domain Calculations (`lib/calculations/`), Data Access Layer (`lib/db/repositories/`), and Database Models (`lib/db/models/`).
- **Automated Verification:** All financial calculations and repository invariants backed by regression test suites ([`scripts/verify-calculations.ts`](file:///c:/1.%20MY%20PROJECTS/SALARY%20MS/fin-track/scripts/verify-calculations.ts)).

---

## 6. User Roles & Ownership Boundaries

Fintrack is a private personal finance tool designed for individual use. 

### Role Evaluation
An administrative role with visibility into user ledgers is **intentionally excluded** to preserve user privacy and data security. System administrators maintain infrastructure access (server logs, deployment metrics) but possess zero application-level access to browse or query personal financial ledgers.

### Role & Ownership Matrix

| Operation / Resource | Personal Finance User (`USER`) | Platform Admin / Support (Infrastructure Only) |
| :--- | :--- | :--- |
| **Own Financial Profile** | Full Access (Create, Read, Update, Reset) | No Access |
| **Own Salary Records** | Full Access (CRUD on own records only) | No Access |
| **Own Expenses & Categories** | Full Access (CRUD on own records only) | No Access |
| **Own Budgets & Savings Goals** | Full Access (CRUD on own goals only) | No Access |
| **Cross-Tenant Records** | Strictly Forbidden (Query blocked at DAL) | Strictly Forbidden |
| **System Health & Logs** | No Access | Read-Only (Anonymized server metrics & errors) |
| **Global Category Templates** | Read-Only (14 system default categories) | Read-Only (Managed via codebase seeds) |

---

## 7. Primary User Journeys (Business Level)

### Journey 1: New User Onboarding & First Financial Period Setup
```
[User Registration] ──► [Auth.js Session Created] ──► [Profile Setup: Currency (PKR)]
                                                              │
                                                              ▼
[Dashboard Initialized] ◄── [Activate Financial Period] ◄── [Select Month & Record Salary]
```
1. **Registration:** User creates an account with email and password; session cookie is issued.
2. **Profile Setup:** User selects base currency (mandatory, default: PKR), with optional non-blocking setup for monthly income target and emergency fund horizon (default: 6 months).
3. **First Financial Period Activation:** User explicitly selects their initial Financial Period (e.g., October 2026) and records their primary monthly salary amount.
4. **Dashboard View:** User lands on `/dashboard`, displaying their active Financial Period context, recorded salary, and unallocated budget pool.

### Journey 2: Monthly Financial Period Activation & Zero-Based Allocation
```
[Select Calendar Month] ──► [Record Primary Salary] ──► [Financial Period Activated]
                                                                  │
                                                                  ▼
[Zero Unallocated Pool] ◄── [Assign Category Envelopes] ◄── [Open /budget Planning View]
```
1. **Financial Period Selection:** User explicitly selects the calendar month for the new period (e.g., November 2026). The system never guesses or infers the period from payment dates.
2. **Salary Recording:** User logs their primary net salary amount for the selected period without bank-feed verification.
3. **Period Activation:** Storing the salary activates the November 2026 Financial Period, making it available for monthly budgeting, expense logging, and savings contributions.
4. **Allocation Planning:** User enters `/budget` where the unallocated budget pool equals the recorded salary.
5. **Partitioning:** User assigns planned envelopes to Fixed Living Costs, Savings Goals, and Variable categories until unallocated budget pool reaches zero (`Income - Allocations = 0`), establishing a balanced monthly plan.

### Journey 3: Expense Logging & Budget Burn
```
[Select Active Financial Period] ──► [Open Log Expense Form] ──► [Server Validation]
                                                                        │
                                                                        ▼
[Dashboard Alert / Excess Warning] ◄── [Recalculate Remaining] ◄── [Persist Record in MongoDB]
```
1. **Prerequisite Check (Sequential Gating):** Normal UI requires an active Financial Period with recorded salary. If no period exists, the user is redirected to activate the period and record salary first.
2. **Entry:** User logs amount, transaction date, description, category, and classification (`Fixed` vs. `Variable`) within the selected Financial Period. The transaction date provides chronological sorting within the period but does not override the user-selected Financial Period boundary.
3. **Validation:** Server verifies amount > 0, <= 2 decimal places, valid calendar date, and valid category.
4. **Persistence:** Document is saved to MongoDB under the user's `userId` and associated with the selected Financial Period.
5. **Budget Impact & Excess Warning:** Recorded Salary Remaining (Estimate) is recomputed (`Recorded Salary - Actual Expenses - Actual Savings`). Category budget progress bar increments. If actual spending and savings exceed the period's recorded salary, the primary remaining estimate displays `PKR 0` alongside an explicit warning banner: *"Your recorded expenses and savings exceed this period's recorded salary by [Excess Amount]"*. Stored salary records are never altered.

### Journey 4: Financial Period Revision & Historical Edit Workflow
```
[Select Historical Period] ──► [Edit Salary / Expense / Savings] ──► [Server Validation]
                                                                            │
                                                                            ▼
[Historical Analytics Recalculated] ◄── [Recalculate Period Snapshot] ◄── [Update MongoDB Document]
```
1. **Period Selection:** User navigates to an older, completed Financial Period (e.g., September 2026) using the period switcher.
2. **Edit Action:** User modifies a recorded salary figure, expense item, or savings contribution belonging to that period (e.g., correcting an invoice or logging a retroactive utility payment).
3. **Validation:** New amounts are validated against precision rules (`<= 90 trillion`, `<= 2 decimals`).
4. **Isolated Period Recalculation:** That specific Financial Period's calculations and dashboard metrics update immediately via pure deterministic functions. Other Financial Periods (e.g., October, November) remain completely untouched and independent.
5. **Cross-Period Analytics Update:** Historical aggregate reports (Last 3M, 6M, 12M, All Time) automatically recompute from the updated underlying raw records upon request.

### Journey 5: Savings Goal Contribution
```
[Select Active Financial Period] ──► [Log Contribution Record] ──► [Goal Balance Increments]
                                                                          │
                                                                          ▼
[Emergency Runway Extended] ◄── [Non-Expense Accounting] ◄── [Recalculate Remaining Estimate]
```
1. **Prerequisite Check:** Requires an active Financial Period with recorded salary.
2. **Contribution Entry:** User logs a cash allocation into their Emergency Fund or Wealth Creation goal under `/savings` for the selected period.
3. **Accounting Check:** System increments the goal's accumulated total and accounts for it as actual savings. The contribution is strictly **not** added to monthly expenses.
4. **Metric Update:** Monthly savings rate increases; emergency fund runway indicator recomputes; Recorded Salary Remaining (Estimate) decreases by the savings contribution amount.

### Journey 6: Cross-Period Historical Analytics & Reporting Audit
```
[Navigate to /reports] ──► [Select Reporting Range (3M/6M/12M/All)] ──► [Aggregate Raw Period Records]
                                                                                │
                                                                                ▼
[Long-Term Financial Strategy] ◄── [Evaluate Savings Rate & Trends] ◄── [Render Multi-Period Metrics]
```
1. **Reporting Range Selection:** User navigates to `/reports` and selects a predefined historical reporting range: **Last 3 Months, Last 6 Months, Last 12 Months / 1 Year, or All Time**.
2. **Multi-Period Aggregation:** The reporting engine aggregates underlying independent Financial Period records across the selected window without cross-period data leakage.
3. **Core Metric Evaluation:** User reviews aggregated metrics: Total Recorded Salary, Total Actual Expenses, Total Actual Savings, Average Monthly Salary, Average Monthly Expenses, Average Monthly Savings, and Aggregate Savings Rate (`Total Savings ÷ Total Recorded Salary × 100`).
4. **Strategic Planning:** Historical trendlines provide factual baseline data to guide future monthly zero-based budget allocations.

---

## 8. Financial Business Rules

| Rule ID | Financial Business Principle | Enforcement in Fintrack |
| :--- | :--- | :--- |
| **FBR-01** | **Manually Recorded Salary & Period Activation:** Salary is a recorded value, not independently verified cash. | Recorded as an input value for the user-selected calendar month. Storing primary salary activates the Financial Period. No bank verification, no automated guessing from transaction dates, and no Pending/Received states. |
| **FBR-02** | **Planned Allocation vs. Actual Spending:** Planned budgets must not be conflated with actual expenses. | Budget envelopes represent spending intentions. Actual expenses are independent transactions that consume envelope limits. |
| **FBR-03** | **Actual Savings vs. Goal Targets:** Savings goals are target milestones; actual savings are distinct deposited records. | Decoupled into `SavingsGoal` (the target) and `SavingsRecord` (the actual accumulated deposits). |
| **FBR-04** | **Savings Non-Duplication:** Savings contributions must never be counted as expenses. | The allocation engine treats expenses and savings contributions as mutually exclusive buckets. |
| **FBR-05** | **No Account-Ledger Internal Transfers:** Unified single inflow pool in MVP. | Because individual bank accounts (HBL, Meezan, cash) are excluded from MVP, account-to-account transfer rules are omitted. |
| **FBR-06** | **Zero Invented Historical Data & Sequential Gating:** Missing months must never be filled with synthetic data. | Missing periods evaluate strictly to zero. Normal UI flow prevents expense/savings logging without an active period with recorded salary. No synthetic interpolation or phantom records. |
| **FBR-07** | **Explicit Forecast Labeling:** Any future projections must be strictly flagged. | Projections and targets are visually isolated from historical recorded ledger data. |
| **FBR-08** | **Reconciliation Consistency:** Record edits must immediately re-aggregate all metrics. | All dashboard aggregates are pure functions computed on demand from raw records, preventing stale cached states. |
| **FBR-09** | **Monetary Precision Strategy:** Zero floating-point arithmetic drift. | All money stored in MongoDB as `Decimal128` and computed in Node.js via minor-unit integer scaling (`safeAdd`, `safeSubtract`, `safeSum`). |
| **FBR-10** | **Multi-Tenant Ledger Isolation:** Absolute privacy and data segregation. | Every database read/write is strictly scoped by `userId`. Cross-tenant queries return `RecordNotFoundError`. |
| **FBR-11** | **Sequential Monthly Record Gating:** `Financial Period → Recorded Salary → Expenses / Savings`. | Normal application workflow strictly requires an active Financial Period with recorded salary before monthly expenses or savings contributions can be entered. |
| **FBR-12** | **Financial Period Independence & Isolation:** Each monthly period is an isolated ledger. | Modifying an older Financial Period updates only that period's calculations and cross-period aggregates recomputed from raw records; other periods remain completely unaffected. |
| **FBR-13** | **Excess Outflow Presentation Rule:** Outflows exceeding salary trigger explicit warnings without misleading negatives. | When `Expenses + Savings > Recorded Salary`, the system preserves the signed value internally, but displays primary Remaining Estimate as `PKR 0` alongside an explicit warning banner: *"Your recorded expenses and savings exceed this period's recorded salary by PKR X."* |
| **FBR-14** | **Single Primary Salary Rule (MVP):** Exactly one primary salary record per Financial Period. | MVP assumes a single primary monthly salary per Financial Period. Additional income streams are logged as a separate open decision/enhancement. |
| **FBR-15** | **Percentage & Denominator Discipline:** All analytical percentages require explicit, unambiguous denominators. | Savings Rate across any selected reporting range is strictly: `Total Savings ÷ Total Recorded Salary × 100`. Categories shown in allocation charts must not double-count overlapping funds. |
| **FBR-16** | **MVP Calculation Kernel Boundary:** Exclude Post-MVP balance sheet modules from MVP math. | MVP calculation kernel is strictly: `Recorded Salary Remaining (Estimate) = Recorded Salary - Actual Expenses - Actual Savings`. Investments, Loans, and Insurance remain Post-MVP and are excluded from the MVP calculation kernel. |

---

## 9. Assumptions and Technical/Product Constraints

### 9.1 Confirmed Assumptions
1. **Financial Period as Authoritative Monthly Boundary:** Salaried users operate under user-selected calendar months (`periodYear`, `periodMonth`). The application associates all monthly records with the explicitly selected Financial Period and never guesses or infers the period from transaction or payment dates.
2. **Sequential Record Gating:** An active Financial Period with recorded salary is a strict prerequisite before monthly expenses or savings contributions can be logged in normal workflows (`Financial Period → Recorded Salary → Expenses / Savings`).
3. **Single Primary Salary per Period (MVP):** Each Financial Period is defined by one primary recorded net monthly salary. Multi-stream income is deferred as an explicit open decision.
4. **Period Independence & Isolation:** Each Financial Period is completely independent. Editing an older period recalculates that period's snapshot and re-aggregates historical reports from raw documents without mutating other periods.
5. **Manual Record-Keeping:** Users take responsibility for manually entering salary and daily expenses; Fintrack provides validation, aggregation, and visual planning.
6. **Single Base Currency:** An individual user operates under one chosen base currency (default: PKR); multi-currency conversion is not required in MVP.
7. **Unified Monthly Inflow Pool:** Recorded salary constitutes the unallocated budget pool for that specific period; no bank account partitioning.

### 9.2 Technical Constraints
1. **Next.js 16 App Router & React 19:** Built on modern Next.js server components, server actions, and Turbopack.
2. **Database Engine: MongoDB + Mongoose:** Confirmed standard. All monetary amounts stored as `Decimal128`.
3. **Minor-Unit Integer Arithmetic:** In-memory calculations must scale amounts to cents/paisa (`amount * 100`) within JavaScript safe integer limits (`<= 90 trillion currency units`).
4. **Server-Side Authorization:** Tenant verification and input validation must run strictly on the server; client requests are never trusted.

### 9.3 Product Constraints
1. **No Third-Party Banking APIs:** Zero dependency on external banking aggregators, screen scrapers, or payment gateways. Fintrack is a manual record-keeping application, not a bank.
2. **Zero Automated Ledger Guesses:** If a user forgets to log an expense, Fintrack does not infer or guess transactions. Payment dates never override user-selected Financial Periods.
3. **Sequential Outflow Gating:** The normal UI flow strictly prevents creating expenses or savings for a month that does not have an active Financial Period with recorded salary.

---

## 10. High-Level MVP Acceptance Criteria

The MVP will be accepted as complete when all the following conditions are verified:

1. **Functional End-to-End Flow:** A user can register, log in, configure profile currency, explicitly select a calendar month to activate a Financial Period, record primary salary, allocate zero-based budget envelopes, log fixed/variable expenses, contribute to savings goals, view isolated period dashboard metrics, and inspect historical reports across Last 3M, Last 6M, Last 12M, and All Time.
2. **Calculation Determinism & Kernel Boundary:** 100% of calculation test suites pass with zero floating-point rounding errors using the MVP formula: `Recorded Salary Remaining (Estimate) = Recorded Salary - Actual Expenses - Actual Savings`. Post-MVP modules (Investments, Loans, Insurance) are excluded from the kernel calculation.
3. **Excess Outflow Warning Presentation:** When `Actual Expenses + Actual Savings > Recorded Salary`, the system preserves the signed value internally, but displays primary Remaining Estimate as `PKR 0` alongside an explicit warning banner: *"Your recorded expenses and savings exceed this period's recorded salary by [Amount]"*.
4. **Sequential Record Gating:** Automated UI tests verify that a user cannot log expenses or savings for a month without first selecting the calendar month and recording its salary.
5. **Period Isolation & Edit Integrity:** Editing a historical Financial Period recomputes that period's metrics and historical multi-period aggregates without mutating neighboring periods.
6. **Savings Integrity:** Depositing funds into a savings goal increments the goal balance and increases the savings rate without increasing total expenses.
7. **Multi-Tenant Security:** Automated tests verify that User A cannot read, query, update, or delete any record belonging to User B.
8. **Validation Hardening:** Server rejects negative amounts, zero amounts (where disallowed), sub-cent precision (>2 decimals), and invalid category IDs.
9. **Responsive Layout & Period Context:** Clean visual presentation across mobile (320px), tablet (768px), and desktop (1280px) with unambiguous display of the currently selected Financial Period.
10. **Accessibility Baseline:** Form inputs have associated labels, interactive elements support keyboard tabbing, and contrast meets WCAG AA standards.
11. **Performance Baseline:** Dashboard SSR latency < 300ms on standard connections; indexed queries execute in < 30ms.

---

## 11. Risk Register

| Risk ID | Risk Description | Prob | Impact | Severity | Mitigation Strategy | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-01** | **Database Duality / Incomplete Migration:** Mixed MongoDB and Prisma code causing runtime failures. | High | Critical | **CRITICAL** | Consolidated on MongoDB + Mongoose. Phase 4/5 will formally deprecate Prisma artifacts and rewrite remaining DAL repositories to Mongoose. | **Resolved by Decision** |
| **RSK-02** | **Floating-Point Arithmetic Drift:** Financial totals display `.000000004` rounding artifacts, destroying user trust. | Low | Critical | **High** | Enforced integer minor-unit arithmetic and `Decimal128` storage. Verified with 80+ automated assertions in `scripts/verify-calculations.ts`. | **Mitigated in Engine** |
| **RSK-03** | **Tenant Data Leakage:** Missing `userId` check in queries exposing cross-tenant financial records. | Medium | Critical | **CRITICAL** | Enforced tenant scoping on every repository query; automated cross-tenant security test suite in Phase 8/10. | **Mitigated in DAL Design** |
| **RSK-04** | **Conflating Allocations with Actual Spending:** Planned budgets mistakenly reducing recorded salary remaining estimate. | Low | High | **Medium** | Architectural separation between `Budget` (planned) and `Expense` (actual) models and calculations. | **Mitigated in Requirements** |
| **RSK-05** | **Scope Creep (Premature Feature Bloat):** Attempting to build Loans, Insurance, and Investments before cash flow works. | High | High | **High** | Strictly bounded MVP to Salary, Expenses, Budgeting, and Savings. Balance sheet modules deferred to Post-MVP. | **Addressed in Scope Doc** |
| **RSK-06** | **Unauthenticated Route Access:** App routes accessible without valid session cookie. | Medium | Critical | **CRITICAL** | Implement centralized Next.js route middleware in Phase 8 checking session on all `/(app)/*` routes. | **Scheduled for Phase 8** |
| **RSK-07** | **Unbounded Aggregation Query:** Dashboard scanning entire historical collections, slowing down SSR. | Medium | Medium | **Medium** | MongoDB compound indexes on `(userId, periodYear, periodMonth)`; queries strictly bounded by active period. | **Designed in Mongoose** |
| **RSK-08** | **Mobile Input Friction:** Numeric keyboard not appearing on mobile expense entry. | High | Medium | **Medium** | Specify `inputMode="decimal"` and `step="0.01"` on all monetary inputs during Phase 7 frontend engineering. | **Documented for UI** |

---

## 12. Dependency Map

### Global Phase Progression (Strict Sequential Phases)
```
Phase 1: Project Discovery & Requirements (CURRENT - COMPLETED)
   │
   ▼
Phase 2: Information Architecture & User Flows
   │
   ▼
Phase 3: Wireframes & UI/UX Design
   │
   ▼
Phase 4: Technical Architecture & Stack
   │
   ▼
Phase 5: Database & Data Modeling
   │
   ▼
Phase 6: Backend Engineering & API Design
   │
   ▼
Phase 7: Frontend Engineering
   │
   ▼
Phase 8: Authentication, Security & Privacy
   │
   ▼
Phase 9: Integration & End-to-End Workflows
   │
   ▼
Phase 10: Testing & Quality Assurance
   │
   ▼
Phase 11: Deployment & DevOps
   │
   ▼
Phase 12: Documentation & Handover
   │
   ▼
Phase 13: Monitoring, Maintenance & Future Development
```

### Internal Data & Module Dependencies
```
[User Profile & Base Currency]
          │
          ▼
   [Salary Inflow] ────────┐
          │                 │
          ▼                 ▼
[Zero-Based Budget]   [Executive Dashboard] ◄── [Category Registry]
          │                 ▲                             │
          ▼                 │                             ▼
[Expense Tracker] ─────────┤                      [Expense Records]
                            │
[Savings Goals] ────────────┘
          │
          ▼
[Savings Records]
```
- **Salary Inflow** creates the monthly recorded income pool.
- **Zero-Based Budget** assigns planned envelopes against the recorded income pool.
- **Expenses** consume category envelopes and reduce the Recorded Salary Remaining (Estimate). Stored salary records are never modified.
- **Savings Goals** receive recorded savings contributions without inflating expenses.
- **Dashboard** consumes records from Salary, Expenses, and Savings to compute real-time ratios.

---

## 13. Existing Implementation Audit

| Subsystem / File | Inspected State in Repository | Classification | Audit Evaluation & Action Plan |
| :--- | :--- | :--- | :--- |
| **Domain Calculations** ([`lib/calculations/financial.ts`](file:///c:/1.%20MY%20PROJECTS/SALARY%20MS/fin-track/lib/calculations/financial.ts)) | Pure functions; minor-unit arithmetic; handles NaN/Infinity/zero safe division. Note: includes Post-MVP fields (investments, insurance, loans) in `totalAllocated` and `remainingIncome`. | **Requires MVP Alignment in Phase 4/6** | High arithmetic quality, but formulas must be scoped to MVP (Salary, Expenses, Savings) without silently expanding MVP scope or failing when Post-MVP records are omitted. |
| **Calculation Verification** ([`scripts/verify-calculations.ts`](file:///c:/1.%20MY%20PROJECTS/SALARY%20MS/fin-track/scripts/verify-calculations.ts)) | 1,564 lines; 80+ assertions testing arithmetic, precision, Mongoose models, and mappers. | **Correct and reusable** | Passes 100% (0 failures). Core regression test suite for CI/CD pipeline. |
| **Formatters & Constants** ([`lib/utils/formatters.ts`](file:///c:/1.%20MY%20PROJECTS/SALARY%20MS/fin-track/lib/utils/formatters.ts), [`lib/constants/`](file:///c:/1.%20MY%20PROJECTS/SALARY%20MS/fin-track/lib/constants/)) | Currency formatters (PKR default, USD, EUR, etc.), date formatters, 14 default categories. | **Correct and reusable** | Fully aligned with domain requirements. Reusable across UI components. |
| **MongoDB Precision Layer** ([`lib/db/decimal.ts`](file:///c:/1.%20MY%20PROJECTS/SALARY%20MS/fin-track/lib/db/decimal.ts)) | `Decimal128` converters, max 90T limit, sub-cent fraction guards. | **Correct and reusable** | Production-ready for MongoDB standard. |
| **Mongoose Models** ([`lib/db/models/`](file:///c:/1.%20MY%20PROJECTS/SALARY%20MS/fin-track/lib/db/models)) | 14 Mongoose models with `Decimal128`, tenant `userId` indexes. | **Partially aligned** | Matches confirmed DB direction. Requires adding dedicated `Budget` schema in Phase 5. |
| **Mongoose Mappers** ([`lib/db/mongo-mappers.ts`](file:///c:/1.%20MY%20PROJECTS/SALARY%20MS/fin-track/lib/db/mongo-mappers.ts)) | Converts Mongoose docs to domain types. | **Correct and reusable** | Fully aligned with MongoDB foundation. |
| **Salary Repository** ([`lib/db/repositories/salary.ts`](file:///c:/1.%20MY%20PROJECTS/SALARY%20MS/fin-track/lib/db/repositories/salary.ts)) | Built on Mongoose; full tenant validation, pagination, Decimal128 handling. | **Correct and reusable** | Production-ready pattern for data access layer. |
| **Expense/Savings/Invest/Ins Repositories** | Built on Prisma/PostgreSQL; imports `prisma`. | **Needs redesign later** | Legacy implementation from prior architecture. Must be migrated to Mongoose in Phase 6. |
| **Prisma Schema & Mappers** ([`prisma/schema.prisma`](file:///c:/1.%20MY%20PROJECTS/SALARY%20MS/fin-track/prisma/schema.prisma), [`lib/db/mappers.ts`](file:///c:/1.%20MY%20PROJECTS/SALARY%20MS/fin-track/lib/db/mappers.ts)) | PostgreSQL schema with `Decimal(14,2)` and Prisma mappers. | **Should not be carried forward** | Legacy artifacts. Will be decommissioned after DAL consolidation. |
| **Loan Repository** | Non-existent in `lib/db/repositories/`. | **Needs redesign later** | Missing entirely. Scheduled for Post-MVP. |
| **Application Shell** ([`components/layout/`](file:///c:/1.%20MY%20PROJECTS/SALARY%20MS/fin-track/components/layout)) | Desktop sidebar, mobile drawer, sticky header, active route highlights. | **Correct and reusable** | Clean, responsive UI shell. Ready to host real pages. |
| **Application Routes** ([`app/(app)/*`](file:///c:/1.%20MY%20PROJECTS/SALARY%20MS/fin-track/app/(app))) | 9 routes rendering static `PlaceholderCard` components. | **Should not be carried forward** | Placeholders will be replaced with real interactive page components in Phase 7. |
| **Authentication & Middleware** | No auth library, no session token logic, no route middleware. | **Needs redesign later** | To be implemented using Auth.js in Phase 8. |

---

## 14. Remaining Open Questions & Unresolved Dependencies

All five foundational architectural decisions (Database engine, Manual salary entry, Single inflow pool, Zero-Based Budgeting model, Auth.js direction) and all four foundational financial domain rules have been formally resolved and integrated into the canonical requirements.

### 14.1 Resolution of Previous Blocking Financial Domain Dependencies (Approved & Closed)
1. **Period Attribution Policy: RESOLVED**
   - *Confirmed Rule:* Fintrack MVP uses a user-selected calendar month as the authoritative **Financial Period** (e.g., October 2026, November 2026).
   - *System Behavior:* The system associates all monthly financial records with the user-selected Financial Period and does not guess or infer the period from payment or transaction entry dates. If individual transaction dates are entered for chronological tracking within the month, they do not override the user-selected Financial Period.
2. **Missing-Salary Dashboard/Entry Behavior: RESOLVED for Normal MVP Workflow**
   - *Confirmed Rule:* Sequential record gating is strictly enforced: `Financial Period → Recorded Salary → Expenses / Savings`.
   - *System Behavior:* A user must select a calendar month and record its primary salary to activate the Financial Period before any monthly expenses or savings can be entered. The normal UI workflow strictly blocks expense and savings entry when no Financial Period with recorded salary exists for that month. Potential edge cases regarding legacy or orphan records are retained as future data-integrity considerations rather than expanding MVP scope.
3. **Excess-Outflow Warning Specification: RESOLVED**
   - *Confirmed Rule:* When cumulative recorded actual expenses and actual savings exceed the period's recorded salary (`Actual Expenses + Actual Savings > Recorded Salary`):
     - The underlying signed arithmetic calculation is preserved internally for precision and mathematical correctness.
     - The primary user-facing remaining estimate displays `PKR 0` rather than a misleading negative spendable amount.
     - An explicit visual warning banner is rendered: *"Your recorded expenses and savings exceed this period's recorded salary by PKR X."*
4. **Investments Scope & Calculation Kernel Reconciliation: RESOLVED**
   - *Confirmed Rule:* Investments, Loans, and Insurance remain strictly Post-MVP.
   - *System Behavior:* The MVP calculation kernel is cleanly scoped to:
     $$\text{Recorded Salary Remaining (Estimate)} = \text{Recorded Salary} - \text{Actual Expenses} - \text{Actual Savings}$$
     Post-MVP balance sheet modules are excluded from MVP calculations and dashboard summaries.

### 14.2 Remaining Non-Blocking Future Open Decisions (Scheduled for Subsequent Phases)
The following items do not block Phase 2 Information Architecture and are scheduled for detailed design in their respective implementation phases:
1. **Financial Period Deletion & Cascade Policy (Phase 5 / Phase 6):**
   - *Open Decision:* If a user initiates deletion of an existing Financial Period, should the system perform a cascading purge of associated expenses and savings, apply soft-deletion/archival, or disallow deletion until child records are manually removed? To be determined during Phase 5 Data Modeling.
2. **Multi-Stream Salary & Secondary Incomes (Phase 5 / Phase 6 Enhancement):**
   - *Open Decision:* Fintrack MVP assumes exactly one primary recorded monthly salary per Financial Period. Extending the schema to support secondary income streams (freelance, bonuses, rental income) is cataloged as a future enhancement requiring product design approval.
3. **Authentication Session Adapter vs. Stateless JWT (Phase 4 / Phase 8):**
   - *Options:* Auth.js with MongoDB database session adapter vs. stateless encrypted JWT session cookies.
4. **Budget Rollover Policy (Phase 5 / Phase 6):**
   - *Options:* Strict zero-reset each month vs. optional surplus/deficit rollover to the following month's envelope.
5. **CSV Export Specification (Post-MVP Phase D):**
   - *Options:* Flat single-ledger export vs. multi-tab breakdown (Salary, Expenses, Savings).

---

## 15. Project Phase Checklist

### Phase 1 — Discovery & Requirements
- [x] Project purpose
- [x] Target users
- [x] Business goals
- [x] Value proposition
- [x] Scope
- [x] MVP
- [x] Future scope
- [x] Functional requirements
- [x] Non-functional requirements
- [x] Roles/permissions
- [x] Primary user journeys
- [x] Acceptance criteria
- [x] Assumptions
- [x] Constraints
- [x] Risks
- [x] Dependencies
- [x] Existing implementation audit
- [x] Open questions resolved (All 4 foundational domain blockers resolved; non-blocking implementation decisions cataloged in Section 14.2)

### Phase 2 — Information Architecture
- [ ] Sitemap
- [ ] Route inventory
- [ ] Navigation hierarchy
- [ ] User-flow diagrams
- [ ] Role-based access matrix

### Phase 3 — UI/UX
- [ ] Wireframes
- [ ] Design system
- [ ] Component inventory
- [ ] Responsive behavior
- [ ] UI states
- [ ] Accessibility specifications

### Phase 4 — Architecture
- [ ] Architecture diagram
- [ ] Technology decisions
- [ ] Folder structure
- [ ] Module boundaries
- [ ] Environment configuration
- [ ] ADRs

### Phase 5 — Database
- [ ] Entities
- [ ] Relationships
- [ ] Schema
- [ ] Data dictionary
- [ ] Indexes
- [ ] Validation
- [ ] Migration strategy
- [ ] Backup strategy

### Phase 6 — Backend/API
- [ ] API specification
- [ ] Validation
- [ ] Authorization
- [ ] Business logic
- [ ] Error handling
- [ ] Logging
- [ ] API documentation

### Phase 7 — Frontend
- [ ] Application shell
- [ ] Pages
- [ ] Components
- [ ] Forms
- [ ] API integration
- [ ] Responsive behavior
- [ ] Accessibility

### Phase 8 — Security
- [ ] Threat model
- [ ] Auth security
- [ ] Authorization tests
- [ ] Secrets policy
- [ ] Privacy requirements

### Phase 9 — Integration
- [ ] End-to-end workflows
- [ ] Integration tests
- [ ] Failure handling

### Phase 10 — QA
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Accessibility
- [ ] Performance
- [ ] Browser testing
- [ ] Build/lint/type checks

### Phase 11 — Deployment
- [ ] Environments
- [ ] Secrets
- [ ] Hosting
- [ ] Database
- [ ] CI/CD
- [ ] Monitoring
- [ ] Backup/recovery
- [ ] Rollback

### Phase 12 — Documentation
- [ ] README
- [ ] Setup guide
- [ ] Architecture documentation
- [ ] API documentation
- [ ] Troubleshooting
- [ ] Handover

### Phase 13 — Maintenance
- [ ] Monitoring
- [ ] Dependency updates
- [ ] Backup verification
- [ ] Feedback loop
- [ ] Prioritized backlog
- [ ] Versioning strategy

---

## 16. Phase 1 Gate Decision & Audit Status

### PHASE 1 STATUS: COMPLETE (Canonical Requirements Formally Approved)

**Summary of Confirmed Foundational Architectural & Product Decisions:**
1. **Core Monthly Boundary (Financial Period Model):** Fintrack operates on the **Financial Period**, representing a user-selected calendar month (e.g., October 2026). The user explicitly selects the month when recording salary, which activates that period. The system never guesses or infers periods from payment or transaction dates.
2. **Sequential Record Gating:** Enforced workflow: `Financial Period → Recorded Salary → Expenses / Savings`. Normal UI prevents creating expenses or savings unless an active Financial Period with recorded salary exists for that month.
3. **Monthly Period Independence & Historical Editability:** Each Financial Period is completely isolated. A user can return to any past period and edit its salary, expenses, or savings; recomputation updates only that period's snapshot and re-aggregates multi-period historical reports from raw records without mutating other periods.
4. **Single Primary Salary (MVP):** MVP assumes exactly one primary recorded monthly salary per Financial Period.
5. **MVP Calculation Kernel Boundary:** Excludes Post-MVP modules (Investments, Loans, Insurance). Kernel formula is strictly:
   $$\text{Recorded Salary Remaining (Estimate)} = \text{Recorded Salary} - \text{Actual Expenses} - \text{Actual Savings}$$
6. **Excess Outflow Presentation Rule:** When outflows exceed recorded salary, internal calculations remain signed for accuracy, but the primary user-facing remaining estimate displays `PKR 0` alongside an explicit warning banner showing the excess amount.
7. **Selected-Period Dashboard Context:** The dashboard provides unambiguous visibility into the currently active/selected Financial Period context and displays period-specific metrics (Recorded Salary, Actual Expenses, Actual Savings, Recorded Salary Remaining Estimate).
8. **Historical Reporting Ranges:** Multi-period historical analysis across predefined reporting ranges: **Last 3 Months, Last 6 Months, Last 12 Months / 1 Year, and All Time**. Metrics include Totals, Monthly Averages, and Aggregate Savings Rate ($\text{Total Savings} \div \text{Total Recorded Salary} \times 100$).
9. **Budgeting & Accounting Rules:** Zero-Based Budgeting model where planned category envelopes are strictly distinguished from actual recorded expenses and actual savings contributions.
10. **Database & Auth Standards:** Standardized on **MongoDB + Mongoose** with `Decimal128` monetary precision and **Auth.js** server-side authorization.

**Gate Evaluation:**
All four previously blocking financial domain dependencies (Period Attribution, Missing-Salary behavior, Excess-Outflow presentation, and Investments scope reconciliation) have been definitively resolved and documented. Terminology across the entire document conforms strictly to manual personal finance principles. The requirements are fully aligned, mathematically grounded, and internally consistent.

**Gate Outcome:** **PHASE 1 COMPLETE — APPROVED FOR PHASE 2.**

---

## 17. Recommended Next Action

Proceed strictly to **Phase 2: Information Architecture & User Flows** to align the sitemap, routes, navigation hierarchy, user-flow diagrams, and screen-state contracts with the approved Financial Period Model. Do not start Phase 3 design work or modify application code.
