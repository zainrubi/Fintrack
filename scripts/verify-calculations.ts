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

// 9. Prisma Decimal & Database Mappings Safety Tests
import { Prisma, SalaryType as DbSalaryType } from '@prisma/client';
import {
  decimalToSafeNumber,
  decimalToOptionalSafeNumber,
  decimalToString,
  safeNumberToDecimal,
  UnsafeDecimalConversionError,
  mapSalaryRecordToDomain,
} from '../lib/db/mappers';

// 9a. Valid standard currency decimal conversion
const validDecimal = new Prisma.Decimal('250000.50');
assert(decimalToSafeNumber(validDecimal) === 250000.5, 'Test 9a: Valid Decimal converts accurately to 250000.5');

// 9b. Rejection of sub-cent precision loss
let threwSubCent = false;
try {
  decimalToSafeNumber(new Prisma.Decimal('100.555'), 'testSubCent');
} catch (e) {
  if (e instanceof UnsafeDecimalConversionError) {
    threwSubCent = true;
  }
}
assert(threwSubCent, 'Test 9b: Sub-cent Decimal (>2 decimal places) is rejected without silent rounding');

// 9c. Rejection of magnitude exceeding safe JavaScript integer limit
let threwLarge = false;
try {
  decimalToSafeNumber(new Prisma.Decimal('99999999999999999999'), 'testLarge');
} catch (e) {
  if (e instanceof UnsafeDecimalConversionError) {
    threwLarge = true;
  }
}
assert(threwLarge, 'Test 9c: Huge Decimal exceeding 90T safe integer bounds is rejected');

// 9d. Nullable Decimal handling
assert(decimalToOptionalSafeNumber(null) === undefined, 'Test 9d: Nullable Decimal maps safely to undefined');
assert(decimalToOptionalSafeNumber(new Prisma.Decimal('500.25')) === 500.25, 'Test 9e: Optional Decimal converts when present');

// 9e. String-preserving Decimal conversion
assert(decimalToString(new Prisma.Decimal('1234.50')) === '1234.50', 'Test 9f: Exact string-preserving Decimal conversion');

// 9f. Number to Decimal conversion
const decFromNum = safeNumberToDecimal(50000.75);
assert(decFromNum.toString() === '50000.75', 'Test 9g: safeNumberToDecimal converts 50000.75 cleanly');

// 9g. Model Mapping verification
const now = new Date();
const mockDbSalary = {
  id: 'sal_123',
  userId: 'usr_456',
  amount: new Prisma.Decimal('350000.00'),
  currency: 'PKR',
  salaryType: DbSalaryType.PRIMARY,
  payPeriodYear: 2026,
  payPeriodMonth: 10,
  paymentDate: now,
  employerOrSource: 'Tech Corp',
  notes: null,
  createdAt: now,
  updatedAt: now,
};
const domainSalary = mapSalaryRecordToDomain(mockDbSalary);
assert(domainSalary.amount === 350000, 'Test 9h: mapSalaryRecordToDomain converts amount');
assert(domainSalary.salaryType === 'primary', 'Test 9i: mapSalaryRecordToDomain maps enum PRIMARY -> primary');
assert(domainSalary.notes === undefined, 'Test 9j: Null notes mapped cleanly to undefined');

// 10. Repository Input Validation & Pagination Tests
import {
  RecordNotFoundError,
  ValidationError,
  validateUserId,
  validateSalaryInput,
  validateExpenseInput,
  validateSavingsGoalInput,
  validateSavingsRecordInput,
  validateInvestmentAssetInput,
  validateInvestmentRecordInput,
  validateInsurancePolicyInput,
  validateInsurancePaymentInput,
  validateMonetaryAmount,
  validateRecordId,
  normalizePagination,
  buildPaginationMeta,
  buildExpenseCategoryAccessFilter,
  verifyDeletionResult,
} from '../lib/db/repositories';
import {
  dbSavingsCategoryToDomain,
  domainSavingsCategoryToDb,
  mapSavingsGoalToDomain,
  mapSavingsRecordToDomain,
  dbInvestmentTypeToDomain,
  domainInvestmentTypeToDb,
  mapInvestmentAssetToDomain,
  mapInvestmentRecordToDomain,
  dbInsuranceCategoryToDomain,
  domainInsuranceCategoryToDb,
  dbInsuranceFrequencyToDomain,
  domainInsuranceFrequencyToDb,
  mapInsurancePolicyToDomain,
  mapInsurancePaymentToDomain,
} from '../lib/db/mappers';
import {
  CategoryType,
  SavingsCategory as DbSavingsCategory,
  InvestmentType as DbInvestmentType,
  InsuranceCategory as DbInsuranceCategory,
  InsuranceFrequency as DbInsuranceFrequency,
} from '@prisma/client';
import type {
  InsuranceCategory as DomainInsuranceCategory,
  InsuranceFrequency as DomainInsuranceFrequency,
} from '../types/financial';

// 10a. validateUserId rejects empty or non-string
let threwUserId = false;
try {
  validateUserId('   ');
} catch (e) {
  if (e instanceof ValidationError) threwUserId = true;
}
assert(threwUserId, 'Test 10a: validateUserId rejects whitespace-only string');
assert(validateUserId('usr_valid_123') === 'usr_valid_123', 'Test 10b: validateUserId returns trimmed ID');

// 10c. validateSalaryInput validates amount and pay period bounds
const validSalaryInput = validateSalaryInput({
  amount: 250000,
  currency: 'pkr',
  payPeriodYear: 2026,
  payPeriodMonth: 10,
  paymentDate: '2026-10-01',
});
assert(validSalaryInput.currency === 'PKR', 'Test 10c: validateSalaryInput normalizes currency to uppercase');
assert(validSalaryInput.payPeriodMonth === 10, 'Test 10d: validateSalaryInput preserves valid month');

let threwNegativeAmount = false;
try {
  validateSalaryInput({
    amount: -5000,
    payPeriodYear: 2026,
    payPeriodMonth: 10,
    paymentDate: new Date(),
  });
} catch (e) {
  if (e instanceof ValidationError) threwNegativeAmount = true;
}
assert(threwNegativeAmount, 'Test 10e: validateSalaryInput rejects negative amount');

let threwInvalidMonth = false;
try {
  validateSalaryInput({
    amount: 100000,
    payPeriodYear: 2026,
    payPeriodMonth: 13,
    paymentDate: new Date(),
  });
} catch (e) {
  if (e instanceof ValidationError) threwInvalidMonth = true;
}
assert(threwInvalidMonth, 'Test 10f: validateSalaryInput rejects invalid month > 12');

// 10g. validateExpenseInput derives periodYear and periodMonth automatically from date
const expenseValid = validateExpenseInput({
  categoryId: 'cat_groceries',
  amount: 15400.50,
  expenseType: 'variable',
  date: '2026-10-15T12:00:00Z',
  description: 'Weekly grocery run',
});
assert(expenseValid.periodYear === 2026, 'Test 10g: validateExpenseInput derives periodYear 2026');
assert(expenseValid.periodMonth === 10, 'Test 10h: validateExpenseInput derives periodMonth 10');
assert(expenseValid.description === 'Weekly grocery run', 'Test 10i: validateExpenseInput preserves description');

let threwEmptyDesc = false;
try {
  validateExpenseInput({
    categoryId: 'cat_rent',
    amount: 50000,
    expenseType: 'fixed',
    date: new Date(),
    description: '   ',
  });
} catch (e) {
  if (e instanceof ValidationError) threwEmptyDesc = true;
}
assert(threwEmptyDesc, 'Test 10j: validateExpenseInput rejects empty description');

// 10k. Pagination normalization and metadata
const norm = normalizePagination({ page: -5, limit: 500 });
assert(norm.page === 1, 'Test 10k: normalizePagination caps page minimum to 1');
assert(norm.limit === 100, 'Test 10l: normalizePagination caps limit maximum to 100');
assert(norm.skip === 0, 'Test 10m: normalizePagination computes skip = 0');

const meta = buildPaginationMeta(250, 2, 20);
assert(meta.totalPages === 13, 'Test 10n: buildPaginationMeta calculates totalPages = 13 for 250 items at 20/page');
assert(meta.hasNextPage === true, 'Test 10o: buildPaginationMeta calculates hasNextPage = true on page 2 of 13');
assert(meta.hasPreviousPage === true, 'Test 10p: buildPaginationMeta calculates hasPreviousPage = true on page 2');

// 11. Security Hardening Regression Tests

// 11a-11e: Pagination NaN, Infinity, zero, and non-numeric inputs
const pNaN = normalizePagination({ page: NaN, limit: NaN });
assert(pNaN.page === 1 && pNaN.limit === 20 && pNaN.skip === 0, 'Test 11a: normalizePagination safely defaults NaN to page 1, limit 20, skip 0');

const pInf = normalizePagination({ page: Infinity, limit: -Infinity });
assert(pInf.page === 1 && pInf.limit === 20 && pInf.skip === 0, 'Test 11b: normalizePagination safely defaults Infinity/-Infinity to page 1, limit 20');

const pZero = normalizePagination({ page: 0, limit: 0 });
assert(pZero.page === 1 && pZero.limit === 20 && pZero.skip === 0, 'Test 11c: normalizePagination safely defaults 0 values to page 1, limit 20');

const pStr = normalizePagination({ page: 'abc' as unknown as number, limit: 'xyz' as unknown as number });
assert(pStr.page === 1 && pStr.limit === 20 && pStr.skip === 0, 'Test 11d: normalizePagination safely defaults non-numeric strings to page 1, limit 20');

