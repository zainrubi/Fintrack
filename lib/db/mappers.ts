import {
  Prisma,
  SalaryType as DbSalaryType,
  ExpenseType as DbExpenseType,
  PaymentFrequency as DbPaymentFrequency,
  SavingsCategory as DbSavingsCategory,
  InvestmentType as DbInvestmentType,
  InsuranceCategory as DbInsuranceCategory,
  InsuranceFrequency as DbInsuranceFrequency,
  type SalaryRecord as DbSalaryRecord,
  type Expense as DbExpense,
  type FinancialProfile as DbFinancialProfile,
  type SavingsGoal as DbSavingsGoal,
  type SavingsRecord as DbSavingsRecord,
  type InvestmentAsset as DbInvestmentAsset,
  type InvestmentRecord as DbInvestmentRecord,
  type InsurancePolicy as DbInsurancePolicy,
  type InsurancePayment as DbInsurancePayment,
} from '@prisma/client';
import type {
  SalaryRecord as DomainSalaryRecord,
  ExpenseRecord as DomainExpenseRecord,
  UserFinancialProfile as DomainUserFinancialProfile,
  SavingsGoal as DomainSavingsGoal,
  SavingsRecord as DomainSavingsRecord,
  InvestmentAsset as DomainInvestmentAsset,
  InvestmentRecord as DomainInvestmentRecord,
  InsurancePolicy as DomainInsurancePolicy,
  InsurancePayment as DomainInsurancePayment,
  SalaryType as DomainSalaryType,
  ExpenseType as DomainExpenseType,
  PaymentFrequency as DomainPaymentFrequency,
  SavingsCategory as DomainSavingsCategory,
  InvestmentType as DomainInvestmentType,
  InsuranceCategory as DomainInsuranceCategory,
  InsuranceFrequency as DomainInsuranceFrequency,
  CurrencyCode,
} from '@/types/financial';

/**
 * Maximum monetary amount representable as an integer in minor units (cents/paisa)
 * without exceeding JavaScript IEEE 754 Number.MAX_SAFE_INTEGER (9,007,199,254,740,991).
 * 90 trillion currency units (90,000,000,000,000.00) * 100 = 9,000,000,000,000,000 <= MAX_SAFE_INTEGER.
 */
export const MAX_SAFE_CURRENCY_AMOUNT = new Prisma.Decimal('90000000000000');

/**
 * Custom error thrown when a database Decimal cannot be safely converted to a
 * JavaScript number without loss of precision or magnitude overflow.
 */
export class UnsafeDecimalConversionError extends Error {
  constructor(
    message: string,
    public readonly value: unknown,
    public readonly fieldName?: string
  ) {
    super(fieldName ? `[Field: ${fieldName}] ${message}` : message);
    this.name = 'UnsafeDecimalConversionError';
  }
}

// ==============================================================================
// 1. Core Decimal Conversion Utilities
// ==============================================================================

/**
 * Converts a Prisma Decimal into a safe JavaScript number representing a currency amount.
 *
 * Safety Invariants:
 * 1. Decimal must be finite (not NaN, not Infinity).
 * 2. Absolute magnitude must be within MAX_SAFE_CURRENCY_AMOUNT (<= 90 trillion).
 * 3. Amount must not have non-zero sub-cent fractions (>2 decimal places).
 *    Sub-cent values are explicitly rejected rather than silently rounded.
 *
 * @param decimal The Prisma.Decimal instance to convert.
 * @param fieldName Optional identifier for error reporting.
 * @returns An exact JavaScript number representing the monetary value.
 * @throws {UnsafeDecimalConversionError} If any safety invariant is violated.
 */
