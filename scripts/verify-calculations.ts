/**
 * Verification script for Fintrack Financial Calculations
 * Runs via Node native TypeScript support without additional dependencies.
 */

import {
  calculateDebtToIncomeRatio,
  calculateExpenseRatio,
  calculateMonthlySnapshot,
  calculatePercentage,
  calculateRemainingIncome,
  calculateSavingsRate,
  calculateTotalExpenses,
  calculateTotalIncome,
  calculateTotalInsurance,
  calculateTotalInvestments,
  calculateTotalLoanPayments,
  calculateTotalSavings,
  fromMinorUnits,
  safeAdd,
  safeSubtract,
  safeSum,
  toMinorUnits,
} from '../lib/calculations/financial';
import {
  formatCurrency,
  formatDate,
  formatMonthYear,
  formatPercentage,
} from '../lib/utils/formatters';

let failures = 0;

function assert(condition: boolean, testName: string, actual?: unknown, expected?: unknown) {
  if (condition) {
    console.log(`  PASS: ${testName}`);
  } else {
    failures++;
    console.error(`  FAIL: ${testName} | Expected: ${expected}, Got: ${actual}`);
  }
}

console.log('\n--- Running Fintrack Domain Verification Tests ---\n');

// 1. Income = 250,000 and expenses = 100,000 -> remaining = 150,000
const remaining1 = calculateRemainingIncome(250_000, 100_000);
assert(remaining1 === 150_000, 'Test 1: Income 250k - Expenses 100k = 150k remaining', remaining1, 150_000);

// 2. Income = 250,000 and savings = 50,000 -> savings rate = 20%
const savingsRate1 = calculateSavingsRate(50_000, 250_000);
assert(savingsRate1 === 20, 'Test 2: Savings rate on 50k / 250k = 20%', savingsRate1, 20);

// 3. Income = 0 -> percentage calculations must safely return 0
const zeroIncomeRate = calculatePercentage(50_000, 0);
const zeroIncomeSavingsRate = calculateSavingsRate(20_000, 0);
const zeroIncomeExpenseRatio = calculateExpenseRatio(30_000, 0);
assert(zeroIncomeRate === 0, 'Test 3a: calculatePercentage with income = 0 returns 0', zeroIncomeRate, 0);
assert(zeroIncomeSavingsRate === 0, 'Test 3b: calculateSavingsRate with income = 0 returns 0', zeroIncomeSavingsRate, 0);
assert(zeroIncomeExpenseRatio === 0, 'Test 3c: calculateExpenseRatio with income = 0 returns 0', zeroIncomeExpenseRatio, 0);

// 3d. NaN and Infinity inputs must safely return 0
const nanRate = calculatePercentage(NaN, 100_000);
const infRate = calculatePercentage(100_000, Infinity);
assert(nanRate === 0, 'Test 3d: calculatePercentage with NaN returns 0', nanRate, 0);
assert(infRate === 0, 'Test 3e: calculatePercentage with Infinity returns 0', infRate, 0);

// 4. Multiple expense values must sum correctly
const expenseItems = [12_500.50, 45_000, 8_250.25, 14_249.25];
const totalExpenses = safeSum(expenseItems);
assert(totalExpenses === 80_000, 'Test 4a: Multiple expenses sum correctly to 80,000', totalExpenses, 80_000);

const recordItems = [
  { amount: 50_000 },
  { amount: 25_000.75 },
  { amount: 24_999.25 },
];
const totalRecords = safeSum(recordItems);
assert(totalRecords === 100_000, 'Test 4b: Object array sums correctly to 100,000', totalRecords, 100_000);

// 5. Monetary calculations must avoid obvious floating-point errors
const floatAdd = safeAdd(0.1, 0.2);
assert(floatAdd === 0.3, 'Test 5a: safeAdd(0.1, 0.2) equals exactly 0.3', floatAdd, 0.3);

const floatSum = safeSum([0.1, 0.2, 0.3]);
assert(floatSum === 0.6, 'Test 5b: safeSum([0.1, 0.2, 0.3]) equals exactly 0.6', floatSum, 0.6);

const floatSub = safeSubtract(1.0, 0.9);
assert(floatSub === 0.1, 'Test 5c: safeSubtract(1.0, 0.9) equals exactly 0.1', floatSub, 0.1);