const pFrac = normalizePagination({ page: 2.8, limit: 15.9 });
assert(pFrac.page === 2 && pFrac.limit === 15 && pFrac.skip === 15, 'Test 11e: normalizePagination floors valid floating page and limit');

const pUndef = normalizePagination();
assert(pUndef.page === 1 && pUndef.limit === 20 && pUndef.skip === 0, 'Test 11f: normalizePagination safely handles undefined params');

const pCustom = normalizePagination({ page: 3, limit: 25 });
assert(pCustom.page === 3 && pCustom.limit === 25 && pCustom.skip === 50, 'Test 11g: normalizePagination computes valid custom page and skip');

const metaNaN = buildPaginationMeta(NaN, NaN, NaN);
assert(metaNaN.page === 1 && metaNaN.limit === 20 && metaNaN.totalCount === 0 && metaNaN.totalPages === 1, 'Test 11h: buildPaginationMeta safely defaults NaN inputs');

const metaNeg = buildPaginationMeta(-50, -2, -10);
assert(metaNeg.totalCount === 0 && metaNeg.page === 1 && metaNeg.limit === 20, 'Test 11i: buildPaginationMeta safely handles negative totals');

// 11j-11l: Pure category-filter construction tests
const catFilter = buildExpenseCategoryAccessFilter('cat_housing', 'usr_alice');
assert(catFilter.type === CategoryType.EXPENSE, 'Test 11j: buildExpenseCategoryAccessFilter enforces CategoryType.EXPENSE');
assert(Array.isArray(catFilter.AND) && catFilter.AND.length === 2, 'Test 11k: buildExpenseCategoryAccessFilter creates 2-clause AND condition');

// Verify that user isolation branch allows caller OR system defaults
const authClause = (catFilter.AND as Array<{ OR?: unknown[] }>)[1];
const hasUserBranch = JSON.stringify(authClause).includes('"userId":"usr_alice"');
const hasSystemBranch = JSON.stringify(authClause).includes('"isSystem":true');
assert(hasUserBranch && hasSystemBranch, 'Test 11l: buildExpenseCategoryAccessFilter scopes to caller userId OR global system category');

// 11m-11o: Pure deletion result verification tests
let threwZeroDelete = false;
try {
  verifyDeletionResult(0, 'SalaryRecord', 'sal_nonexistent');
} catch (e) {
  if (e instanceof RecordNotFoundError && e.recordId === 'sal_nonexistent') {
    threwZeroDelete = true;
  }
}
assert(threwZeroDelete, 'Test 11m: verifyDeletionResult throws RecordNotFoundError when count === 0');

let threwOneDelete = false;
try {
  verifyDeletionResult(1, 'SalaryRecord', 'sal_existing');
} catch {
  threwOneDelete = true;
}
assert(!threwOneDelete, 'Test 11n: verifyDeletionResult does not throw when count === 1');

let threwZeroExpense = false;
try {
  verifyDeletionResult(0, 'Expense', 'exp_nonexistent');
} catch (e) {
  if (e instanceof RecordNotFoundError && e.entityName === 'Expense') {
    threwZeroExpense = true;
  }
}
assert(threwZeroExpense, 'Test 11o: verifyDeletionResult throws RecordNotFoundError for Expense when count === 0');

// 12. Savings Repository Regression Tests

// 12a-12c: SavingsGoal validation
const validGoal = validateSavingsGoalInput({
  name: 'Emergency Fund 2026',
  category: 'emergency_fund',
  targetAmount: 500000,
  targetDate: '2026-12-31',
  isEmergencyFund: true,
  notes: '6 months expenses',
});
assert(validGoal.name === 'Emergency Fund 2026', 'Test 12a: validateSavingsGoalInput preserves valid name');
assert(validGoal.targetAmountDecimal?.toString() === '500000', 'Test 12b: validateSavingsGoalInput converts targetAmount to Decimal');
assert(validGoal.isEmergencyFund === true, 'Test 12c: validateSavingsGoalInput preserves isEmergencyFund flag');

let threwEmptyGoalName = false;
try {
  validateSavingsGoalInput({ name: '   ' });
} catch (e) {
  if (e instanceof ValidationError) threwEmptyGoalName = true;
}
assert(threwEmptyGoalName, 'Test 12d: validateSavingsGoalInput rejects empty goal name');

let threwNegGoalAmount = false;
try {
  validateSavingsGoalInput({ name: 'Car Fund', targetAmount: -1000 });
} catch (e) {
  if (e instanceof ValidationError) threwNegGoalAmount = true;
}
assert(threwNegGoalAmount, 'Test 12e: validateSavingsGoalInput rejects negative targetAmount');

// 12f-12i: SavingsRecord validation
const validSavingsRecord = validateSavingsRecordInput({
  amount: 25000.75,
  currency: 'pkr',
  category: 'hajj_umrah',
  date: '2026-10-15T09:30:00Z',
});
assert(validSavingsRecord.currency === 'PKR', 'Test 12f: validateSavingsRecordInput normalizes currency');
assert(validSavingsRecord.periodYear === 2026, 'Test 12g: validateSavingsRecordInput derives periodYear from date');
assert(validSavingsRecord.periodMonth === 10, 'Test 12h: validateSavingsRecordInput derives periodMonth from date');
assert(validSavingsRecord.amountDecimal.toString() === '25000.75', 'Test 12i: validateSavingsRecordInput converts amount to Decimal');

let threwNegSavings = false;
try {
  validateSavingsRecordInput({ amount: 0, date: new Date() });
} catch (e) {
  if (e instanceof ValidationError) threwNegSavings = true;
}
assert(threwNegSavings, 'Test 12j: validateSavingsRecordInput rejects amount <= 0');

// 12k-12m: SavingsCategory bidirectional mapping
assert(dbSavingsCategoryToDomain(DbSavingsCategory.EMERGENCY_FUND) === 'emergency_fund', 'Test 12k: dbSavingsCategoryToDomain maps EMERGENCY_FUND');
assert(domainSavingsCategoryToDb('retirement') === DbSavingsCategory.RETIREMENT, 'Test 12l: domainSavingsCategoryToDb maps retirement');
assert(domainSavingsCategoryToDb(undefined) === DbSavingsCategory.GENERAL_SAVINGS, 'Test 12m: domainSavingsCategoryToDb defaults to GENERAL_SAVINGS');

// 12n-12o: Domain model mapping
const mockDbGoal = {
  id: 'goal_abc_123',
  userId: 'usr_mock_1',
  name: 'House Downpayment',
  category: DbSavingsCategory.HOUSE_DOWNPAYMENT,
  targetAmount: new Prisma.Decimal('1500000.00'),
  targetDate: new Date('2027-06-30T00:00:00.000Z'),
  isEmergencyFund: false,
  notes: null,
  createdAt: now,
  updatedAt: now,
};
const domainGoal = mapSavingsGoalToDomain(mockDbGoal);
assert(domainGoal.targetAmount === 1500000, 'Test 12n: mapSavingsGoalToDomain maps targetAmount Decimal to number');
assert(domainGoal.category === 'house_downpayment', 'Test 12o: mapSavingsGoalToDomain maps category enum');

const mockDbSavingsRec = {
  id: 'srec_abc_999',
  userId: 'usr_mock_1',
  goalId: 'goal_abc_123',
  amount: new Prisma.Decimal('75000.00'),
  currency: 'PKR',
  category: DbSavingsCategory.GENERAL_SAVINGS,
  date: new Date('2026-10-15T00:00:00.000Z'),
  periodYear: 2026,
  periodMonth: 10,
  notes: 'Monthly allocation',
  createdAt: now,
  updatedAt: now,
};
const domainSavingsRec = mapSavingsRecordToDomain(mockDbSavingsRec, 'House Downpayment');
assert(domainSavingsRec.amount === 75000, 'Test 12p: mapSavingsRecordToDomain maps amount Decimal');
assert(domainSavingsRec.targetGoalName === 'House Downpayment', 'Test 12q: mapSavingsRecordToDomain maps joined goal name');
assert(domainSavingsRec.goalId === 'goal_abc_123', 'Test 12r: mapSavingsRecordToDomain preserves goalId');

// 13. Investment Repository Regression Tests

// 13a-13c: InvestmentAsset validation
const validAsset = validateInvestmentAssetInput({
  assetName: 'Meezan Islamic Fund',
  investmentType: 'mutual_fund',
  institutionOrPlatform: 'Al Meezan Investments',
  notes: 'Long-term capital growth',
});
assert(validAsset.assetName === 'Meezan Islamic Fund', 'Test 13a: validateInvestmentAssetInput preserves assetName');
assert(validAsset.investmentType === 'mutual_fund', 'Test 13b: validateInvestmentAssetInput preserves investmentType');
assert(validAsset.institutionOrPlatform === 'Al Meezan Investments', 'Test 13c: validateInvestmentAssetInput preserves institutionOrPlatform');

const defaultTypeAsset = validateInvestmentAssetInput({ assetName: 'Gold Bar 10g' });
assert(defaultTypeAsset.investmentType === 'other', 'Test 13d: validateInvestmentAssetInput defaults investmentType to other');

let threwEmptyAssetName = false;
try {
  validateInvestmentAssetInput({ assetName: '   ' });
} catch (e) {
  if (e instanceof ValidationError) threwEmptyAssetName = true;
}
assert(threwEmptyAssetName, 'Test 13e: validateInvestmentAssetInput rejects empty assetName');

