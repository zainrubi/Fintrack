# FINTRACK — PHASE 1: PROJECT DISCOVERY & REQUIREMENTS SPECIFICATION

**Project:** Fintrack (Personal Salary & Wealth Management Web Application)  
**Engineering & Product Council:** Senior Product Engineer, Software Architect, Business Analyst, UI/UX Designer, Database Architect, QA Engineer, Security Engineer, DevOps Engineer, Technical Project Manager  
**Phase:** Phase 1 — Project Discovery & Requirements  
**Status:** **PHASE 1 STATUS: COMPLETE**  
**Document Version:** 1.0.0 (Final Approved Baseline)  
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
*"Salary-First Financial Discipline."* Fintrack transforms payday from a passive bank notification into an active, planned allocation event, securing your emergency reserves, investments, and non-negotiable living commitments before discretionary spending begins.

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

### 3.1 Core Domain Terminology & Accounting Concepts
To prevent ambiguity, Fintrack maintains strict boundaries between five foundational financial concepts:

1. **Recorded Salary / Income:** The user-stated numerical compensation received for a given pay period, logged manually as a historical entry without bank-feed verification.
2. **Actual Recorded Expenses:** User-logged out-of-pocket cash outflows categorized as Fixed (rent, tuition, utilities) or Variable (groceries, dining, entertainment) that have actually been spent.
3. **Actual Recorded Savings:** Specific manual deposits or transfers logged into dedicated reserve buckets/goals (e.g., Emergency Fund). Distinct from general unspent cash.
4. **Planned Budget Allocations:** Forward-looking intentions assigning currency envelopes to specific expense or savings categories for the pay period. **Planned allocations are NOT actual spending and NOT actual savings.**
5. **Unallocated or Remaining Recorded Amount:**
   - *Unallocated Budget Pool:* `Recorded Net Salary - Total Planned Allocations`. In Zero-Based Budgeting, the user's objective is to allocate every rupee so this reaches zero.
   - *Actual Remaining Cash Burn:* `Recorded Net Salary - (Actual Recorded Expenses + Actual Recorded Savings Contributions)`. This reflects how much of the recorded paycheck has not yet been spent or set aside.

### 3.2 MVP Scope (In Scope)
- **User Authentication:** Email/password authentication using Auth.js (self-managed credentials and session cookies).
- **User Financial Profile:** Default currency selection (PKR default), monthly income target, emergency fund target months.
- **Salary Management:** Manual recording of salary inflow by pay period (month/year), payment date, source, and salary type (primary, bonus, freelance).
- **Expense Tracking:** Manual logging of expenditures with strict classification into **Fixed** or **Variable**, categorized across 14 pre-seeded categories.
- **Zero-Based Budget Allocation:** Setting planned category envelopes against recorded monthly salary and monitoring budget vs. actual consumption.
- **Savings Goals & Emergency Reserve:** Dedicated emergency fund tracking and goal contribution logging (ensuring savings are not double-counted as expenses).
- **Executive Financial Dashboard:** Dynamic aggregation displaying Recorded Net Salary, Fixed vs. Variable Expenses, Total Savings, Remaining Unspent Balance, Savings Rate (%), and Expense Ratio (%).
- **Active Period Switcher:** Simple calendar navigation between historical and current pay periods.
- **Responsive Application Shell:** Clean, responsive desktop sidebar and mobile navigation drawer.

### 3.3 Explicit Exclusions from MVP (Out of Scope)
- **No Bank Account Tracking:** No HBL, Meezan, checking, or cash accounts. No account balances or bank statement linking.
- **No Internal Transfers:** Because individual accounts do not exist, there are no internal transfers or transfer reconciliation workflows.
- **No Bank Verification:** No automated feeds, Plaid/Yodlee integrations, SMS scraping, or Open Banking APIs.
- **No Multi-Currency Mixing per User:** A user operates in a single chosen base currency per profile.
- **No Split-Transactions:** Transactions cannot be split across multiple categories in MVP.
- **Post-MVP Modules:** Loans & EMI tracking, Insurance policies, Investment portfolios, and CSV data export are deferred to Post-MVP.