export function decimalToSafeNumber(
  decimal: Prisma.Decimal | null | undefined,
  fieldName?: string
): number {
  if (decimal === null || decimal === undefined) {
    throw new UnsafeDecimalConversionError(
      'Encountered null or undefined Decimal where a required monetary value was expected',
      decimal,
      fieldName
    );
  }

  // 1. Guard against non-finite representations
  if (!decimal.isFinite() || decimal.isNaN()) {
    throw new UnsafeDecimalConversionError(
      'Decimal is non-finite or NaN',
      decimal.toString(),
      fieldName
    );
  }

  // 2. Guard against magnitude exceeding IEEE 754 integer safety in minor units
  if (decimal.abs().greaterThan(MAX_SAFE_CURRENCY_AMOUNT)) {
    throw new UnsafeDecimalConversionError(
      `Decimal magnitude '${decimal.toString()}' exceeds the maximum safe representation limit (90 trillion)`,
      decimal.toString(),
      fieldName
    );
  }

  // 3. Guard against sub-cent precision loss: (decimal * 100) must be an exact integer
  const isCentExact = decimal.mul(100).modulo(1).isZero();
  if (!isCentExact) {
    throw new UnsafeDecimalConversionError(
      `Decimal '${decimal.toString()}' has fractional sub-cent precision (>2 decimal places) that would be silently truncated`,
      decimal.toString(),
      fieldName
    );
  }

  const num = decimal.toNumber();

  if (!Number.isFinite(num)) {
    throw new UnsafeDecimalConversionError(
      'Converted number is not finite',
      decimal.toString(),
      fieldName
    );
  }

  return num;
}

/**
 * Converts an optional/nullable Prisma Decimal into a JavaScript number or undefined.
 * Rejects unsafe non-null values with the same guarantees as `decimalToSafeNumber`.
 */
export function decimalToOptionalSafeNumber(
  decimal: Prisma.Decimal | null | undefined,
  fieldName?: string
): number | undefined {
  if (decimal === null || decimal === undefined) {
    return undefined;
  }
  return decimalToSafeNumber(decimal, fieldName);
}

/**
 * Preserves the exact database Decimal value as a formatted 2-decimal string.
 * Completely avoids floating-point conversion. Ideal for audit logging or display.
 */
export function decimalToString(
  decimal: Prisma.Decimal | null | undefined
): string | null {
  if (decimal === null || decimal === undefined) {
    return null;
  }
  return decimal.toFixed(2);
}

/**
 * Converts a validated JavaScript number into a Prisma Decimal with 2 decimal places.
 * Throws if the number is non-finite or outside safe bounds.
 */
export function safeNumberToDecimal(
  amount: number,
  fieldName?: string
): Prisma.Decimal {
  if (!Number.isFinite(amount)) {
    throw new UnsafeDecimalConversionError(
      'Cannot convert non-finite number to Prisma.Decimal',
      amount,
      fieldName
    );
  }

  if (Math.abs(amount) > 90_000_000_000_000) {
    throw new UnsafeDecimalConversionError(
      'Amount exceeds safe currency bounds',
      amount,
      fieldName
    );
  }

  return new Prisma.Decimal(amount.toFixed(2));
}

// ==============================================================================
// 2. Enum & Date Mappers
// ==============================================================================

export function dbSalaryTypeToDomain(dbType: DbSalaryType): DomainSalaryType {
  switch (dbType) {
    case DbSalaryType.PRIMARY:
      return 'primary';
    case DbSalaryType.SECONDARY:
      return 'secondary';
    case DbSalaryType.BONUS:
      return 'bonus';
    case DbSalaryType.ALLOWANCE:
      return 'allowance';
    case DbSalaryType.FREELANCE:
      return 'freelance';
    case DbSalaryType.OVERTIME:
      return 'overtime';
    case DbSalaryType.OTHER:
    default:
      return 'other';
  }
}

export function domainSalaryTypeToDb(domainType: DomainSalaryType): DbSalaryType {
  switch (domainType) {
    case 'primary':
      return DbSalaryType.PRIMARY;
    case 'secondary':
      return DbSalaryType.SECONDARY;
    case 'bonus':
      return DbSalaryType.BONUS;
    case 'allowance':
      return DbSalaryType.ALLOWANCE;
    case 'freelance':
      return DbSalaryType.FREELANCE;
    case 'overtime':
      return DbSalaryType.OVERTIME;
    case 'other':
    default:
      return DbSalaryType.OTHER;
  }
}

export function dbExpenseTypeToDomain(dbType: DbExpenseType): DomainExpenseType {
  return dbType === DbExpenseType.FIXED ? 'fixed' : 'variable';
}

export function domainExpenseTypeToDb(domainType: DomainExpenseType): DbExpenseType {
  return domainType === 'fixed' ? DbExpenseType.FIXED : DbExpenseType.VARIABLE;
}