// 13f-13i: InvestmentRecord validation
const validInvRecord = validateInvestmentRecordInput({
  amount: 50000,
  currency: 'pkr',
  investmentType: 'stocks',
  date: '2026-10-15T14:00:00Z',
});
assert(validInvRecord.currency === 'PKR', 'Test 13f: validateInvestmentRecordInput normalizes currency');
assert(validInvRecord.periodYear === 2026, 'Test 13g: validateInvestmentRecordInput derives periodYear from date');
assert(validInvRecord.periodMonth === 10, 'Test 13h: validateInvestmentRecordInput derives periodMonth from date');
assert(validInvRecord.amountDecimal.toString() === '50000', 'Test 13i: validateInvestmentRecordInput converts amount to Decimal');

let threwNegInv = false;
try {
  validateInvestmentRecordInput({ amount: -100, date: new Date() });
} catch (e) {
  if (e instanceof ValidationError) threwNegInv = true;
}
assert(threwNegInv, 'Test 13j: validateInvestmentRecordInput rejects negative amount');

let threwInvalidInvMonth = false;
try {
  validateInvestmentRecordInput({ amount: 1000, date: new Date(), periodMonth: 15 });
} catch (e) {
  if (e instanceof ValidationError) threwInvalidInvMonth = true;
}
assert(threwInvalidInvMonth, 'Test 13k: validateInvestmentRecordInput rejects invalid periodMonth');

// 13l-13o: InvestmentType bidirectional mapping
assert(dbInvestmentTypeToDomain(DbInvestmentType.MUTUAL_FUND) === 'mutual_fund', 'Test 13l: dbInvestmentTypeToDomain maps MUTUAL_FUND');
assert(dbInvestmentTypeToDomain(DbInvestmentType.STOCKS) === 'stocks', 'Test 13m: dbInvestmentTypeToDomain maps STOCKS');
assert(domainInvestmentTypeToDb('crypto') === DbInvestmentType.CRYPTO, 'Test 13n: domainInvestmentTypeToDb maps crypto');
assert(domainInvestmentTypeToDb(undefined) === DbInvestmentType.OTHER, 'Test 13o: domainInvestmentTypeToDb defaults to OTHER');

// 13p-13s: Domain model mapping
const mockDbAsset = {
  id: 'asset_inv_001',
  userId: 'usr_mock_1',
  assetName: 'PSX High Dividend Stock Portfolio',
  investmentType: DbInvestmentType.STOCKS,
  institutionOrPlatform: 'Arif Habib Ltd',
  notes: 'High dividend strategy',
  createdAt: now,
  updatedAt: now,
};
const domainAsset = mapInvestmentAssetToDomain(mockDbAsset);
assert(domainAsset.assetName === 'PSX High Dividend Stock Portfolio', 'Test 13p: mapInvestmentAssetToDomain maps assetName');
assert(domainAsset.investmentType === 'stocks', 'Test 13q: mapInvestmentAssetToDomain maps investmentType');

const mockDbInvRec = {
  id: 'irec_abc_777',
  userId: 'usr_mock_1',
  assetId: 'asset_inv_001',
  amount: new Prisma.Decimal('120000.50'),
  currency: 'PKR',
  investmentType: DbInvestmentType.STOCKS,
  date: new Date('2026-10-15T00:00:00.000Z'),
  periodYear: 2026,
  periodMonth: 10,
  notes: 'Monthly SIP',
  createdAt: now,
  updatedAt: now,
};
const domainInvRec = mapInvestmentRecordToDomain(mockDbInvRec, {
  assetName: 'PSX High Dividend Stock Portfolio',
  institutionOrPlatform: 'Arif Habib Ltd',
});
assert(domainInvRec.amount === 120000.5, 'Test 13r: mapInvestmentRecordToDomain maps amount Decimal');
assert(domainInvRec.assetName === 'PSX High Dividend Stock Portfolio', 'Test 13s: mapInvestmentRecordToDomain maps joined assetName');
assert(domainInvRec.institutionOrPlatform === 'Arif Habib Ltd', 'Test 13t: mapInvestmentRecordToDomain maps joined institutionOrPlatform');
assert(domainInvRec.assetId === 'asset_inv_001', 'Test 13u: mapInvestmentRecordToDomain preserves assetId');

// 14. Insurance Repository Regression Tests

// 14a-14d: InsurancePolicy validation
const validPolicy = validateInsurancePolicyInput({
  policyName: '  Jubilee Life Gold Plan  ',
  policyNumber: ' POL-98765 ',
  provider: ' Jubilee Life ',
  category: 'life',
  premiumAmount: 85000,
  currency: 'pkr',
  frequency: 'annually',
  startDate: '2026-01-01',
  renewalDate: '2027-01-01',
  isActive: true,
  notes: ' Family coverage ',
});
assert(validPolicy.policyName === 'Jubilee Life Gold Plan', 'Test 14a: validateInsurancePolicyInput trims policyName');
assert(validPolicy.premiumAmountDecimal.toString() === '85000', 'Test 14b: validateInsurancePolicyInput converts premiumAmount to Decimal');
assert(validPolicy.currency === 'PKR', 'Test 14c: validateInsurancePolicyInput normalizes currency');
assert(validPolicy.frequency === 'annually', 'Test 14d: validateInsurancePolicyInput preserves frequency');
assert(validPolicy.policyNumber === 'POL-98765', 'Test 14e: validateInsurancePolicyInput trims policyNumber');

const defaultPolicy = validateInsurancePolicyInput({
  policyName: 'EFU Health Guard',
  category: 'health',
  premiumAmount: 30000,
  startDate: new Date('2026-06-01'),
});
assert(defaultPolicy.currency === 'PKR', 'Test 14f: validateInsurancePolicyInput defaults currency to PKR');
assert(defaultPolicy.frequency === 'annually', 'Test 14g: validateInsurancePolicyInput defaults frequency to annually');
assert(defaultPolicy.isActive === true, 'Test 14h: validateInsurancePolicyInput defaults isActive to true');

let threwEmptyPolicyName = false;
try {
  validateInsurancePolicyInput({ policyName: '   ', category: 'health', premiumAmount: 1000, startDate: new Date() });
} catch (e) {
  if (e instanceof ValidationError) threwEmptyPolicyName = true;
}
assert(threwEmptyPolicyName, 'Test 14i: validateInsurancePolicyInput rejects empty policyName');

let threwNegativePremium = false;
try {
  validateInsurancePolicyInput({ policyName: 'Test Policy', category: 'health', premiumAmount: -500, startDate: new Date() });
} catch (e) {
  if (e instanceof ValidationError) threwNegativePremium = true;
}
assert(threwNegativePremium, 'Test 14j: validateInsurancePolicyInput rejects negative premiumAmount');

let threwBadCurrency = false;
try {
  validateInsurancePolicyInput({ policyName: 'Test Policy', category: 'health', premiumAmount: 500, currency: 'TOOLONG', startDate: new Date() });
} catch (e) {
  if (e instanceof ValidationError) threwBadCurrency = true;
}
assert(threwBadCurrency, 'Test 14k: validateInsurancePolicyInput rejects invalid currency length');

// 14l-14p: InsurancePayment validation
const validPayment = validateInsurancePaymentInput({
  policyId: 'pol_123456',
  amount: 21250.50,
  currency: 'pkr',
  paymentDate: '2026-10-15T08:00:00Z',
  notes: ' Q4 Installment ',
});
assert(validPayment.policyId === 'pol_123456', 'Test 14l: validateInsurancePaymentInput validates policyId');
assert(validPayment.amountDecimal.toString() === '21250.5', 'Test 14m: validateInsurancePaymentInput converts amount to Decimal');
assert(validPayment.currency === 'PKR', 'Test 14n: validateInsurancePaymentInput normalizes currency');
assert(validPayment.periodYear === 2026, 'Test 14o: validateInsurancePaymentInput derives periodYear in UTC');
assert(validPayment.periodMonth === 10, 'Test 14p: validateInsurancePaymentInput derives periodMonth in UTC');

let threwZeroPayment = false;
try {
  validateInsurancePaymentInput({ policyId: 'pol_123', amount: 0, paymentDate: new Date() });
} catch (e) {
  if (e instanceof ValidationError) threwZeroPayment = true;
}
assert(threwZeroPayment, 'Test 14q: validateInsurancePaymentInput rejects amount <= 0');

let threwBadPeriodMonth = false;
try {
  validateInsurancePaymentInput({ policyId: 'pol_123', amount: 1000, paymentDate: new Date(), periodMonth: 13 });
} catch (e) {
  if (e instanceof ValidationError) threwBadPeriodMonth = true;
}
assert(threwBadPeriodMonth, 'Test 14r: validateInsurancePaymentInput rejects periodMonth > 12');

let threwEmptyPaymentPolicyId = false;
try {
  validateInsurancePaymentInput({ policyId: '   ', amount: 1000, paymentDate: new Date() });
} catch (e) {
  if (e instanceof ValidationError) threwEmptyPaymentPolicyId = true;
}
assert(threwEmptyPaymentPolicyId, 'Test 14s: validateInsurancePaymentInput rejects empty policyId');