### 3.4 Future Scope (Post-MVP & Long Term)
- **Post-MVP Phase A:** Loan & EMI commitment tracking with interest/principal amortization breakdown.
- **Post-MVP Phase B:** Insurance policy registry and annual premium burden tracking.
- **Post-MVP Phase C:** Investment asset registry and capital deployed tracking.
- **Post-MVP Phase D:** Historical reporting (6-to-12 month trends) and CSV ledger export.
- **Future Intelligence:** Spending anomaly alerts, predictive cash-flow simulators, and optional read-only CSV statement import.

---

## 4. Functional Requirements Inventory

### Module 1: Authentication & User Profile (AUTH / PROF)

| Req ID | Requirement Description | Priority | Target | Dependencies | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-AUTH-01** | User Registration & Login | Must Have | MVP | None | Register with email and password; secure password hashing with bcrypt/argon2; issue HTTP-only session cookie. |
| **REQ-AUTH-02** | Session Persistence & Expiry | Must Have | MVP | REQ-AUTH-01 | Session persists across browser restarts; expired session redirects to login; protected routes reject unauthenticated requests. |
| **REQ-AUTH-03** | Multi-Tenant Data Isolation | Must Have | MVP | REQ-AUTH-01 | Queries and mutations strictly derive `userId` from authenticated session context; cross-tenant query returns `RecordNotFoundError`. |
| **REQ-PROF-01** | Financial Profile Initialization | Must Have | MVP | REQ-AUTH-01 | Onboarding allows setting default currency (PKR default), target monthly income, and emergency fund target months (default: 6). |
| **REQ-PROF-02** | Currency Formatting Settings | Should Have | MVP | REQ-PROF-01 | Numbers render with localized symbols and appropriate decimal precision (0 decimals for PKR, 2 for USD/EUR). |

### Module 2: Salary & Income Management (SAL)

| Req ID | Requirement Description | Priority | Target | Dependencies | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-SAL-01** | Record Monthly Salary Inflow | Must Have | MVP | REQ-PROF-01 | Form to manually log amount, pay period (month & year), payment date, employer/source, and notes. Positive amount with exact 2 decimals. |
| **REQ-SAL-02** | Income Stream Classification | Must Have | MVP | REQ-SAL-01 | Supports `primary`, `secondary`, `bonus`, `allowance`, `freelance`, `other`. Defaults to `primary`. |
| **REQ-SAL-03** | Salary Record Modification | Must Have | MVP | REQ-SAL-01 | User can edit or delete an existing salary entry; recalculates affected period totals immediately. |
| **REQ-SAL-04** | Historical Salary Ledger | Must Have | MVP | REQ-SAL-01 | Paginated list (default 20 records) sorted descending by payment date. |

### Module 3: Expense Management (EXP)

| Req ID | Requirement Description | Priority | Target | Dependencies | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-EXP-01** | Log Expense Record | Must Have | MVP | REQ-PROF-01 | Fields: amount, date, category, expense type (fixed vs variable), description, notes. Rejects zero, negative, or sub-cent amounts. |
| **REQ-EXP-02** | Fixed vs. Variable Tagging | Must Have | MVP | REQ-EXP-01 | Enforces binary classification: Fixed (rent, utilities) vs. Variable (groceries, leisure); computes separate totals on dashboard. |
| **REQ-EXP-03** | Default Salaried Categories | Must Have | MVP | REQ-EXP-01 | 14 pre-seeded categories tailored to salaried lifestyles (Housing, Utilities, Groceries, Healthcare, Tuition, etc.). |
| **REQ-EXP-04** | Custom Expense Categories | Should Have | Post-MVP | REQ-EXP-03 | User can create custom categories with custom icons and fixed/variable defaults. |
| **REQ-EXP-05** | Expense Ledger & Filtering | Must Have | MVP | REQ-EXP-01 | Paginated list with filtering by month, year, category, and expense type. |
| **REQ-EXP-06** | Expense Edit & Deletion | Must Have | MVP | REQ-EXP-01 | Full CRUD; editing/deleting expense atomically recalculates remaining cash and category totals. |

### Module 4: Zero-Based Budgeting & Allocation (BUD)