export function dbPaymentFrequencyToDomain(
  dbFreq: DbPaymentFrequency | null | undefined
): DomainPaymentFrequency | undefined {
  if (!dbFreq) return undefined;
  switch (dbFreq) {
    case DbPaymentFrequency.DAILY:
      return 'daily';
    case DbPaymentFrequency.WEEKLY:
      return 'weekly';
    case DbPaymentFrequency.BIWEEKLY:
      return 'biweekly';
    case DbPaymentFrequency.MONTHLY:
      return 'monthly';
    case DbPaymentFrequency.QUARTERLY:
      return 'quarterly';
    case DbPaymentFrequency.SEMI_ANNUALLY:
      return 'semi-annually';
    case DbPaymentFrequency.ANNUALLY:
      return 'annually';
    case DbPaymentFrequency.ONE_TIME:
    default:
      return 'one-time';
  }
}

export function domainPaymentFrequencyToDb(
  domainFreq: DomainPaymentFrequency | null | undefined
): DbPaymentFrequency | undefined {
  if (!domainFreq) return undefined;
  switch (domainFreq) {
    case 'daily':
      return DbPaymentFrequency.DAILY;
    case 'weekly':
      return DbPaymentFrequency.WEEKLY;
    case 'biweekly':
      return DbPaymentFrequency.BIWEEKLY;
    case 'monthly':
      return DbPaymentFrequency.MONTHLY;
    case 'quarterly':
      return DbPaymentFrequency.QUARTERLY;
    case 'semi-annually':
      return DbPaymentFrequency.SEMI_ANNUALLY;
    case 'annually':
      return DbPaymentFrequency.ANNUALLY;
    case 'one-time':
    default:
      return DbPaymentFrequency.ONE_TIME;
  }
}

export function dbSavingsCategoryToDomain(
  dbCat: DbSavingsCategory
): DomainSavingsCategory {
  switch (dbCat) {
    case DbSavingsCategory.EMERGENCY_FUND:
      return 'emergency_fund';
    case DbSavingsCategory.RETIREMENT:
      return 'retirement';
    case DbSavingsCategory.HOUSE_DOWNPAYMENT:
      return 'house_downpayment';
    case DbSavingsCategory.EDUCATION:
      return 'education';
    case DbSavingsCategory.WEDDING:
      return 'wedding';
    case DbSavingsCategory.TRAVEL_VACATION:
      return 'travel_vacation';
    case DbSavingsCategory.HAJJ_UMRAH:
      return 'hajj_umrah';
    case DbSavingsCategory.OTHER:
      return 'other';
    case DbSavingsCategory.GENERAL_SAVINGS:
    default:
      return 'general_savings';
  }
}

export function domainSavingsCategoryToDb(
  domainCat?: DomainSavingsCategory | string | null
): DbSavingsCategory {
  if (!domainCat) return DbSavingsCategory.GENERAL_SAVINGS;
  switch (domainCat.toLowerCase().trim()) {
    case 'emergency_fund':
      return DbSavingsCategory.EMERGENCY_FUND;
    case 'retirement':
      return DbSavingsCategory.RETIREMENT;
    case 'house_downpayment':
      return DbSavingsCategory.HOUSE_DOWNPAYMENT;
    case 'education':
      return DbSavingsCategory.EDUCATION;
    case 'wedding':
      return DbSavingsCategory.WEDDING;
    case 'travel_vacation':
      return DbSavingsCategory.TRAVEL_VACATION;
    case 'hajj_umrah':
      return DbSavingsCategory.HAJJ_UMRAH;
    case 'other':
      return DbSavingsCategory.OTHER;
    case 'general_savings':
    default:
      return DbSavingsCategory.GENERAL_SAVINGS;
  }
}

export function dbInvestmentTypeToDomain(
  dbType: DbInvestmentType
): DomainInvestmentType {
  switch (dbType) {
    case DbInvestmentType.MUTUAL_FUND:
      return 'mutual_fund';
    case DbInvestmentType.STOCKS:
      return 'stocks';
    case DbInvestmentType.REAL_ESTATE:
      return 'real_estate';
    case DbInvestmentType.GOLD_PRECIOUS_METALS:
      return 'gold_precious_metals';
    case DbInvestmentType.GOVERNMENT_BONDS:
      return 'government_bonds';
    case DbInvestmentType.PROVIDENT_FUND:
      return 'provident_fund';
    case DbInvestmentType.CRYPTO:
      return 'crypto';
    case DbInvestmentType.BUSINESS_VENTURE:
      return 'business_venture';
    case DbInvestmentType.OTHER:
    default:
      return 'other';
  }
}

