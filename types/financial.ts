/**
 * Fintrack — Financial Domain Models & Shared Types
 *
 * MONETARY VALUE STRATEGY:
 * - All monetary amounts in domain models are represented in standard major currency units
 *   (e.g., 250000.00 PKR, 1500.50 USD) as `number`.
 * - To prevent IEEE 754 floating-point drift (e.g., 0.1 + 0.2 = 0.30000000000000004),
 *   all calculation utilities in `lib/calculations/` perform internal scaling to minor units
 *   (cents/paisa: amount * 100) using integer math before returning cleanly rounded results.
 * - In future database migrations, these map directly to PostgreSQL `DECIMAL(14, 2)` or
 *   `NUMERIC(14, 2)` to maintain strict financial precision.
 */

// ============================================================================
// 1. Shared Union Types & Enums
// ============================================================================

/** Supported ISO currency codes. PKR is Fintrack's initial default. */
export type CurrencyCode =
  | 'PKR'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'AED'
  | 'SAR'
  | 'CAD'
  | 'AUD'
  | 'INR'
  | (string & {});

/** Salary type or income stream */
export type SalaryType =
  | 'primary'
  | 'secondary'
  | 'bonus'
  | 'allowance'
  | 'freelance'
  | 'overtime'
  | 'other';

/** Fundamental classification of expenses */
export type ExpenseType = 'fixed' | 'variable';

/** Predefined expense categories for salaried individuals */
export type DefaultExpenseCategory =
  | 'housing'
  | 'utilities'
  | 'groceries'
  | 'transportation'
  | 'healthcare'
  | 'education'
  | 'entertainment'
  | 'dining_out'
  | 'shopping'
  | 'personal_care'
  | 'family_support'
  | 'charity_zakat'
  | 'debt_payment'
  | 'miscellaneous';

/** Expense category: supports defaults with auto-complete while allowing custom user categories */
export type ExpenseCategory = DefaultExpenseCategory | (string & {});

/** Predefined savings categories / goals */
export type DefaultSavingsCategory =
  | 'emergency_fund'
  | 'retirement'
  | 'house_downpayment'
  | 'education'
  | 'wedding'
  | 'travel_vacation'
  | 'hajj_umrah'
  | 'general_savings';

/** Savings category: supports defaults with auto-complete while allowing custom user categories */
export type SavingsCategory = DefaultSavingsCategory | (string & {});

/** Common investment vehicles for salaried employees */
export type DefaultInvestmentType =
  | 'mutual_fund'
  | 'stocks'
  | 'real_estate'
  | 'gold_precious_metals'
  | 'government_bonds'
  | 'provident_fund'
  | 'crypto'
  | 'business_venture'
  | 'other';

/** Investment type: supports defaults with auto-complete while allowing custom user categories */
export type InvestmentType = DefaultInvestmentType | (string & {});

/** Insurance policy classification */
export type DefaultInsuranceCategory =
  | 'health'
  | 'life'
  | 'vehicle'
  | 'home'
  | 'disability'
  | 'other';

/** Insurance category: supports defaults with auto-complete while allowing custom user categories */
export type InsuranceCategory = DefaultInsuranceCategory | (string & {});

/** Payment and recurring frequencies */
export type PaymentFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semi-annually'
  | 'annually'
  | 'one-time';

/** Premium payment frequency for insurance */
export type InsuranceFrequency =
  | 'monthly'
  | 'quarterly'
  | 'semi-annually'
  | 'annually';

/** Repayment frequency for loans */
export type LoanFrequency =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly';

// ============================================================================
// 2. Core Domain Models
// ============================================================================