| Req ID | Requirement Description | Priority | Target | Dependencies | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-BUD-01** | Monthly Envelope Allocation | Must Have | MVP | REQ-SAL-01 | User assigns planned spending caps to categories for a specific pay period. Planned allocations do not count as actual spending. |
| **REQ-BUD-02** | Unallocated Salary Pool | Must Have | MVP | REQ-SAL-01, BUD-01 | Displays `Recorded Salary - Total Planned Allocations`. Visual indicator shows when unallocated pool equals exactly zero. |
| **REQ-BUD-03** | Budget vs. Actual Variance | Must Have | MVP | REQ-EXP-01, BUD-01 | Category progress bars indicate % of planned envelope consumed by actual recorded expenses; highlights over-budget envelopes. |

### Module 5: Savings Goals & Emergency Reserves (SAV)

| Req ID | Requirement Description | Priority | Target | Dependencies | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-SAV-01** | Create Savings Goal | Must Have | MVP | REQ-PROF-01 | Fields: name, category (Emergency, Retirement, Down Payment, etc.), target amount, target date. |
| **REQ-SAV-02** | Dedicated Emergency Fund | Must Have | MVP | REQ-SAV-01 | Dedicated flag `isEmergencyFund`; tracks target months of living expenses based on monthly fixed costs. |
| **REQ-SAV-03** | Record Savings Contribution | Must Have | MVP | REQ-SAV-01 | User manually logs cash deposited into a goal; increments goal balance without being counted as an expense. |
| **REQ-SAV-04** | Goal Progress Visualization | Must Have | MVP | REQ-SAV-03 | Displays target vs. accumulated balance, percentage progress bar, and remaining target amount. |

### Module 6: Executive Dashboard & Analytics (DASH / REP)

| Req ID | Requirement Description | Priority | Target | Dependencies | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-DASH-01** | Executive Cash Flow Summary | Must Have | MVP | REQ-SAL-01, EXP-01 | Real-time aggregate showing Recorded Salary, Fixed Expenses, Variable Expenses, Savings Contributions, and Remaining Balance. |
| **REQ-DASH-02** | Financial Health Ratios | Must Have | MVP | REQ-DASH-01 | Renders Savings Rate (`Savings / Income * 100`) and Expense Ratio (`Expenses / Income * 100`) with color-coded badges. |
| **REQ-DASH-03** | Period Month/Year Switcher | Must Have | MVP | REQ-DASH-01 | Interactive header control to switch between active month and previous months; re-aggregates view instantly. |
| **REQ-REP-01** | Multi-Month Trend Reports | Should Have | Post-MVP | REQ-DASH-01 | 6-month & 12-month historical expenditure trends without synthetic data interpolation. |
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

### Journey 1: New User Onboarding & Setup
```
[User Registration] ──► [Auth.js Session Created] ──► [Financial Profile Setup]
                                                              │
                                                              ▼
[Dashboard Initialized] ◄── [Set Initial Salary] ◄── [Select Base Currency (PKR)]
```
1. **Registration:** User creates an account with email and password; session cookie is issued.
2. **Profile Setup:** User selects base currency (default: PKR), sets monthly income target, and configures emergency fund horizon (default: 6 months).
3. **Initial Salary Record:** User manually records their current month's salary amount.
4. **Dashboard View:** User lands on `/dashboard`, displaying their recorded salary and unallocated budget pool.

### Journey 2: Monthly Payday Allocation Workflow (Zero-Based Budgeting)
```
[Payday Arrives] ──► [Manually Record Salary] ──► [Review Unallocated Pool]
                                                          │
                                                          ▼
[Zero Balance Achieved] ◄── [Assign Savings/Variable] ◄── [Allocate Fixed Living Costs]
```
1. **Salary Recording:** User opens `/salary` and logs their net salary amount for the active month.
2. **Allocation Planning:** User enters the budget view where the unallocated pool equals the recorded salary.
3. **Partitioning:** User assigns currency envelopes to:
   - Fixed Living Costs (Rent, Utilities, Tuition)
   - Savings Goals (Emergency Reserve, Future Event)
   - Discretionary Variable Pool (Groceries, Dining, Leisure)
