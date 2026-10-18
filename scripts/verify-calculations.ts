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

console.log('\n--- Verification Summary ---');
if (failures === 0) {
  console.log('ALL TESTS PASSED SUCCESSFULLY! (0 failures)\n');
} else {
  console.error(`TESTS FAILED: ${failures} failure(s) detected.\n`);
  process.exit(1);
}