export function domainInvestmentTypeToDb(
  domainType?: DomainInvestmentType | string | null
): DbInvestmentType {
  if (!domainType) return DbInvestmentType.OTHER;
  switch (domainType.toLowerCase().trim()) {
    case 'mutual_fund':
      return DbInvestmentType.MUTUAL_FUND;
    case 'stocks':
      return DbInvestmentType.STOCKS;
    case 'real_estate':
      return DbInvestmentType.REAL_ESTATE;
    case 'gold_precious_metals':
      return DbInvestmentType.GOLD_PRECIOUS_METALS;
    case 'government_bonds':
      return DbInvestmentType.GOVERNMENT_BONDS;
    case 'provident_fund':
      return DbInvestmentType.PROVIDENT_FUND;
    case 'crypto':
      return DbInvestmentType.CRYPTO;
    case 'business_venture':
      return DbInvestmentType.BUSINESS_VENTURE;
    case 'other':
    default:
      return DbInvestmentType.OTHER;
  }
}

export function dbInsuranceCategoryToDomain(
  dbCat: DbInsuranceCategory
): DomainInsuranceCategory {
  switch (dbCat) {
    case DbInsuranceCategory.HEALTH:
      return 'health';
    case DbInsuranceCategory.LIFE:
      return 'life';
    case DbInsuranceCategory.VEHICLE:
      return 'vehicle';
    case DbInsuranceCategory.HOME:
      return 'home';
    case DbInsuranceCategory.DISABILITY:
      return 'disability';
    case DbInsuranceCategory.OTHER:
    default:
      return 'other';
  }
}

export function domainInsuranceCategoryToDb(
  domainCat?: DomainInsuranceCategory | string | null
): DbInsuranceCategory {
  if (!domainCat) return DbInsuranceCategory.OTHER;
  switch (domainCat.toLowerCase().trim()) {
    case 'health':
      return DbInsuranceCategory.HEALTH;
    case 'life':
      return DbInsuranceCategory.LIFE;
    case 'vehicle':
      return DbInsuranceCategory.VEHICLE;
    case 'home':
      return DbInsuranceCategory.HOME;
    case 'disability':
      return DbInsuranceCategory.DISABILITY;
    case 'other':
    default:
      return DbInsuranceCategory.OTHER;
  }
}

export function dbInsuranceFrequencyToDomain(
  dbFreq: DbInsuranceFrequency
): DomainInsuranceFrequency {
  switch (dbFreq) {
    case DbInsuranceFrequency.MONTHLY:
      return 'monthly';
    case DbInsuranceFrequency.QUARTERLY:
      return 'quarterly';
    case DbInsuranceFrequency.SEMI_ANNUALLY:
      return 'semi-annually';
    case DbInsuranceFrequency.ANNUALLY:
    default:
      return 'annually';
  }
}

export function domainInsuranceFrequencyToDb(
  domainFreq?: DomainInsuranceFrequency | string | null
): DbInsuranceFrequency {
  if (!domainFreq) return DbInsuranceFrequency.ANNUALLY;
  const normalized = domainFreq.toLowerCase().trim().replace(/_/g, '-');
  switch (normalized) {
    case 'monthly':
      return DbInsuranceFrequency.MONTHLY;
    case 'quarterly':
      return DbInsuranceFrequency.QUARTERLY;
    case 'semi-annually':
    case 'bi-annually':
      return DbInsuranceFrequency.SEMI_ANNUALLY;
    case 'annually':
    default:
      return DbInsuranceFrequency.ANNUALLY;
  }
}

// ==============================================================================
// 3. Model Mappers (Database Row -> Domain Type)
// ==============================================================================

/**
 * Maps a Prisma SalaryRecord database row to the Fintrack domain SalaryRecord.
 */
