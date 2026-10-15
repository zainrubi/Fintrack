/**
 * Fintrack — Pure Financial Calculations
 *
 * All functions in this module are:
 * - Pure and deterministic
 * - Independent of UI, React, and Database
 * - Protected against IEEE 754 floating-point drift via minor-unit integer scaling
 * - Safe against division-by-zero, NaN, and Infinity
 */

import type {
  ExpenseRecord,
  InsuranceRecord,
  InvestmentRecord,
  LoanRecord,
  MonthlyFinancialSnapshot,
  SalaryRecord,
  SavingsRecord,
} from '../../types/financial';

// ============================================================================
// 1. Precise Arithmetic & Minor-Unit Math
// ============================================================================

/**
 * Converts a major currency value to integer minor units (e.g. cents/paisa).
 * Rounds to nearest integer to eliminate floating-point representation artifacts.
 */
export function toMinorUnits(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

/**
 * Converts integer minor units back to standard major currency value.
 */
export function fromMinorUnits(minorUnits: number): number {
  if (!Number.isFinite(minorUnits)) return 0;
  return minorUnits / 100;
}

/**
 * Safely adds two monetary amounts with integer precision.
 */
export function safeAdd(a: number, b: number): number {
  return fromMinorUnits(toMinorUnits(a) + toMinorUnits(b));
}

/**
 * Safely subtracts amount b from amount a with integer precision.
 */
export function safeSubtract(a: number, b: number): number {
  return fromMinorUnits(toMinorUnits(a) - toMinorUnits(b));
}

type NumericOrAmount =
  | number
  | { amount: number }
  | { premiumAmount: number }
  | { installmentAmount: number };

/**
 * Sums a collection of numbers or record objects using integer minor units.
 */
export function safeSum(items: ReadonlyArray<NumericOrAmount>): number {
  if (!items || items.length === 0) return 0;

  let totalMinor = 0;
  for (const item of items) {
    let val = 0;
    if (typeof item === 'number') {
      val = item;
    } else if (item && typeof item === 'object') {
      if ('amount' in item && typeof item.amount === 'number') {
        val = item.amount;
      } else if ('premiumAmount' in item && typeof item.premiumAmount === 'number') {
        val = item.premiumAmount;
      } else if ('installmentAmount' in item && typeof item.installmentAmount === 'number') {
        val = item.installmentAmount;
      }
    }
    totalMinor += toMinorUnits(val);
  }

  return fromMinorUnits(totalMinor);
}

// ============================================================================
// 2. Safe Percentage & Ratio Calculations
// ============================================================================

/**
 * Calculates a percentage: (part / total) * 100.
 * Safely guards against:
 * - total <= 0 (returns 0)
 * - part <= 0 (returns 0)
 * - NaN, Infinity (returns 0)
 *
 * @param part The portion amount
 * @param total The base/total amount
 * @param decimals Number of decimal places to round to (default: 2)
 */
export function calculatePercentage(part: number, total: number, decimals: number = 2): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0 || part <= 0) {
    return 0;
  }
  const ratio = (part / total) * 100;
  if (!Number.isFinite(ratio)) {
    return 0;
  }
  const factor = Math.pow(10, decimals);
  return Math.round(ratio * factor) / factor;
}

// ============================================================================
// 3. Category Total Calculations
// ============================================================================

/**
 * Calculates total income from a list of salary records or numbers.
 */
export function calculateTotalIncome(
  salaries: ReadonlyArray<SalaryRecord | number | { amount: number }>
): number {
  return safeSum(salaries);
}

/**
 * Calculates total expenses from a list of expense records or numbers.
 */
export function calculateTotalExpenses(
  expenses: ReadonlyArray<ExpenseRecord | number | { amount: number }>
): number {
  return safeSum(expenses);
}

/**
 * Calculates total fixed expenses from typed ExpenseRecords.
 */
export function calculateFixedExpenses(expenses: ReadonlyArray<ExpenseRecord>): number {
  if (!expenses || expenses.length === 0) return 0;
  return safeSum(expenses.filter((e) => e.expenseType === 'fixed'));
}

/**
 * Calculates total variable expenses from typed ExpenseRecords.
 */
export function calculateVariableExpenses(expenses: ReadonlyArray<ExpenseRecord>): number {
  if (!expenses || expenses.length === 0) return 0;
  return safeSum(expenses.filter((e) => e.expenseType === 'variable'));
}

/**
 * Calculates total savings from savings records or numbers.
 */
export function calculateTotalSavings(
  savings: ReadonlyArray<SavingsRecord | number | { amount: number }>
): number {
  return safeSum(savings);
}

/**
 * Calculates total investments from investment records or numbers.
 */
export function calculateTotalInvestments(
  investments: ReadonlyArray<InvestmentRecord | number | { amount: number }>
): number {
  return safeSum(investments);
}

/**
 * Calculates total insurance premiums from insurance records or numbers.
 */
export function calculateTotalInsurance(
  insurances: ReadonlyArray<InsuranceRecord | number | { premiumAmount: number }>
): number {
  return safeSum(insurances);
}

/**
 * Calculates total loan repayment commitments (EMIs) from loan records or numbers.
 */
export function calculateTotalLoanPayments(
  loans: ReadonlyArray<LoanRecord | number | { installmentAmount: number }>
): number {
  return safeSum(loans);
}

// ============================================================================
// 4. Financial Health Ratios & Rates
// ============================================================================