// 14t-14w: InsuranceCategory bidirectional mapping
assert(dbInsuranceCategoryToDomain(DbInsuranceCategory.HEALTH) === 'health', 'Test 14t: dbInsuranceCategoryToDomain maps HEALTH');
assert(dbInsuranceCategoryToDomain(DbInsuranceCategory.LIFE) === 'life', 'Test 14u: dbInsuranceCategoryToDomain maps LIFE');
assert(domainInsuranceCategoryToDb('vehicle') === DbInsuranceCategory.VEHICLE, 'Test 14v: domainInsuranceCategoryToDb maps vehicle');
assert(domainInsuranceCategoryToDb(undefined) === DbInsuranceCategory.OTHER, 'Test 14w: domainInsuranceCategoryToDb defaults to OTHER');

// 14x-14aa: InsuranceFrequency bidirectional mapping
assert(dbInsuranceFrequencyToDomain(DbInsuranceFrequency.SEMI_ANNUALLY) === 'semi-annually', 'Test 14x: dbInsuranceFrequencyToDomain maps SEMI_ANNUALLY');
assert(dbInsuranceFrequencyToDomain(DbInsuranceFrequency.ANNUALLY) === 'annually', 'Test 14y: dbInsuranceFrequencyToDomain maps ANNUALLY');
assert(domainInsuranceFrequencyToDb('semi-annually') === DbInsuranceFrequency.SEMI_ANNUALLY, 'Test 14z: domainInsuranceFrequencyToDb maps semi-annually');
assert(domainInsuranceFrequencyToDb('semi_annually') === DbInsuranceFrequency.SEMI_ANNUALLY, 'Test 14aa: domainInsuranceFrequencyToDb accepts semi_annually');
assert(domainInsuranceFrequencyToDb(undefined) === DbInsuranceFrequency.ANNUALLY, 'Test 14ab: domainInsuranceFrequencyToDb defaults to ANNUALLY');

// 14ac-14ag: Domain model mapping
const mockDbPolicy = {
  id: 'pol_db_001',
  userId: 'usr_mock_1',
  policyName: 'Pak Qatar Family Protection',
  policyNumber: 'PQ-9988',
  provider: 'Pak Qatar',
  category: DbInsuranceCategory.HEALTH,
  premiumAmount: new Prisma.Decimal('45000.00'),
  currency: 'PKR',
  frequency: DbInsuranceFrequency.ANNUALLY,
  startDate: new Date('2026-01-01T00:00:00.000Z'),
  renewalDate: new Date('2027-01-01T00:00:00.000Z'),
  isActive: true,
  notes: null,
  createdAt: now,
  updatedAt: now,
};
const domainPolicy = mapInsurancePolicyToDomain(mockDbPolicy);
assert(domainPolicy.policyName === 'Pak Qatar Family Protection', 'Test 14ac: mapInsurancePolicyToDomain maps policyName');
assert(domainPolicy.premiumAmount === 45000, 'Test 14ad: mapInsurancePolicyToDomain maps premiumAmount Decimal');
assert(domainPolicy.category === 'health', 'Test 14ae: mapInsurancePolicyToDomain maps category enum');
assert(domainPolicy.frequency === 'annually', 'Test 14af: mapInsurancePolicyToDomain maps frequency enum');
assert(domainPolicy.notes === undefined, 'Test 14ag: mapInsurancePolicyToDomain maps null notes to undefined');

const mockDbPayment = {
  id: 'pay_db_001',
  userId: 'usr_mock_1',
  policyId: 'pol_db_001',
  amount: new Prisma.Decimal('45000.00'),
  currency: 'PKR',
  paymentDate: new Date('2026-01-05T00:00:00.000Z'),
  periodYear: 2026,
  periodMonth: 1,
  notes: 'Annual contribution',
  createdAt: now,
  updatedAt: now,
};
const domainPayment = mapInsurancePaymentToDomain(mockDbPayment, {
  policyName: 'Pak Qatar Family Protection',
  category: DbInsuranceCategory.HEALTH,
});
assert(domainPayment.amount === 45000, 'Test 14ah: mapInsurancePaymentToDomain maps amount Decimal');
assert(domainPayment.policyName === 'Pak Qatar Family Protection', 'Test 14ai: mapInsurancePaymentToDomain maps joined policyName');
assert(domainPayment.category === 'health', 'Test 14aj: mapInsurancePaymentToDomain maps joined category enum');
assert(domainPayment.periodYear === 2026, 'Test 14ak: mapInsurancePaymentToDomain preserves periodYear');
assert(domainPayment.periodMonth === 1, 'Test 14al: mapInsurancePaymentToDomain preserves periodMonth');

// 14am-14an: Deletion verification for Insurance
let threwZeroPolicyDelete = false;
try {
  verifyDeletionResult(0, 'InsurancePolicy', 'pol_nonexistent');
} catch (e) {
  if (e instanceof RecordNotFoundError && e.recordId === 'pol_nonexistent' && e.entityName === 'InsurancePolicy') {
    threwZeroPolicyDelete = true;
  }
}
assert(threwZeroPolicyDelete, 'Test 14am: verifyDeletionResult throws RecordNotFoundError for InsurancePolicy');

let threwZeroPaymentDelete = false;
try {
  verifyDeletionResult(0, 'InsurancePayment', 'pay_nonexistent');
} catch (e) {
  if (e instanceof RecordNotFoundError && e.recordId === 'pay_nonexistent' && e.entityName === 'InsurancePayment') {
    threwZeroPaymentDelete = true;
  }
}
assert(threwZeroPaymentDelete, 'Test 14an: verifyDeletionResult throws RecordNotFoundError for InsurancePayment');

// 14ao-14ar: validateMonetaryAmount checks
let threwSubCentAmount = false;
try {
  validateMonetaryAmount(100.555, 'premiumAmount');
} catch (e) {
  if (e instanceof ValidationError) threwSubCentAmount = true;
}
assert(threwSubCentAmount, 'Test 14ao: validateMonetaryAmount rejects sub-cent precision (>2 decimal places)');

let threwMonetaryNaN = false;
try {
  validateMonetaryAmount(NaN, 'premiumAmount');
} catch (e) {
  if (e instanceof ValidationError) threwMonetaryNaN = true;
}
assert(threwMonetaryNaN, 'Test 14ap: validateMonetaryAmount rejects NaN');

let threwMonetaryInf = false;
try {
  validateMonetaryAmount(Infinity, 'premiumAmount');
} catch (e) {
  if (e instanceof ValidationError) threwMonetaryInf = true;
}
assert(threwMonetaryInf, 'Test 14aq: validateMonetaryAmount rejects Infinity');

let threwMonetaryLimit = false;
try {
  validateMonetaryAmount(99_000_000_000_000, 'premiumAmount');
} catch (e) {
  if (e instanceof ValidationError) threwMonetaryLimit = true;
}
assert(threwMonetaryLimit, 'Test 14ar: validateMonetaryAmount rejects amounts exceeding safe currency bounds');

// 14as-14au: Additional InsurancePolicy input validation
let threwInvalidCategory = false;
try {
  validateInsurancePolicyInput({
    policyName: 'Invalid Policy',
    category: 'marine' as unknown as DomainInsuranceCategory,
    premiumAmount: 10000,
    startDate: new Date(),
  });
} catch (e) {
  if (e instanceof ValidationError) threwInvalidCategory = true;
}
assert(threwInvalidCategory, 'Test 14as: validateInsurancePolicyInput rejects invalid category');

let threwInvalidFrequency = false;
try {
  validateInsurancePolicyInput({
    policyName: 'Invalid Policy',
    category: 'life',
    frequency: 'daily' as unknown as DomainInsuranceFrequency,
    premiumAmount: 10000,
    startDate: new Date(),
  });
} catch (e) {
  if (e instanceof ValidationError) threwInvalidFrequency = true;
}
assert(threwInvalidFrequency, 'Test 14at: validateInsurancePolicyInput rejects invalid frequency');

let threwInvalidStartDate = false;
try {
  validateInsurancePolicyInput({
    policyName: 'Invalid Policy',
    category: 'life',
    premiumAmount: 10000,
    startDate: 'not-a-valid-date',
  });
} catch (e) {
  if (e instanceof ValidationError) threwInvalidStartDate = true;
}
assert(threwInvalidStartDate, 'Test 14au: validateInsurancePolicyInput rejects unparseable startDate');

// 14av-14ay: Additional InsurancePayment input validation
let threwPaymentSubCent = false;
try {
  validateInsurancePaymentInput({
    policyId: 'pol_123',
    amount: 1500.888,
    paymentDate: new Date(),
  });
} catch (e) {
  if (e instanceof ValidationError) threwPaymentSubCent = true;
}
assert(threwPaymentSubCent, 'Test 14av: validateInsurancePaymentInput rejects sub-cent amount');

let threwPaymentLowYear = false;
try {
  validateInsurancePaymentInput({
    policyId: 'pol_123',
    amount: 1500,
    paymentDate: new Date(),
    periodYear: 1850,
  });
} catch (e) {
  if (e instanceof ValidationError) threwPaymentLowYear = true;
}
assert(threwPaymentLowYear, 'Test 14aw: validateInsurancePaymentInput rejects periodYear < 1900');

let threwPaymentHighYear = false;
try {
  validateInsurancePaymentInput({
    policyId: 'pol_123',
    amount: 1500,
    paymentDate: new Date(),
    periodYear: 2150,
  });
} catch (e) {
  if (e instanceof ValidationError) threwPaymentHighYear = true;
}
assert(threwPaymentHighYear, 'Test 14ax: validateInsurancePaymentInput rejects periodYear > 2100');