4. **Target State:** The unallocated pool reaches zero (`Income - Allocations = 0`), giving every rupee an intentional purpose.

### Journey 3: Expense Logging & Budget Burn
```
[Expense Occurs] ──► [Open Log Expense Form] ──► [Server Validation]
                                                         │
                                                         ▼
[Dashboard Alert Triggered] ◄── [Recalculate Remaining] ◄── [Persist Record in MongoDB]
```
1. **Entry:** User logs amount, date, description, category, and classification (`Fixed` vs. `Variable`).
2. **Validation:** Server verifies amount > 0, <= 2 decimal places, valid calendar date, and valid category.
3. **Persistence:** Document is saved to MongoDB under the user's `userId`.
4. **Budget Impact:** Remaining cash burn decreases; category budget progress bar increments; if actual spending exceeds the planned allocation, a visual warning badge is displayed.

### Journey 4: Salary Revision / Correction Workflow
```
[User Identifies Error] ──► [Edit Salary Entry] ──► [Server Validation]
                                                           │
                                                           ▼
[All Periods Reconciled] ◄── [Atomic Recalculation] ◄── [Update Record in MongoDB]
```
1. **Edit Action:** User edits a recorded salary record (e.g., correcting an amount after an unexpected tax adjustment).
2. **Validation:** New amount is validated against precision rules (`<= 90 trillion`, `<= 2 decimals`).
3. **Atomic Recalculation:** Active period snapshot re-aggregates immediately via pure deterministic functions.
4. **Reconciliation:** Dashboard figures, unallocated balances, and savings rate update consistently.

### Journey 5: Savings Goal Contribution
```
[User Saves Cash] ──► [Log Contribution Record] ──► [Goal Balance Increments]
                                                           │
                                                           ▼
[Emergency Runway Extended] ◄── [Non-Expense Accounting] ◄── [Progress Bar Updates]
```
1. **Contribution Entry:** User logs a cash transfer into their Emergency Fund goal under `/savings`.
2. **Accounting Check:** System increments goal accumulated total; ensures the contribution is **not** added to monthly expenses.
3. **Metric Update:** Monthly savings rate increases; emergency fund runway indicator recomputes (e.g., 3.8 months funded).

### Journey 6: Month-End Review & Historical Audit
```
[Select Completed Month] ──► [Inspect Recorded Inflow] ──► [Sum Actual Outflows]
                                                                  │
                                                                  ▼
[Next Month Planning] ◄── [Evaluate Savings Rate] ◄── [Compare Budget vs Actual]
```
1. **Period Selection:** User switches to a prior calendar month using the period navigation control.
2. **Ledger Review:** Reviews final savings rate, fixed vs. variable spending ratio, and budget variances.
3. **Learning Loop:** Identifies categories that exceeded planned allocations to improve next month's zero-based budget.

---

## 8. Financial Business Rules

| Rule ID | Financial Business Principle | Enforcement in Fintrack |
| :--- | :--- | :--- |
| **FBR-01** | **Manually Recorded Inflow:** Salary is a recorded value, not independently verified cash. | Recorded as an input value for the specified calendar period. No bank verification or Pending/Received gating in MVP. |
| **FBR-02** | **Planned Allocation vs. Actual Spending:** Planned budgets must not be conflated with actual expenses. | Budget envelopes represent spending intentions. Actual expenses are independent transactions that consume envelope limits. |
| **FBR-03** | **Actual Savings vs. Goal Targets:** Savings goals are target milestones; actual savings are distinct deposited records. | Decoupled into `SavingsGoal` (the target) and `SavingsRecord` (the actual accumulated deposits). |
| **FBR-04** | **Savings Non-Duplication:** Savings contributions must never be counted as expenses. | The allocation engine treats expenses and savings contributions as mutually exclusive buckets. |
| **FBR-05** | **No Account-Ledger Internal Transfers:** Unified single cash pool in MVP. | Because individual bank accounts (HBL, Meezan, cash) are excluded from MVP, account-to-account transfer rules are omitted. |
| **FBR-06** | **Zero Invented Historical Data:** Missing months must never be filled with synthetic data. | Missing periods evaluate strictly to zero. No synthetic interpolation or phantom records are generated. |
| **FBR-07** | **Explicit Forecast Labeling:** Any future projections must be strictly flagged. | Projections and targets are visually isolated from historical recorded ledger data. |
| **FBR-08** | **Reconciliation Consistency:** Record edits must immediately re-aggregate all metrics. | All dashboard aggregates are pure functions computed on demand from raw records, preventing stale cached states. |
| **FBR-09** | **Monetary Precision Strategy:** Zero floating-point arithmetic drift. | All money stored in MongoDB as `Decimal128` and computed in Node.js via minor-unit integer scaling (`safeAdd`, `safeSubtract`, `safeSum`). |
| **FBR-10** | **Multi-Tenant Ledger Isolation:** Absolute privacy and data segregation. | Every database read/write is strictly scoped by `userId`. Cross-tenant queries return `RecordNotFoundError`. |