export function mapSalaryRecordToDomain(dbRecord: DbSalaryRecord): DomainSalaryRecord {
  return {
    id: dbRecord.id,
    userId: dbRecord.userId,
    amount: decimalToSafeNumber(dbRecord.amount, 'SalaryRecord.amount'),
    currency: dbRecord.currency as CurrencyCode,
    salaryType: dbSalaryTypeToDomain(dbRecord.salaryType),
    payPeriodMonth: dbRecord.payPeriodMonth,
    payPeriodYear: dbRecord.payPeriodYear,
    paymentDate: dbRecord.paymentDate,
    employerOrSource: dbRecord.employerOrSource ?? undefined,
    notes: dbRecord.notes ?? undefined,
    createdAt: dbRecord.createdAt,
    updatedAt: dbRecord.updatedAt,
  };
}

/**
 * Maps a Prisma Expense database row to the Fintrack domain ExpenseRecord.
 *
 * @param dbRecord Database Expense record.
 * @param categorySlug Category slug resolved from relationship or fallback.
 */
export function mapExpenseRecordToDomain(
  dbRecord: DbExpense,
  categorySlug?: string
): DomainExpenseRecord {
  return {
    id: dbRecord.id,
    userId: dbRecord.userId,
    amount: decimalToSafeNumber(dbRecord.amount, 'Expense.amount'),
    currency: dbRecord.currency as CurrencyCode,
    category: (categorySlug ?? dbRecord.categoryId) as DomainExpenseRecord['category'],
    expenseType: dbExpenseTypeToDomain(dbRecord.expenseType),
    date: dbRecord.date,
    description: dbRecord.description,
    isRecurring: dbRecord.isRecurring,
    recurringFrequency: dbPaymentFrequencyToDomain(dbRecord.recurringFrequency),
    notes: dbRecord.notes ?? undefined,
    createdAt: dbRecord.createdAt,
    updatedAt: dbRecord.updatedAt,
  };
}

/**
 * Maps a Prisma FinancialProfile database row to the domain UserFinancialProfile.
 */
export function mapFinancialProfileToDomain(
  dbProfile: DbFinancialProfile
): DomainUserFinancialProfile {
  return {
    id: dbProfile.id,
    userId: dbProfile.userId,
    defaultCurrency: dbProfile.defaultCurrency as CurrencyCode,
    monthlyIncomeTarget: decimalToOptionalSafeNumber(
      dbProfile.monthlyIncomeTarget,
      'FinancialProfile.monthlyIncomeTarget'
    ),
    monthlySavingsTarget: decimalToOptionalSafeNumber(
      dbProfile.monthlySavingsTarget,
      'FinancialProfile.monthlySavingsTarget'
    ),
    emergencyFundTargetMonths: dbProfile.emergencyFundTargetMonths,
    fiscalYearStartMonth: dbProfile.fiscalYearStartMonth,
    createdAt: dbProfile.createdAt,
    updatedAt: dbProfile.updatedAt,
  };
}

/**
 * Maps a Prisma SavingsGoal database row to the domain SavingsGoal.
 */
export function mapSavingsGoalToDomain(dbGoal: DbSavingsGoal): DomainSavingsGoal {
  return {
    id: dbGoal.id,
    userId: dbGoal.userId,
    name: dbGoal.name,
    category: dbSavingsCategoryToDomain(dbGoal.category),
    targetAmount: decimalToOptionalSafeNumber(dbGoal.targetAmount, 'SavingsGoal.targetAmount'),
    targetDate: dbGoal.targetDate ?? undefined,
    isEmergencyFund: dbGoal.isEmergencyFund,
    notes: dbGoal.notes ?? undefined,
    createdAt: dbGoal.createdAt,
    updatedAt: dbGoal.updatedAt,
  };
}

/**
 * Maps a Prisma SavingsRecord database row to the domain SavingsRecord.
 */
export function mapSavingsRecordToDomain(
  dbRecord: DbSavingsRecord,
  goalName?: string | null
): DomainSavingsRecord {
  return {
    id: dbRecord.id,
    userId: dbRecord.userId,
    goalId: dbRecord.goalId ?? undefined,
    amount: decimalToSafeNumber(dbRecord.amount, 'SavingsRecord.amount'),
    currency: dbRecord.currency as CurrencyCode,
    category: dbSavingsCategoryToDomain(dbRecord.category),
    date: dbRecord.date,
    periodYear: dbRecord.periodYear,
    periodMonth: dbRecord.periodMonth,
    targetGoalName: goalName ?? undefined,
    notes: dbRecord.notes ?? undefined,
    createdAt: dbRecord.createdAt,
    updatedAt: dbRecord.updatedAt,
  };
}