let threwPaymentBadDate = false;
try {
  validateInsurancePaymentInput({
    policyId: 'pol_123',
    amount: 1500,
    paymentDate: 'invalid-date-format',
  });
} catch (e) {
  if (e instanceof ValidationError) threwPaymentBadDate = true;
}
assert(threwPaymentBadDate, 'Test 14ay: validateInsurancePaymentInput rejects unparseable paymentDate');

// 14az: validateRecordId validation
assert(validateRecordId('pol_valid_123', 'InsurancePolicy') === 'pol_valid_123', 'Test 14az: validateRecordId returns trimmed valid ID');

// 14ba-14bb: Multi-tenant ownership verification simulation
function simulateVerifyInsurancePolicyAccess(
  policy: { id: string; userId: string; policyName: string; category: DbInsuranceCategory } | null,
  requestedPolicyId: string,
  callerUserId: string
) {
  const safePolicyId = validateRecordId(requestedPolicyId, 'InsurancePolicy');
  const safeCallerId = validateUserId(callerUserId);
  if (!policy || policy.id !== safePolicyId || policy.userId !== safeCallerId) {
    throw new RecordNotFoundError('InsurancePolicy', safePolicyId);
  }
  return { id: policy.id, policyName: policy.policyName, category: policy.category };
}

const tenantAlicePolicy = {
  id: 'pol_alice_1',
  userId: 'usr_alice',
  policyName: 'Alice Life Plan',
  category: DbInsuranceCategory.LIFE,
};

const accessedByAlice = simulateVerifyInsurancePolicyAccess(tenantAlicePolicy, 'pol_alice_1', 'usr_alice');
assert(accessedByAlice.id === 'pol_alice_1', 'Test 14ba: Policy access granted to authorized tenant');

let threwCrossTenantAccess = false;
try {
  simulateVerifyInsurancePolicyAccess(tenantAlicePolicy, 'pol_alice_1', 'usr_bob');
} catch (e) {
  if (e instanceof RecordNotFoundError && e.recordId === 'pol_alice_1') {
    threwCrossTenantAccess = true;
  }
}
assert(threwCrossTenantAccess, 'Test 14bb: Cross-tenant policy access throws RecordNotFoundError without leaking existence');

// ==============================================================================
// 15. MongoDB Decimal128 Precision & Safety Tests
// ==============================================================================
import { Types } from 'mongoose';
import {
  numberToDecimal128,
  decimal128ToSafeNumber,
  optionalDecimal128ToSafeNumber,
  decimal128ToString,
  validateMonetaryNumber,
  UnsafeDecimalConversionError as MongoDecimalError,
} from '../lib/db/decimal';

// 15a: numberToDecimal128 converts accurately with 2 decimal places
const d1 = numberToDecimal128(250000.5);
assert(d1.toString() === '250000.50', 'Test 15a: numberToDecimal128 formats with exact 2 decimal places', d1.toString(), '250000.50');

// 15b: decimal128ToSafeNumber converts Types.Decimal128 to exact number
const n1 = decimal128ToSafeNumber(d1);
assert(n1 === 250000.5, 'Test 15b: decimal128ToSafeNumber converts Decimal128 to exact number', n1, 250000.5);

// 15c: decimal128ToSafeNumber converts safe numeric input
const n2 = decimal128ToSafeNumber(15400.75);
assert(n2 === 15400.75, 'Test 15c: decimal128ToSafeNumber accepts and validates safe number', n2, 15400.75);

// 15d: decimal128ToSafeNumber rejects null and undefined
let threwNullDec128 = false;
try {
  decimal128ToSafeNumber(null);
} catch (e) {
  if (e instanceof MongoDecimalError) threwNullDec128 = true;
}
assert(threwNullDec128, 'Test 15d: decimal128ToSafeNumber rejects null on required field');

// 15e: decimal128ToSafeNumber rejects sub-cent precision (>2 decimals)
let threwSubCentDec128 = false;
try {
  decimal128ToSafeNumber(Types.Decimal128.fromString('100.555'));
} catch (e) {
  if (e instanceof MongoDecimalError) threwSubCentDec128 = true;
}
assert(threwSubCentDec128, 'Test 15e: decimal128ToSafeNumber rejects sub-cent Decimal128 (100.555)');

// 15f: decimal128ToSafeNumber rejects magnitude exceeding 90 trillion
let threwOverflowDec128 = false;
try {
  decimal128ToSafeNumber(Types.Decimal128.fromString('99999999999999999999'));
} catch (e) {
  if (e instanceof MongoDecimalError) threwOverflowDec128 = true;
}
assert(threwOverflowDec128, 'Test 15f: decimal128ToSafeNumber rejects magnitude > 90 trillion');

// 15g: decimal128ToSafeNumber rejects NaN and Infinity
let threwNaNDec128 = false;
try {
  decimal128ToSafeNumber(Types.Decimal128.fromString('NaN'));
} catch (e) {
  if (e instanceof MongoDecimalError) threwNaNDec128 = true;
}
assert(threwNaNDec128, 'Test 15g: decimal128ToSafeNumber rejects NaN');

// 15h: validateMonetaryNumber rejects NaN and non-finite
let threwNumNaN = false;
try {
  validateMonetaryNumber(NaN);
} catch (e) {
  if (e instanceof MongoDecimalError) threwNumNaN = true;
}
assert(threwNumNaN, 'Test 15h: validateMonetaryNumber rejects NaN');

// 15i: optionalDecimal128ToSafeNumber safely handles null and undefined
assert(optionalDecimal128ToSafeNumber(null) === undefined, 'Test 15i: optionalDecimal128ToSafeNumber returns undefined for null');
assert(optionalDecimal128ToSafeNumber(undefined) === undefined, 'Test 15j: optionalDecimal128ToSafeNumber returns undefined for undefined');
assert(optionalDecimal128ToSafeNumber(Types.Decimal128.fromString('500.25')) === 500.25, 'Test 15k: optionalDecimal128ToSafeNumber converts valid value');

// 15l: decimal128ToString formats cleanly to 2 decimal places
assert(decimal128ToString(Types.Decimal128.fromString('1234.5')) === '1234.50', 'Test 15l: decimal128ToString formats 1234.5 to 1234.50');
assert(decimal128ToString(null) === null, 'Test 15m: decimal128ToString returns null for null input');

// ==============================================================================
// 16. MongoDB Model Schemas & Multi-Tenant Index Verification
// ==============================================================================
import {
  UserModel,
  FinancialProfileModel,
  CategoryModel,
  SalaryRecordModel,
  ExpenseModel,
  SavingsGoalModel,
  SavingsRecordModel,
  InvestmentAssetModel,
  InvestmentRecordModel,
  InsurancePolicyModel,
  InsurancePaymentModel,
  LoanModel,
  LoanRepaymentModel,
  type IUser,
  type ICategory,
  type ISalaryRecord,
  type IExpense,
  type ILoan,
  type ILoanRepayment,
} from '../lib/db/models';

assert(Boolean(UserModel?.schema), 'Test 16a: UserModel is registered with schema');
assert(Boolean(FinancialProfileModel?.schema), 'Test 16b: FinancialProfileModel is registered with schema');
assert(Boolean(CategoryModel?.schema), 'Test 16c: CategoryModel is registered with schema');
assert(Boolean(SalaryRecordModel?.schema), 'Test 16d: SalaryRecordModel is registered with schema');
assert(Boolean(ExpenseModel?.schema), 'Test 16e: ExpenseModel is registered with schema');
assert(Boolean(SavingsGoalModel?.schema), 'Test 16f: SavingsGoalModel is registered with schema');
assert(Boolean(SavingsRecordModel?.schema), 'Test 16g: SavingsRecordModel is registered with schema');
assert(Boolean(InvestmentAssetModel?.schema), 'Test 16h: InvestmentAssetModel is registered with schema');
assert(Boolean(InvestmentRecordModel?.schema), 'Test 16i: InvestmentRecordModel is registered with schema');
assert(Boolean(InsurancePolicyModel?.schema), 'Test 16j: InsurancePolicyModel is registered with schema');
assert(Boolean(InsurancePaymentModel?.schema), 'Test 16k: InsurancePaymentModel is registered with schema');
assert(Boolean(LoanModel?.schema), 'Test 16l: LoanModel is registered with schema');
assert(Boolean(LoanRepaymentModel?.schema), 'Test 16m: LoanRepaymentModel is registered with schema');

// Verify multi-tenant collections enforce userId field in schema
const modelsWithTenant = [
  { name: 'FinancialProfile', schema: FinancialProfileModel.schema },
  { name: 'Category', schema: CategoryModel.schema },
  { name: 'SalaryRecord', schema: SalaryRecordModel.schema },
  { name: 'Expense', schema: ExpenseModel.schema },
  { name: 'SavingsGoal', schema: SavingsGoalModel.schema },
  { name: 'SavingsRecord', schema: SavingsRecordModel.schema },
  { name: 'InvestmentAsset', schema: InvestmentAssetModel.schema },
  { name: 'InvestmentRecord', schema: InvestmentRecordModel.schema },
  { name: 'InsurancePolicy', schema: InsurancePolicyModel.schema },
  { name: 'InsurancePayment', schema: InsurancePaymentModel.schema },
  { name: 'Loan', schema: LoanModel.schema },
  { name: 'LoanRepayment', schema: LoanRepaymentModel.schema },
];