---

## 9. Assumptions and Technical/Product Constraints

### 9.1 Confirmed Assumptions
1. **Monthly Financial Rhythm:** Salaried users operate on a monthly pay cycle; budgets and ledgers are organized by calendar month (`periodYear`, `periodMonth`).
2. **Manual Record-Keeping:** Users take responsibility for manually entering salary and daily expenses; Fintrack provides validation, aggregation, and visual planning.
3. **Single Base Currency:** An individual user operates under one chosen base currency (default: PKR); multi-currency conversion is not required in MVP.
4. **Unified Monthly Cash Pool:** All recorded income flows into a single consolidated pool for that month; no bank account partitioning.

### 9.2 Technical Constraints
1. **Next.js 16 App Router & React 19:** Built on modern Next.js server components, server actions, and Turbopack.
2. **Database Engine: MongoDB + Mongoose:** Confirmed standard. All monetary amounts stored as `Decimal128`.
3. **Minor-Unit Integer Arithmetic:** In-memory calculations must scale amounts to cents/paisa (`amount * 100`) within JavaScript safe integer limits (`<= 90 trillion currency units`).
4. **Server-Side Authorization:** Tenant verification and input validation must run strictly on the server; client requests are never trusted.

### 9.3 Product Constraints
1. **No Third-Party Banking APIs:** Zero dependency on external banking aggregators, screen scrapers, or payment gateways.
2. **Zero Automated Ledger Guesses:** If a user forgets to log an expense, Fintrack does not infer or guess transactions.

---

## 10. High-Level MVP Acceptance Criteria

The MVP will be accepted as complete when all the following conditions are verified:

1. **Functional End-to-End Flow:** A user can register, log in, configure profile currency, record monthly salary, allocate budget envelopes, log fixed/variable expenses, contribute to savings goals, and view updated dashboard metrics.
2. **Calculation Determinism:** 100% of calculation test suites pass with zero floating-point rounding errors (`Total Income - Outflows = Remaining Cash` balances exactly).
3. **Savings Integrity:** Depositing funds into a savings goal increments the goal balance and increases the savings rate without increasing total expenses.
4. **Multi-Tenant Security:** Automated tests verify that User A cannot read, query, update, or delete any record belonging to User B.
5. **Validation Hardening:** Server rejects negative amounts, zero amounts (where disallowed), sub-cent precision (>2 decimals), and invalid category IDs.
6. **Responsive Layout:** Clean visual presentation across mobile (320px), tablet (768px), and desktop (1280px) with functional mobile drawer navigation.
7. **Accessibility Baseline:** Form inputs have associated labels, interactive elements support keyboard tabbing, and contrast meets WCAG AA standards.
8. **Performance Baseline:** Dashboard SSR latency < 300ms on standard connections; indexed queries execute in < 30ms.

---

## 11. Risk Register