/**
 * Maps a Prisma InvestmentAsset database row to the domain InvestmentAsset.
 */
export function mapInvestmentAssetToDomain(
  dbAsset: DbInvestmentAsset
): DomainInvestmentAsset {
  return {
    id: dbAsset.id,
    userId: dbAsset.userId,
    assetName: dbAsset.assetName,
    investmentType: dbInvestmentTypeToDomain(dbAsset.investmentType),
    institutionOrPlatform: dbAsset.institutionOrPlatform ?? undefined,
    notes: dbAsset.notes ?? undefined,
    createdAt: dbAsset.createdAt,
    updatedAt: dbAsset.updatedAt,
  };
}

/**
 * Maps a Prisma InvestmentRecord database row to the domain InvestmentRecord.
 */
export function mapInvestmentRecordToDomain(
  dbRecord: DbInvestmentRecord,
  asset?: { assetName: string; institutionOrPlatform?: string | null } | null
): DomainInvestmentRecord {
  return {
    id: dbRecord.id,
    userId: dbRecord.userId,
    assetId: dbRecord.assetId ?? undefined,
    amount: decimalToSafeNumber(dbRecord.amount, 'InvestmentRecord.amount'),
    currency: dbRecord.currency as CurrencyCode,
    investmentType: dbInvestmentTypeToDomain(dbRecord.investmentType),
    assetName: asset?.assetName ?? undefined,
    institutionOrPlatform: asset?.institutionOrPlatform ?? undefined,
    date: dbRecord.date,
    periodYear: dbRecord.periodYear,
    periodMonth: dbRecord.periodMonth,
    notes: dbRecord.notes ?? undefined,
    createdAt: dbRecord.createdAt,
    updatedAt: dbRecord.updatedAt,
  };
}

/**
 * Maps a Prisma InsurancePolicy database row to the domain InsurancePolicy.
 */
export function mapInsurancePolicyToDomain(
  dbPolicy: DbInsurancePolicy
): DomainInsurancePolicy {
  return {
    id: dbPolicy.id,
    userId: dbPolicy.userId,
    policyName: dbPolicy.policyName,
    policyNumber: dbPolicy.policyNumber ?? undefined,
    provider: dbPolicy.provider ?? undefined,
    category: dbInsuranceCategoryToDomain(dbPolicy.category),
    premiumAmount: decimalToSafeNumber(dbPolicy.premiumAmount, 'InsurancePolicy.premiumAmount'),
    currency: dbPolicy.currency as CurrencyCode,
    frequency: dbInsuranceFrequencyToDomain(dbPolicy.frequency),
    startDate: dbPolicy.startDate,
    renewalDate: dbPolicy.renewalDate ?? undefined,
    isActive: dbPolicy.isActive,
    notes: dbPolicy.notes ?? undefined,
    createdAt: dbPolicy.createdAt,
    updatedAt: dbPolicy.updatedAt,
  };
}

/**
 * Maps a Prisma InsurancePayment database row to the domain InsurancePayment.
 */
export function mapInsurancePaymentToDomain(
  dbPayment: DbInsurancePayment,
  policy?: { policyName: string; category?: DbInsuranceCategory } | null
): DomainInsurancePayment {
  return {
    id: dbPayment.id,
    userId: dbPayment.userId,
    policyId: dbPayment.policyId,
    amount: decimalToSafeNumber(dbPayment.amount, 'InsurancePayment.amount'),
    currency: dbPayment.currency as CurrencyCode,
    paymentDate: dbPayment.paymentDate,
    periodYear: dbPayment.periodYear,
    periodMonth: dbPayment.periodMonth,
    policyName: policy?.policyName ?? undefined,
    category: policy?.category ? dbInsuranceCategoryToDomain(policy.category) : undefined,
    notes: dbPayment.notes ?? undefined,
    createdAt: dbPayment.createdAt,
    updatedAt: dbPayment.updatedAt,
  };
}