for (const { name, schema } of modelsWithTenant) {
  const hasUserId = Boolean(schema.paths['userId']);
  assert(hasUserId, `Test 16n: ${name} schema contains required multi-tenant userId path`);
}

// Verify Decimal128 schema fields use Schema.Types.Decimal128
assert(SalaryRecordModel.schema.paths['amount']?.instance === 'Decimal128', 'Test 16o: SalaryRecord amount path is Decimal128');
assert(ExpenseModel.schema.paths['amount']?.instance === 'Decimal128', 'Test 16p: Expense amount path is Decimal128');
assert(SavingsRecordModel.schema.paths['amount']?.instance === 'Decimal128', 'Test 16q: SavingsRecord amount path is Decimal128');
assert(InvestmentRecordModel.schema.paths['amount']?.instance === 'Decimal128', 'Test 16r: InvestmentRecord amount path is Decimal128');
assert(InsurancePolicyModel.schema.paths['premiumAmount']?.instance === 'Decimal128', 'Test 16s: InsurancePolicy premiumAmount path is Decimal128');
assert(InsurancePaymentModel.schema.paths['amount']?.instance === 'Decimal128', 'Test 16t: InsurancePayment amount path is Decimal128');
assert(LoanModel.schema.paths['principalAmount']?.instance === 'Decimal128', 'Test 16u: Loan principalAmount path is Decimal128');
assert(LoanRepaymentModel.schema.paths['amount']?.instance === 'Decimal128', 'Test 16v: LoanRepayment amount path is Decimal128');

// ==============================================================================
// 17. MongoDB Document Mappers & Type Safety Tests
// ==============================================================================
import {
  mapMongoSalaryRecordToDomain,
  mapMongoExpenseRecordToDomain,
  mapMongoLoanToDomain,
  mapMongoLoanRepaymentToDomain,
  mapMongoCategoryToDomain,
  mapMongoUserToDomain,
  mongoSalaryTypeToDomain,
  domainSalaryTypeToMongo,
  mongoExpenseTypeToDomain,
  domainExpenseTypeToMongo,
  mongoPaymentFrequencyToDomain,
  domainPaymentFrequencyToMongo,
  mongoSavingsCategoryToDomain,
  domainSavingsCategoryToMongo,
  mongoInvestmentTypeToDomain,
  domainInvestmentTypeToMongo,
  mongoInsuranceCategoryToDomain,
  domainInsuranceCategoryToMongo,
  mongoInsuranceFrequencyToDomain,
  domainInsuranceFrequencyToMongo,
  mongoLoanFrequencyToDomain,
  domainLoanFrequencyToMongo,
} from '../lib/db/mongo-mappers';

// 17a: Enum bidirectional mappings
assert(mongoSalaryTypeToDomain('PRIMARY') === 'primary', 'Test 17a: mongoSalaryTypeToDomain PRIMARY -> primary');
assert(domainSalaryTypeToMongo('bonus') === 'BONUS', 'Test 17b: domainSalaryTypeToMongo bonus -> BONUS');
assert(mongoExpenseTypeToDomain('FIXED') === 'fixed', 'Test 17c: mongoExpenseTypeToDomain FIXED -> fixed');
assert(domainExpenseTypeToMongo('variable') === 'VARIABLE', 'Test 17d: domainExpenseTypeToMongo variable -> VARIABLE');
assert(mongoPaymentFrequencyToDomain('MONTHLY') === 'monthly', 'Test 17e: mongoPaymentFrequencyToDomain MONTHLY -> monthly');
assert(domainPaymentFrequencyToMongo('quarterly') === 'QUARTERLY', 'Test 17f: domainPaymentFrequencyToMongo quarterly -> QUARTERLY');
assert(mongoSavingsCategoryToDomain('HAJJ_UMRAH') === 'hajj_umrah', 'Test 17g: mongoSavingsCategoryToDomain HAJJ_UMRAH -> hajj_umrah');
assert(domainSavingsCategoryToMongo('wedding') === 'WEDDING', 'Test 17h: domainSavingsCategoryToMongo wedding -> WEDDING');
assert(mongoInvestmentTypeToDomain('REAL_ESTATE') === 'real_estate', 'Test 17i: mongoInvestmentTypeToDomain REAL_ESTATE -> real_estate');
assert(domainInvestmentTypeToMongo('gold_precious_metals') === 'GOLD_PRECIOUS_METALS', 'Test 17j: domainInvestmentTypeToMongo gold_precious_metals -> GOLD_PRECIOUS_METALS');
assert(mongoInsuranceCategoryToDomain('HEALTH') === 'health', 'Test 17k: mongoInsuranceCategoryToDomain HEALTH -> health');
assert(domainInsuranceCategoryToMongo('life') === 'LIFE', 'Test 17l: domainInsuranceCategoryToMongo life -> LIFE');
assert(mongoInsuranceFrequencyToDomain('ANNUALLY') === 'annually', 'Test 17m: mongoInsuranceFrequencyToDomain ANNUALLY -> annually');
assert(domainInsuranceFrequencyToMongo('semi-annually') === 'SEMI_ANNUALLY', 'Test 17n: domainInsuranceFrequencyToMongo semi-annually -> SEMI_ANNUALLY');
assert(mongoLoanFrequencyToDomain('BIWEEKLY') === 'biweekly', 'Test 17o: mongoLoanFrequencyToDomain BIWEEKLY -> biweekly');
assert(domainLoanFrequencyToMongo('monthly') === 'MONTHLY', 'Test 17p: domainLoanFrequencyToMongo monthly -> MONTHLY');

// 17q: mapMongoSalaryRecordToDomain
const mockMongoSalaryDoc = {
  _id: new Types.ObjectId(),
  userId: 'usr_mongo_1',
  amount: Types.Decimal128.fromString('425000.00'),
  currency: 'PKR',
  salaryType: 'PRIMARY' as const,
  payPeriodYear: 2026,
  payPeriodMonth: 10,
  paymentDate: now,
  employerOrSource: 'Mongo Global',
  notes: null,
  createdAt: now,
  updatedAt: now,
};
const mappedMongoSalary = mapMongoSalaryRecordToDomain(mockMongoSalaryDoc as unknown as ISalaryRecord);
assert(mappedMongoSalary.amount === 425000, 'Test 17q: mapMongoSalaryRecordToDomain converts Decimal128 amount to 425000');
assert(mappedMongoSalary.id === mockMongoSalaryDoc._id.toString(), 'Test 17r: mapMongoSalaryRecordToDomain extracts string id from _id');
assert(mappedMongoSalary.salaryType === 'primary', 'Test 17s: mapMongoSalaryRecordToDomain maps salaryType PRIMARY -> primary');

// 17t: mapMongoExpenseRecordToDomain
const mockMongoExpenseDoc = {
  _id: new Types.ObjectId(),
  userId: 'usr_mongo_1',
  categoryId: 'cat_groceries',
  amount: Types.Decimal128.fromString('18500.50'),
  currency: 'PKR',
  expenseType: 'VARIABLE' as const,
  date: now,
  periodYear: 2026,
  periodMonth: 10,
  description: 'Monthly groceries',
  isRecurring: false,
  recurringFrequency: null,
  notes: null,
  createdAt: now,
  updatedAt: now,
};
const mappedMongoExpense = mapMongoExpenseRecordToDomain(mockMongoExpenseDoc as unknown as IExpense, 'groceries');
assert(mappedMongoExpense.amount === 18500.5, 'Test 17t: mapMongoExpenseRecordToDomain maps amount to 18500.5');
assert(mappedMongoExpense.category === 'groceries', 'Test 17u: mapMongoExpenseRecordToDomain resolves category slug');
assert(mappedMongoExpense.expenseType === 'variable', 'Test 17v: mapMongoExpenseRecordToDomain maps expenseType VARIABLE -> variable');

// 17w: mapMongoLoanToDomain
const mockMongoLoanDoc = {
  _id: new Types.ObjectId(),
  userId: 'usr_mongo_1',
  loanTitle: 'Home Construction Loan',
  lenderName: 'Bank Alfalah',
  principalAmount: Types.Decimal128.fromString('2000000.00'),
  outstandingAmount: Types.Decimal128.fromString('1750000.00'),
  interestRate: Types.Decimal128.fromString('12.50'),
  installmentAmount: Types.Decimal128.fromString('45000.00'),
  frequency: 'MONTHLY' as const,
  startDate: now,
  endDate: null,
  isClosed: false,
  notes: 'Fixed rate mortgage',
  createdAt: now,
  updatedAt: now,
};
const mappedMongoLoan = mapMongoLoanToDomain(mockMongoLoanDoc as unknown as ILoan);
assert(mappedMongoLoan.principalAmount === 2000000, 'Test 17w: mapMongoLoanToDomain maps principalAmount');
assert(mappedMongoLoan.outstandingAmount === 1750000, 'Test 17x: mapMongoLoanToDomain maps outstandingAmount');
assert(mappedMongoLoan.interestRate === 12.5, 'Test 17y: mapMongoLoanToDomain maps interestRate');
assert(mappedMongoLoan.installmentAmount === 45000, 'Test 17z: mapMongoLoanToDomain maps installmentAmount');
assert(mappedMongoLoan.frequency === 'monthly', 'Test 17aa: mapMongoLoanToDomain maps frequency MONTHLY -> monthly');