| Risk ID | Risk Description | Prob | Impact | Severity | Mitigation Strategy | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-01** | **Database Duality / Incomplete Migration:** Mixed MongoDB and Prisma code causing runtime failures. | High | Critical | **CRITICAL** | Consolidated on MongoDB + Mongoose. Phase 4/5 will formally deprecate Prisma artifacts and rewrite remaining DAL repositories to Mongoose. | **Resolved by Decision** |
| **RSK-02** | **Floating-Point Arithmetic Drift:** Financial totals display `.000000004` rounding artifacts, destroying user trust. | Low | Critical | **High** | Enforced integer minor-unit arithmetic and `Decimal128` storage. Verified with 80+ automated assertions in `scripts/verify-calculations.ts`. | **Mitigated in Engine** |
| **RSK-03** | **Tenant Data Leakage:** Missing `userId` check in queries exposing cross-tenant financial records. | Medium | Critical | **CRITICAL** | Enforced tenant scoping on every repository query; automated cross-tenant security test suite in Phase 8/10. | **Mitigated in DAL Design** |
| **RSK-04** | **Conflating Allocations with Actual Spending:** Planned budgets mistakenly reducing available cash. | Low | High | **Medium** | Architectural separation between `Budget` (planned) and `Expense` (actual) models and calculations. | **Mitigated in Requirements** |
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
- **Salary Inflow** creates the monthly recorded cash pool.
- **Zero-Based Budget** assigns the recorded cash pool to category envelopes.
- **Expenses** consume category envelopes and decrement actual remaining cash.
- **Savings Goals** receive savings deposits without inflating expenses.
- **Dashboard** consumes records from Salary, Expenses, and Savings to compute real-time ratios.

---

## 13. Existing Implementation Audit

| Subsystem / File | Inspected State in Repository | Classification | Audit Evaluation & Action Plan |
| :--- | :--- | :--- | :--- |
| **Domain Calculations** ([`lib/calculations/financial.ts`](file:///c:/1.%20MY%20PROJECTS/SALARY%20MS/fin-track/lib/calculations/financial.ts)) | Pure functions; minor-unit arithmetic; handles NaN/Infinity/zero safe division. | **Correct and reusable** | High engineering quality. Retained 100% intact as the authoritative calculation kernel. |
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

## 14. Remaining Open Questions (Non-Blocking Future Decisions)

The five critical architectural questions have been formally resolved. The following minor decisions are non-blocking for Phase 2 and are scheduled for resolution during their respective downstream phases:

1. **Authentication Session Adapter vs. JWT (Phase 4 / Phase 8):**
   - *Options:* Auth.js with MongoDB session store adapter vs. stateless encrypted JWT session cookies.
   - *Impact:* Decided during technical architecture (Phase 4). Stateless JWT eliminates database lookups on every page request, while database sessions permit immediate remote revocation.
2. **Budget Rollover Policy (Phase 5 / Phase 6):**
   - *Options:* Strict zero-reset each month vs. optional surplus/deficit rollover to the following month's envelope.
   - *Impact:* Scheduled for database modeling in Phase 5.
3. **CSV Export Specification (Post-MVP Phase D):**
   - *Options:* Flat single-ledger export vs. multi-tab breakdown (Salary, Expenses, Savings).
   - *Impact:* Scheduled for Post-MVP export feature.

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
- [x] Open questions resolved (All 5 critical decisions confirmed)

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

## 16. Phase 1 Gate Decision

### PHASE 1 STATUS: COMPLETE

**Summary of Confirmed Product & Architectural Decisions:**
1. **Database:** Standardized 100% on **MongoDB + Mongoose**. Prisma/PostgreSQL code is confirmed as legacy to be phased out in subsequent phases.
2. **Salary Inflow:** Manually recorded amount and pay period. No bank verification and no `Pending → Received` state machine in MVP.
3. **Account Boundaries:** Unified single monthly cash pool. No individual bank accounts (HBL, Meezan, cash), no account balances, no internal transfers, and no account reconciliation in MVP.
4. **Budgeting Model:** **Zero-Based Budgeting** model where planned allocations are clearly distinguished from actual recorded spending and actual savings.
5. **Authentication Direction:** **Auth.js (self-managed credentials and session handling)** with tenant isolation enforced strictly on the server.

All Phase 1 Discovery and Requirements deliverables are finalized and verified against the repository. Zero critical product or business blockers remain.

---

## 17. Recommended Next Action

Next step: **Phase 2 — Information Architecture & User Flows.**