// 6. Comprehensive Monthly Financial Snapshot
const snapshot = calculateMonthlySnapshot({
  income: 250_000,
  expenses: 100_000,
  savings: 50_000,
  investments: 30_000,
  insurance: 10_000,
  loans: 20_000,
});

assert(snapshot.totalIncome === 250_000, 'Test 6a: Snapshot totalIncome', snapshot.totalIncome, 250_000);
assert(snapshot.totalAllocated === 210_000, 'Test 6b: Snapshot totalAllocated (100k+50k+30k+10k+20k = 210k)', snapshot.totalAllocated, 210_000);
assert(snapshot.remainingIncome === 40_000, 'Test 6c: Snapshot remainingIncome (250k - 210k = 40k)', snapshot.remainingIncome, 40_000);
assert(snapshot.savingsRate === 20, 'Test 6d: Snapshot savingsRate = 20%', snapshot.savingsRate, 20);
assert(snapshot.expenseRatio === 40, 'Test 6e: Snapshot expenseRatio (100k / 250k = 40%)', snapshot.expenseRatio, 40);
assert(snapshot.investmentRate === 12, 'Test 6f: Snapshot investmentRate (30k / 250k = 12%)', snapshot.investmentRate, 12);
assert(snapshot.insuranceRatio === 4, 'Test 6g: Snapshot insuranceRatio (10k / 250k = 4%)', snapshot.insuranceRatio, 4);
assert(snapshot.debtToIncomeRatio === 8, 'Test 6h: Snapshot debtToIncomeRatio (20k / 250k = 8%)', snapshot.debtToIncomeRatio, 8);

// 7. Formatters
const pkrFormatted = formatCurrency(250_000, 'PKR');
assert(pkrFormatted.includes('250,000'), 'Test 7a: formatCurrency PKR contains 250,000', pkrFormatted, 'contains 250,000');

const usdFormatted = formatCurrency(1250.5, 'USD');
assert(usdFormatted.includes('1,250.50'), 'Test 7b: formatCurrency USD includes decimals', usdFormatted, 'contains 1,250.50');

const percentFormatted = formatPercentage(20);
assert(percentFormatted === '20%', 'Test 7c: formatPercentage(20) = "20%"', percentFormatted, '20%');

const percentDecimal = formatPercentage(14.75, 2);
assert(percentDecimal === '14.75%', 'Test 7d: formatPercentage(14.75, 2) = "14.75%"', percentDecimal, '14.75%');

const monthYearFormatted = formatMonthYear(10, 2026);
assert(monthYearFormatted === 'October 2026', 'Test 7e: formatMonthYear(10, 2026) = "October 2026"', monthYearFormatted, 'October 2026');

const dateFormatted = formatDate(new Date(2026, 9, 15));
assert(dateFormatted.includes('2026'), 'Test 7f: formatDate produces valid date string', dateFormatted, 'contains 2026');

// 8. Category Total & Minor Unit Helpers
assert(calculateTotalIncome([200_000, 50_000]) === 250_000, 'Test 8a: calculateTotalIncome');
assert(calculateTotalExpenses([60_000, 40_000]) === 100_000, 'Test 8b: calculateTotalExpenses');
assert(calculateTotalSavings([30_000, 20_000]) === 50_000, 'Test 8c: calculateTotalSavings');
assert(calculateTotalInvestments([25_000, 5_000]) === 30_000, 'Test 8d: calculateTotalInvestments');
assert(calculateTotalInsurance([{ premiumAmount: 10_000 }]) === 10_000, 'Test 8e: calculateTotalInsurance');
assert(calculateTotalLoanPayments([{ installmentAmount: 20_000 }]) === 20_000, 'Test 8f: calculateTotalLoanPayments');
assert(calculateDebtToIncomeRatio(20_000, 250_000) === 8, 'Test 8g: calculateDebtToIncomeRatio = 8%');
assert(toMinorUnits(123.45) === 12345, 'Test 8h: toMinorUnits(123.45) = 12345');
assert(fromMinorUnits(12345) === 123.45, 'Test 8i: fromMinorUnits(12345) = 123.45');

console.log('\n--- Verification Summary ---');
if (failures === 0) {
  console.log('ALL TESTS PASSED SUCCESSFULLY! (0 failures)\n');
} else {
  console.error(`TESTS FAILED: ${failures} failure(s) detected.\n`);
  process.exit(1);
}