// 17ab: mapMongoLoanRepaymentToDomain
const mockMongoRepaymentDoc = {
  _id: new Types.ObjectId(),
  userId: 'usr_mongo_1',
  loanId: mappedMongoLoan.id,
  amount: Types.Decimal128.fromString('45000.00'),
  principalComponent: Types.Decimal128.fromString('25000.00'),
  interestComponent: Types.Decimal128.fromString('20000.00'),
  paymentDate: now,
  periodYear: 2026,
  periodMonth: 10,
  notes: null,
  createdAt: now,
  updatedAt: now,
};
const mappedMongoRepayment = mapMongoLoanRepaymentToDomain(mockMongoRepaymentDoc as unknown as ILoanRepayment);
assert(mappedMongoRepayment.amount === 45000, 'Test 17ab: mapMongoLoanRepaymentToDomain maps repayment amount');
assert(mappedMongoRepayment.principalComponent === 25000, 'Test 17ac: mapMongoLoanRepaymentToDomain maps principal component');
assert(mappedMongoRepayment.interestComponent === 20000, 'Test 17ad: mapMongoLoanRepaymentToDomain maps interest component');

// 17ae: mapMongoCategoryToDomain
const mockMongoCategoryDoc = {
  _id: new Types.ObjectId(),
  userId: null,
  name: 'Housing & Rent',
  slug: 'housing',
  type: 'EXPENSE' as const,
  defaultExpenseType: 'FIXED' as const,
  icon: 'home',
  color: '#4F46E5',
  isSystem: true,
  createdAt: now,
  updatedAt: now,
};
const mappedMongoCategory = mapMongoCategoryToDomain(mockMongoCategoryDoc as unknown as ICategory);
assert(mappedMongoCategory.slug === 'housing', 'Test 17ae: mapMongoCategoryToDomain maps slug');
assert(mappedMongoCategory.type === 'expense', 'Test 17af: mapMongoCategoryToDomain maps type EXPENSE -> expense');
assert(mappedMongoCategory.defaultExpenseType === 'fixed', 'Test 17ag: mapMongoCategoryToDomain maps defaultExpenseType FIXED -> fixed');
assert(mappedMongoCategory.isSystem === true, 'Test 17ah: mapMongoCategoryToDomain preserves isSystem flag');

// 17ai: mapMongoUserToDomain
const mockMongoUserDoc = {
  _id: new Types.ObjectId(),
  email: 'ali@fintrack.app',
  name: 'Ali Raza',
  image: 'https://avatar.test/ali.png',
  createdAt: now,
  updatedAt: now,
};
const mappedMongoUser = mapMongoUserToDomain(mockMongoUserDoc as unknown as IUser);
assert(mappedMongoUser.email === 'ali@fintrack.app', 'Test 17ai: mapMongoUserToDomain maps email');
assert(mappedMongoUser.name === 'Ali Raza', 'Test 17aj: mapMongoUserToDomain maps name');
// ==============================================================================
// 18. Salary MongoDB Repository & Model Regression Tests
// ==============================================================================
import {
  validateSalaryInput as validateMongoSalaryInput,
  validateRecordId as validateSalaryRecordId,
  validateObjectId as validateSalaryObjectId,
  isValidObjectId,
} from '../lib/db/repositories/salary';
import type { SalaryType as DomainSalaryType } from '../types/financial';

// 18a: Valid Salary Model Validation (offline Mongoose Schema validation)
const validSalaryMongoDoc = new SalaryRecordModel({
  userId: 'usr_tenant_alpha',
  amount: Types.Decimal128.fromString('375000.50'),
  currency: 'PKR',
  salaryType: 'PRIMARY',
  payPeriodYear: 2026,
  payPeriodMonth: 10,
  paymentDate: new Date('2026-10-01T00:00:00.000Z'),
  employerOrSource: 'Acme Systems',
  notes: 'Regular monthly compensation',
});
const validSalaryValidationErr = validSalaryMongoDoc.validateSync();
assert(validSalaryValidationErr === undefined, 'Test 18a: Valid SalaryRecord document passes Mongoose schema validation');

// 18b: Missing required fields in SalaryRecordModel
const missingFieldsSalaryDoc = new SalaryRecordModel({});
const missingSalaryErr = missingFieldsSalaryDoc.validateSync();
assert(Boolean(missingSalaryErr?.errors['userId']), 'Test 18b: SalaryRecordModel schema rejects missing userId');
assert(Boolean(missingSalaryErr?.errors['amount']), 'Test 18c: SalaryRecordModel schema rejects missing amount');
assert(Boolean(missingSalaryErr?.errors['payPeriodYear']), 'Test 18d: SalaryRecordModel schema rejects missing payPeriodYear');
assert(Boolean(missingSalaryErr?.errors['payPeriodMonth']), 'Test 18e: SalaryRecordModel schema rejects missing payPeriodMonth');
assert(Boolean(missingSalaryErr?.errors['paymentDate']), 'Test 18f: SalaryRecordModel schema rejects missing paymentDate');

// 18g: Schema enum & range validation
const invalidRangeSalaryDoc = new SalaryRecordModel({
  userId: 'usr_123',
  amount: Types.Decimal128.fromString('100.00'),
  salaryType: 'INVALID_ENUM',
  payPeriodYear: 1850,
  payPeriodMonth: 13,
  paymentDate: new Date(),
});
const rangeErr = invalidRangeSalaryDoc.validateSync();
assert(Boolean(rangeErr?.errors['salaryType']), 'Test 18g: SalaryRecordModel rejects invalid salaryType enum');
assert(Boolean(rangeErr?.errors['payPeriodYear']), 'Test 18h: SalaryRecordModel rejects payPeriodYear < 1900');
assert(Boolean(rangeErr?.errors['payPeriodMonth']), 'Test 18i: SalaryRecordModel rejects payPeriodMonth > 12');

// 18j: validateSalaryInput valid input & Decimal128 conversion
const validSalaryInputRes = validateMongoSalaryInput({
  amount: 450000.75,
  currency: 'usd',
  salaryType: 'bonus',
  payPeriodYear: 2026,
  payPeriodMonth: 10,
  paymentDate: '2026-10-15T00:00:00.000Z',
  employerOrSource: ' Global Ventures Ltd ',
  notes: ' Performance bonus ',
});
assert(validSalaryInputRes.amountDecimal instanceof Types.Decimal128, 'Test 18j: validateSalaryInput produces Types.Decimal128 amount');
assert(validSalaryInputRes.amountDecimal.toString() === '450000.75', 'Test 18k: Decimal128 exact 2 decimal places representation', validSalaryInputRes.amountDecimal.toString(), '450000.75');
assert(validSalaryInputRes.currency === 'USD', 'Test 18l: Currency normalized to uppercase USD');
assert(validSalaryInputRes.salaryType === 'bonus', 'Test 18m: SalaryType bonus preserved');
assert(validSalaryInputRes.employerOrSource === 'Global Ventures Ltd', 'Test 18n: Employer trimmed');
assert(validSalaryInputRes.notes === 'Performance bonus', 'Test 18o: Notes trimmed');

// 18p: Invalid salary amount (<= 0)
let threwZeroSalary = false;
try {
  validateMongoSalaryInput({ amount: 0, payPeriodYear: 2026, payPeriodMonth: 10, paymentDate: new Date() });
} catch (e) {
  if (e instanceof ValidationError) threwZeroSalary = true;
}
assert(threwZeroSalary, 'Test 18p: validateSalaryInput rejects zero amount');

let threwNegativeSalary = false;
try {
  validateMongoSalaryInput({ amount: -15000, payPeriodYear: 2026, payPeriodMonth: 10, paymentDate: new Date() });
} catch (e) {
  if (e instanceof ValidationError) threwNegativeSalary = true;
}
assert(threwNegativeSalary, 'Test 18q: validateSalaryInput rejects negative amount');

// 18r: Sub-cent rejection (>2 decimals)
let threwSalarySubCent = false;
try {
  validateMongoSalaryInput({ amount: 250000.999, payPeriodYear: 2026, payPeriodMonth: 10, paymentDate: new Date() });
} catch (e) {
  if (e instanceof ValidationError) threwSalarySubCent = true;
}
assert(threwSalarySubCent, 'Test 18r: validateSalaryInput rejects sub-cent precision (250000.999)');

// 18s: NaN & Infinity rejection
let threwSalaryNaN = false;
try {
  validateMongoSalaryInput({ amount: NaN, payPeriodYear: 2026, payPeriodMonth: 10, paymentDate: new Date() });
} catch (e) {
  if (e instanceof ValidationError) threwSalaryNaN = true;
}
assert(threwSalaryNaN, 'Test 18s: validateSalaryInput rejects NaN amount');

let threwSalaryInf = false;
try {
  validateMongoSalaryInput({ amount: Infinity, payPeriodYear: 2026, payPeriodMonth: 10, paymentDate: new Date() });
} catch (e) {
  if (e instanceof ValidationError) threwSalaryInf = true;
}
assert(threwSalaryInf, 'Test 18t: validateSalaryInput rejects Infinity amount');

// 18u: Amount exceeding 90 trillion bounds
let threwSalaryOverflow = false;
try {
  validateMongoSalaryInput({ amount: 95_000_000_000_000, payPeriodYear: 2026, payPeriodMonth: 10, paymentDate: new Date() });
} catch (e) {
  if (e instanceof ValidationError) threwSalaryOverflow = true;
}
assert(threwSalaryOverflow, 'Test 18u: validateSalaryInput rejects amount exceeding 90 trillion');