/**
 * Calculates savings rate: (total savings / total income) * 100.
 */
export function calculateSavingsRate(totalSavings: number, totalIncome: number): number {
  return calculatePercentage(totalSavings, totalIncome, 2);
}

/**
 * Calculates expense ratio: (total expenses / total income) * 100.
 */
export function calculateExpenseRatio(totalExpenses: number, totalIncome: number): number {
  return calculatePercentage(totalExpenses, totalIncome, 2);
}

/**
 * Calculates investment rate: (total investments / total income) * 100.
 */
export function calculateInvestmentRate(totalInvestments: number, totalIncome: number): number {
  return calculatePercentage(totalInvestments, totalIncome, 2);
}

/**
 * Calculates debt-to-income (DTI) ratio: (total loan payments / total income) * 100.
 */
export function calculateDebtToIncomeRatio(totalLoanPayments: number, totalIncome: number): number {
  return calculatePercentage(totalLoanPayments, totalIncome, 2);
}

/**
 * Calculates insurance coverage burden ratio: (total insurance / total income) * 100.
 */
export function calculateInsuranceRatio(totalInsurance: number, totalIncome: number): number {
  return calculatePercentage(totalInsurance, totalIncome, 2);
}

// ============================================================================
// 5. Remaining Income & Allocation Breakdown
// ============================================================================

export interface AllocationAmounts {
  expenses?: number;
  savings?: number;
  investments?: number;
  insurance?: number;
  loans?: number;
}

/**
 * Calculates remaining unallocated income:
 * income - (expenses + savings + investments + insurance + loans)
 */
export function calculateRemainingIncome(
  totalIncome: number,
  allocations: number | AllocationAmounts | ReadonlyArray<number>
): number {
  if (typeof allocations === 'number') {
    return safeSubtract(totalIncome, allocations);
  }

  if (Array.isArray(allocations)) {
    const totalAllocated = safeSum(allocations);
    return safeSubtract(totalIncome, totalAllocated);
  }

  const obj = allocations as AllocationAmounts;
  const totalAllocated = safeSum([
    obj.expenses ?? 0,
    obj.savings ?? 0,
    obj.investments ?? 0,
    obj.insurance ?? 0,
    obj.loans ?? 0,
  ]);

  return safeSubtract(totalIncome, totalAllocated);
}

export interface MonthlySnapshotInput {
  income: number | ReadonlyArray<SalaryRecord | number | { amount: number }>;
  expenses: number | ReadonlyArray<ExpenseRecord | number | { amount: number }>;
  savings?: number | ReadonlyArray<SavingsRecord | number | { amount: number }>;
  investments?: number | ReadonlyArray<InvestmentRecord | number | { amount: number }>;
  insurance?: number | ReadonlyArray<InsuranceRecord | number | { premiumAmount: number }>;
  loans?: number | ReadonlyArray<LoanRecord | number | { installmentAmount: number }>;
}

/**
 * Computes a comprehensive monthly financial snapshot and health metrics.
 */
export function calculateMonthlySnapshot(input: MonthlySnapshotInput): MonthlyFinancialSnapshot {
  const totalIncome = typeof input.income === 'number' ? input.income : calculateTotalIncome(input.income);

  let totalExpenses = 0;
  let totalFixedExpenses = 0;
  let totalVariableExpenses = 0;

  if (typeof input.expenses === 'number') {
    totalExpenses = input.expenses;
  } else {
    totalExpenses = calculateTotalExpenses(input.expenses);
    if (input.expenses.length > 0 && typeof input.expenses[0] === 'object' && 'expenseType' in input.expenses[0]) {
      const records = input.expenses as ReadonlyArray<ExpenseRecord>;
      totalFixedExpenses = calculateFixedExpenses(records);
      totalVariableExpenses = calculateVariableExpenses(records);
    }
  }

  const totalSavings = typeof input.savings === 'number' ? input.savings : calculateTotalSavings(input.savings ?? []);
  const totalInvestments = typeof input.investments === 'number' ? input.investments : calculateTotalInvestments(input.investments ?? []);
  const totalInsurance = typeof input.insurance === 'number' ? input.insurance : calculateTotalInsurance(input.insurance ?? []);
  const totalLoanPayments = typeof input.loans === 'number' ? input.loans : calculateTotalLoanPayments(input.loans ?? []);

  const totalAllocated = safeSum([
    totalExpenses,
    totalSavings,
    totalInvestments,
    totalInsurance,
    totalLoanPayments,
  ]);

  const remainingIncome = safeSubtract(totalIncome, totalAllocated);

  return {
    totalIncome,
    totalExpenses,
    totalFixedExpenses,
    totalVariableExpenses,
    totalSavings,
    totalInvestments,
    totalInsurance,
    totalLoanPayments,
    totalAllocated,
    remainingIncome,
    savingsRate: calculateSavingsRate(totalSavings, totalIncome),
    expenseRatio: calculateExpenseRatio(totalExpenses, totalIncome),
    fixedExpenseRatio: calculatePercentage(totalFixedExpenses, totalIncome),
    variableExpenseRatio: calculatePercentage(totalVariableExpenses, totalIncome),
    investmentRate: calculateInvestmentRate(totalInvestments, totalIncome),
    debtToIncomeRatio: calculateDebtToIncomeRatio(totalLoanPayments, totalIncome),
    insuranceRatio: calculateInsuranceRatio(totalInsurance, totalIncome),
  };
}