/** User financial profile preferences and targets */
export interface UserFinancialProfile {
  id: string;
  userId: string;
  defaultCurrency: CurrencyCode;
  monthlyIncomeTarget?: number;
  monthlySavingsTarget?: number;
  emergencyFundTargetMonths?: number;
  fiscalYearStartMonth?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Salary record for a given pay period.
 * Supports multiple records over time to account for increments, bonuses, and job changes.
 */
export interface SalaryRecord {
  id: string;
  userId: string;
  amount: number;
  currency: CurrencyCode;
  salaryType: SalaryType;
  payPeriodMonth: number; // 1-12
  payPeriodYear: number;  // e.g. 2026
  paymentDate: Date | string;
  employerOrSource?: string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Expense record representing an outflow of funds.
 * Explicitly separates fixed (rent, school fees) from variable (groceries, leisure) expenses.
 */
export interface ExpenseRecord {
  id: string;
  userId: string;
  amount: number;
  currency: CurrencyCode;
  category: ExpenseCategory;
  expenseType: ExpenseType;
  date: Date | string;
  description: string;
  isRecurring?: boolean;
  recurringFrequency?: PaymentFrequency;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Dedicated savings goal or reserve fund target.
 */
export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  category: SavingsCategory;
  targetAmount?: number;
  targetDate?: Date | string;
  isEmergencyFund: boolean;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Savings record representing money moved into cash reserves or dedicated emergency funds.
 */
export interface SavingsRecord {
  id: string;
  userId: string;
  goalId?: string;
  amount: number;
  currency: CurrencyCode;
  category: SavingsCategory;
  date: Date | string;
  periodYear?: number;
  periodMonth?: number;
  targetGoalName?: string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Investment asset representing a held portfolio asset or account.
 */
export interface InvestmentAsset {
  id: string;
  userId: string;
  assetName: string;
  investmentType: InvestmentType;
  institutionOrPlatform?: string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Investment record representing wealth-generation assets.
 * Distinct from liquid cash savings.
 */
export interface InvestmentRecord {
  id: string;
  userId: string;
  assetId?: string;
  amount: number;
  currency: CurrencyCode;
  investmentType: InvestmentType;
  assetName?: string;
  institutionOrPlatform?: string;
  date: Date | string;
  periodYear?: number;
  periodMonth?: number;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Insurance policy representing coverage, terms, and ongoing premium commitments.
 */
export interface InsurancePolicy {
  id: string;
  userId: string;
  policyName: string;
  policyNumber?: string;
  provider?: string;
  category: InsuranceCategory;
  premiumAmount: number;
  currency: CurrencyCode;
  frequency: InsuranceFrequency;
  startDate: Date | string;
  renewalDate?: Date | string;
  isActive: boolean;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Insurance payment record representing a specific premium payment transaction for a policy.
 */
export interface InsurancePayment {
  id: string;
  userId: string;
  policyId: string;
  amount: number;
  currency: CurrencyCode;
  paymentDate: Date | string;
  periodYear: number;
  periodMonth: number;
  policyName?: string;
  category?: InsuranceCategory;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Insurance record representing protection policies and premium commitments.
 */
export interface InsuranceRecord {
  id: string;
  userId: string;
  policyName: string;
  policyNumber?: string;
  provider?: string;
  category: InsuranceCategory;
  premiumAmount: number;
  currency: CurrencyCode;
  frequency: InsuranceFrequency;
  paymentDate: Date | string;
  renewalDate?: Date | string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Loan record representing liabilities, debt obligations, and repayment terms.
 */
export interface LoanRecord {
  id: string;
  userId: string;
  loanTitle: string;
  lenderName: string;
  principalAmount: number;
  outstandingAmount: number;
  interestRate: number;      // Annual percentage rate (e.g. 14.5 for 14.5%)
  installmentAmount: number; // Regular repayment / EMI
  frequency: LoanFrequency;
  startDate: Date | string;
  endDate?: Date | string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================================================
// 3. Financial Aggregate Snapshot
// ============================================================================

/** Complete monthly financial breakdown and health metrics for a salaried person */
export interface MonthlyFinancialSnapshot {
  totalIncome: number;
  totalExpenses: number;
  totalFixedExpenses: number;
  totalVariableExpenses: number;
  totalSavings: number;
  totalInvestments: number;
  totalInsurance: number;
  totalLoanPayments: number;
  totalAllocated: number;
  remainingIncome: number;

  // Percentage Metrics (0 - 100)
  savingsRate: number;
  expenseRatio: number;
  fixedExpenseRatio: number;
  variableExpenseRatio: number;
  investmentRate: number;
  debtToIncomeRatio: number;
  insuranceRatio: number;
}