// 18v: Invalid currency length
let threwBadCurrencyLength = false;
try {
  validateMongoSalaryInput({ amount: 50000, currency: 'US', payPeriodYear: 2026, payPeriodMonth: 10, paymentDate: new Date() });
} catch (e) {
  if (e instanceof ValidationError) threwBadCurrencyLength = true;
}
assert(threwBadCurrencyLength, 'Test 18v: validateSalaryInput rejects 2-letter currency code');

// 18w: Invalid salary type
let threwBadSalaryType = false;
try {
  validateMongoSalaryInput({
    amount: 50000,
    salaryType: 'cryptocurrency' as unknown as DomainSalaryType,
    payPeriodYear: 2026,
    payPeriodMonth: 10,
    paymentDate: new Date(),
  });
} catch (e) {
  if (e instanceof ValidationError) threwBadSalaryType = true;
}
assert(threwBadSalaryType, 'Test 18w: validateSalaryInput rejects non-whitelisted salaryType');

// 18x: Invalid pay periods
let threwBadMonthLow = false;
try {
  validateMongoSalaryInput({ amount: 50000, payPeriodYear: 2026, payPeriodMonth: 0, paymentDate: new Date() });
} catch (e) {
  if (e instanceof ValidationError) threwBadMonthLow = true;
}
assert(threwBadMonthLow, 'Test 18x: validateSalaryInput rejects payPeriodMonth < 1');

let threwBadMonthHigh = false;
try {
  validateMongoSalaryInput({ amount: 50000, payPeriodYear: 2026, payPeriodMonth: 13, paymentDate: new Date() });
} catch (e) {
  if (e instanceof ValidationError) threwBadMonthHigh = true;
}
assert(threwBadMonthHigh, 'Test 18y: validateSalaryInput rejects payPeriodMonth > 12');

let threwBadYearLow = false;
try {
  validateMongoSalaryInput({ amount: 50000, payPeriodYear: 1899, payPeriodMonth: 6, paymentDate: new Date() });
} catch (e) {
  if (e instanceof ValidationError) threwBadYearLow = true;
}
assert(threwBadYearLow, 'Test 18z: validateSalaryInput rejects payPeriodYear < 1900');

let threwBadYearHigh = false;
try {
  validateMongoSalaryInput({ amount: 50000, payPeriodYear: 2101, payPeriodMonth: 6, paymentDate: new Date() });
} catch (e) {
  if (e instanceof ValidationError) threwBadYearHigh = true;
}
assert(threwBadYearHigh, 'Test 18aa: validateSalaryInput rejects payPeriodYear > 2100');

// 18ab: Invalid date format
let threwBadPaymentDate = false;
try {
  validateMongoSalaryInput({ amount: 50000, payPeriodYear: 2026, payPeriodMonth: 6, paymentDate: 'not-a-valid-date' });
} catch (e) {
  if (e instanceof ValidationError) threwBadPaymentDate = true;
}
assert(threwBadPaymentDate, 'Test 18ab: validateSalaryInput rejects unparseable paymentDate string');

// 18ac: ObjectId Validation
assert(isValidObjectId('507f1f77bcf86cd799439011') === true, 'Test 18ac: isValidObjectId returns true for 24-char hex string');
assert(isValidObjectId('sal_12345') === false, 'Test 18ad: isValidObjectId returns false for legacy string ID');
assert(isValidObjectId('507f1f77bcf86cd79943901') === false, 'Test 18ae: isValidObjectId returns false for 23-char string');
assert(isValidObjectId(null) === false, 'Test 18af: isValidObjectId returns false for null');

const sampleObjectId = new Types.ObjectId().toString();
assert(validateSalaryRecordId(sampleObjectId, 'SalaryRecord') === sampleObjectId, 'Test 18ag: validateRecordId accepts valid 24-char hex ObjectId for SalaryRecord');
assert(validateSalaryObjectId(sampleObjectId, 'SalaryRecord') === sampleObjectId, 'Test 18ah: validateObjectId accepts valid 24-char hex ObjectId');

let threwInvalidObjectId = false;
try {
  validateSalaryRecordId('invalid_salary_id_xyz', 'SalaryRecord');
} catch (e) {
  if (e instanceof ValidationError) threwInvalidObjectId = true;
}
assert(threwInvalidObjectId, 'Test 18ai: validateRecordId rejects non-hex ObjectId for SalaryRecord');

// 18aj: Domain mapping of full salary document with Decimal128
const mockSalaryObjectId = new Types.ObjectId();
const salaryDocToMap = {
  _id: mockSalaryObjectId,
  userId: 'usr_tenant_1',
  amount: Types.Decimal128.fromString('550000.00'),
  currency: 'PKR',
  salaryType: 'OVERTIME' as const,
  payPeriodYear: 2026,
  payPeriodMonth: 10,
  paymentDate: new Date('2026-10-31T00:00:00.000Z'),
  employerOrSource: 'Contoso Software',
  notes: 'Q3 overtime reimbursement',
  createdAt: now,
  updatedAt: now,
};
const domainSalaryResult = mapMongoSalaryRecordToDomain(salaryDocToMap);
assert(domainSalaryResult.id === mockSalaryObjectId.toString(), 'Test 18aj: mapMongoSalaryRecordToDomain extracts clean string id from _id');
assert(domainSalaryResult.amount === 550000, 'Test 18ak: mapMongoSalaryRecordToDomain converts Decimal128 to exact number');
assert(domainSalaryResult.salaryType === 'overtime', 'Test 18al: mapMongoSalaryRecordToDomain maps OVERTIME -> overtime');
assert(domainSalaryResult.employerOrSource === 'Contoso Software', 'Test 18am: Preserves employerOrSource');
assert(domainSalaryResult.notes === 'Q3 overtime reimbursement', 'Test 18an: Preserves notes');

// 18ao: Null optional fields map to undefined in domain
const salaryWithNulls = {
  _id: mockSalaryObjectId,
  userId: 'usr_tenant_1',
  amount: Types.Decimal128.fromString('100000.00'),
  currency: 'PKR',
  salaryType: 'PRIMARY' as const,
  payPeriodYear: 2026,
  payPeriodMonth: 10,
  paymentDate: now,
  employerOrSource: null,
  notes: null,
  createdAt: now,
  updatedAt: now,
};
const domainNullResult = mapMongoSalaryRecordToDomain(salaryWithNulls);
assert(domainNullResult.employerOrSource === undefined, 'Test 18ao: Null employerOrSource maps to undefined');
assert(domainNullResult.notes === undefined, 'Test 18ap: Null notes maps to undefined');

// 18aq-18ar: Tenant isolation simulation (scoped queries & no existence oracle)
function simulateVerifySalaryTenantAccess(
  record: { _id: Types.ObjectId; userId: string; amount: Types.Decimal128 } | null,
  requestedId: string,
  callerUserId: string
) {
  const safeId = validateSalaryRecordId(requestedId, 'SalaryRecord');
  const safeCallerId = validateUserId(callerUserId);
  if (!record || record._id.toString() !== safeId || record.userId !== safeCallerId) {
    throw new RecordNotFoundError('SalaryRecord', safeId);
  }
  return { id: record._id.toString(), userId: record.userId };
}

const aliceSalaryId = new Types.ObjectId();
const aliceSalaryRecord = {
  _id: aliceSalaryId,
  userId: 'usr_alice',
  amount: Types.Decimal128.fromString('200000.00'),
};

const aliceAccess = simulateVerifySalaryTenantAccess(aliceSalaryRecord, aliceSalaryId.toString(), 'usr_alice');
assert(aliceAccess.id === aliceSalaryId.toString(), 'Test 18aq: Authorized tenant Alice accesses own salary record');

let threwCrossTenantSalaryAccess = false;
let crossTenantErrorMessage = '';
try {
  simulateVerifySalaryTenantAccess(aliceSalaryRecord, aliceSalaryId.toString(), 'usr_bob');
} catch (e) {
  if (e instanceof RecordNotFoundError) {
    threwCrossTenantSalaryAccess = true;
    crossTenantErrorMessage = e.message;
  }
}
assert(threwCrossTenantSalaryAccess, 'Test 18ar: Cross-tenant access to Alice record by Bob throws RecordNotFoundError');

let threwNonExistentSalaryAccess = false;
const nonExistentSalaryId = new Types.ObjectId().toString();
try {
  simulateVerifySalaryTenantAccess(null, nonExistentSalaryId, 'usr_bob');
} catch (e) {
  if (e instanceof RecordNotFoundError) {
    threwNonExistentSalaryAccess = true;
  }
}
assert(threwNonExistentSalaryAccess, 'Test 18as: Non-existent salary access throws RecordNotFoundError');
assert(
  crossTenantErrorMessage === `SalaryRecord with ID '${aliceSalaryId.toString()}' was not found.`,
  'Test 18at: Cross-tenant error matches non-existent shape (no existence oracle)'
);

// 18au: Tenant-scoped deletion count verification
let threwFailedDelete = false;
try {
  verifyDeletionResult(0, 'SalaryRecord', aliceSalaryId.toString());
} catch (e) {
  if (e instanceof RecordNotFoundError) threwFailedDelete = true;
}
assert(threwFailedDelete, 'Test 18au: verifyDeletionResult throws RecordNotFoundError when deletedCount is 0 (unmatched tenant)');

console.log('\n--- Verification Summary ---');
if (failures === 0) {
  console.log('ALL TESTS PASSED SUCCESSFULLY! (0 failures)\n');
} else {
  console.error(`TESTS FAILED: ${failures} failure(s) detected.\n`);
  process.exit(1);
}

