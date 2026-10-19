import type {
  IUser,
  IFinancialProfile,
  ICategory,
  ISalaryRecord,
  IExpense,
  ISavingsGoal,
  ISavingsRecord,
  IInvestmentAsset,
  IInvestmentRecord,
  IInsurancePolicy,
  IInsurancePayment,
  ILoan,
  ILoanRepayment,
  SalaryType as MongoSalaryType,
  ExpenseType as MongoExpenseType,
  PaymentFrequency as MongoPaymentFrequency,
  SavingsCategory as MongoSavingsCategory,
  InvestmentType as MongoInvestmentType,
  InsuranceCategory as MongoInsuranceCategory,
  InsuranceFrequency as MongoInsuranceFrequency,
  LoanFrequency as MongoLoanFrequency,
} from './models';
import {
  decimal128ToSafeNumber,
  optionalDecimal128ToSafeNumber,
} from './decimal';
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
  LoanRecord as DomainLoanRecord,
  SalaryType as DomainSalaryType,
  ExpenseType as DomainExpenseType,
  PaymentFrequency as DomainPaymentFrequency,
  SavingsCategory as DomainSavingsCategory,
  InvestmentType as DomainInvestmentType,
  InsuranceCategory as DomainInsuranceCategory,
  InsuranceFrequency as DomainInsuranceFrequency,
  LoanFrequency as DomainLoanFrequency,
  CurrencyCode,
} from '@/types/financial';

/**
 * Domain representation of a Loan Repayment transaction.
 */
export interface DomainLoanRepayment {
  id: string;
  userId: string;
  loanId: string;
  amount: number;
  principalComponent?: number;
  interestComponent?: number;
  paymentDate: Date | string;
  periodYear: number;
  periodMonth: number;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Domain representation of a financial Category.
 */
export interface DomainCategory {
  id: string;
  userId?: string | null;
  name: string;
  slug: string;
  type: 'expense' | 'savings' | 'investment' | 'insurance';
  defaultExpenseType?: 'fixed' | 'variable' | null;
  icon?: string | null;
  color?: string | null;
  isSystem: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Domain representation of a User.
 */
export interface DomainUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ==============================================================================
// 1. Enum Mappers (MongoDB Schema Enums <-> Fintrack Domain Types)
// ==============================================================================

export function mongoSalaryTypeToDomain(mongoType: MongoSalaryType): DomainSalaryType {
  switch (mongoType) {
    case 'PRIMARY':
      return 'primary';
    case 'SECONDARY':
      return 'secondary';
    case 'BONUS':
      return 'bonus';
    case 'ALLOWANCE':
      return 'allowance';
    case 'FREELANCE':
      return 'freelance';
    case 'OVERTIME':
      return 'overtime';
    case 'OTHER':
    default:
      return 'other';
  }
}

export function domainSalaryTypeToMongo(domainType: DomainSalaryType): MongoSalaryType {
  switch (domainType) {
    case 'primary':
      return 'PRIMARY';
    case 'secondary':
      return 'SECONDARY';
    case 'bonus':
      return 'BONUS';
    case 'allowance':
      return 'ALLOWANCE';
    case 'freelance':
      return 'FREELANCE';
    case 'overtime':
      return 'OVERTIME';
    case 'other':
    default:
      return 'OTHER';
  }
}

export function mongoExpenseTypeToDomain(mongoType: MongoExpenseType): DomainExpenseType {
  return mongoType === 'FIXED' ? 'fixed' : 'variable';
}

export function domainExpenseTypeToMongo(domainType: DomainExpenseType): MongoExpenseType {
  return domainType === 'fixed' ? 'FIXED' : 'VARIABLE';
}

export function mongoPaymentFrequencyToDomain(
  mongoFreq: MongoPaymentFrequency | null | undefined
): DomainPaymentFrequency | undefined {
  if (!mongoFreq) return undefined;
  switch (mongoFreq) {
    case 'DAILY':
      return 'daily';
    case 'WEEKLY':
      return 'weekly';
    case 'BIWEEKLY':
      return 'biweekly';
    case 'MONTHLY':
      return 'monthly';
    case 'QUARTERLY':
      return 'quarterly';
    case 'SEMI_ANNUALLY':
      return 'semi-annually';
    case 'ANNUALLY':
      return 'annually';
    case 'ONE_TIME':
    default:
      return 'one-time';
  }
}

export function domainPaymentFrequencyToMongo(
  domainFreq: DomainPaymentFrequency | null | undefined
): MongoPaymentFrequency | undefined {
  if (!domainFreq) return undefined;
  switch (domainFreq) {
    case 'daily':
      return 'DAILY';
    case 'weekly':
      return 'WEEKLY';
    case 'biweekly':
      return 'BIWEEKLY';
    case 'monthly':
      return 'MONTHLY';
    case 'quarterly':
      return 'QUARTERLY';
    case 'semi-annually':
      return 'SEMI_ANNUALLY';
    case 'annually':
      return 'ANNUALLY';
    case 'one-time':
    default:
      return 'ONE_TIME';
  }
}

export function mongoSavingsCategoryToDomain(
  mongoCat: MongoSavingsCategory
): DomainSavingsCategory {
  switch (mongoCat) {
    case 'EMERGENCY_FUND':
      return 'emergency_fund';
    case 'RETIREMENT':
      return 'retirement';
    case 'HOUSE_DOWNPAYMENT':
      return 'house_downpayment';
    case 'EDUCATION':
      return 'education';
    case 'WEDDING':
      return 'wedding';
    case 'TRAVEL_VACATION':
      return 'travel_vacation';
    case 'HAJJ_UMRAH':
      return 'hajj_umrah';
    case 'OTHER':
      return 'other';
    case 'GENERAL_SAVINGS':
    default:
      return 'general_savings';
  }
}

export function domainSavingsCategoryToMongo(
  domainCat?: DomainSavingsCategory | string | null
): MongoSavingsCategory {
  if (!domainCat) return 'GENERAL_SAVINGS';
  switch (domainCat.toLowerCase().trim()) {
    case 'emergency_fund':
      return 'EMERGENCY_FUND';
    case 'retirement':
      return 'RETIREMENT';
    case 'house_downpayment':
      return 'HOUSE_DOWNPAYMENT';
    case 'education':
      return 'EDUCATION';
    case 'wedding':
      return 'WEDDING';
    case 'travel_vacation':
      return 'TRAVEL_VACATION';
    case 'hajj_umrah':
      return 'HAJJ_UMRAH';
    case 'other':
      return 'OTHER';
    case 'general_savings':
    default:
      return 'GENERAL_SAVINGS';
  }
}

export function mongoInvestmentTypeToDomain(
  mongoType: MongoInvestmentType
): DomainInvestmentType {
  switch (mongoType) {
    case 'MUTUAL_FUND':
      return 'mutual_fund';
    case 'STOCKS':
      return 'stocks';
    case 'REAL_ESTATE':
      return 'real_estate';
    case 'GOLD_PRECIOUS_METALS':
      return 'gold_precious_metals';
    case 'GOVERNMENT_BONDS':
      return 'government_bonds';
    case 'PROVIDENT_FUND':
      return 'provident_fund';
    case 'CRYPTO':
      return 'crypto';
    case 'BUSINESS_VENTURE':
      return 'business_venture';
    case 'OTHER':
    default:
      return 'other';
  }
}

export function domainInvestmentTypeToMongo(
  domainType?: DomainInvestmentType | string | null
): MongoInvestmentType {
  if (!domainType) return 'OTHER';
  switch (domainType.toLowerCase().trim()) {
    case 'mutual_fund':
      return 'MUTUAL_FUND';
    case 'stocks':
      return 'STOCKS';
    case 'real_estate':
      return 'REAL_ESTATE';
    case 'gold_precious_metals':
      return 'GOLD_PRECIOUS_METALS';
    case 'government_bonds':
      return 'GOVERNMENT_BONDS';
    case 'provident_fund':
      return 'PROVIDENT_FUND';
    case 'crypto':
      return 'CRYPTO';
    case 'business_venture':
      return 'BUSINESS_VENTURE';
    case 'other':
    default:
      return 'OTHER';
  }
}

export function mongoInsuranceCategoryToDomain(
  mongoCat: MongoInsuranceCategory
): DomainInsuranceCategory {
  switch (mongoCat) {
    case 'HEALTH':
      return 'health';
    case 'LIFE':
      return 'life';
    case 'VEHICLE':
      return 'vehicle';
    case 'HOME':
      return 'home';
    case 'DISABILITY':
      return 'disability';
    case 'OTHER':
    default:
      return 'other';
  }
}

export function domainInsuranceCategoryToMongo(
  domainCat?: DomainInsuranceCategory | string | null
): MongoInsuranceCategory {
  if (!domainCat) return 'OTHER';
  switch (domainCat.toLowerCase().trim()) {
    case 'health':
      return 'HEALTH';
    case 'life':
      return 'LIFE';
    case 'vehicle':
      return 'VEHICLE';
    case 'home':
      return 'HOME';
    case 'disability':
      return 'DISABILITY';
    case 'other':
    default:
      return 'OTHER';
  }
}

export function mongoInsuranceFrequencyToDomain(
  mongoFreq: MongoInsuranceFrequency
): DomainInsuranceFrequency {
  switch (mongoFreq) {
    case 'MONTHLY':
      return 'monthly';
    case 'QUARTERLY':
      return 'quarterly';
    case 'SEMI_ANNUALLY':
      return 'semi-annually';
    case 'ANNUALLY':
    default:
      return 'annually';
  }
}

export function domainInsuranceFrequencyToMongo(
  domainFreq?: DomainInsuranceFrequency | string | null
): MongoInsuranceFrequency {
  if (!domainFreq) return 'ANNUALLY';
  const normalized = domainFreq.toLowerCase().trim().replace(/_/g, '-');
  switch (normalized) {
    case 'monthly':
      return 'MONTHLY';
    case 'quarterly':
      return 'QUARTERLY';
    case 'semi-annually':
    case 'bi-annually':
      return 'SEMI_ANNUALLY';
    case 'annually':
    default:
      return 'ANNUALLY';
  }
}

export function mongoLoanFrequencyToDomain(
  mongoFreq: MongoLoanFrequency
): DomainLoanFrequency {
  switch (mongoFreq) {
    case 'WEEKLY':
      return 'weekly';
    case 'BIWEEKLY':
      return 'biweekly';
    case 'QUARTERLY':
      return 'quarterly';
    case 'MONTHLY':
    default:
      return 'monthly';
  }
}

export function domainLoanFrequencyToMongo(
  domainFreq?: DomainLoanFrequency | string | null
): MongoLoanFrequency {
  if (!domainFreq) return 'MONTHLY';
  switch (domainFreq.toLowerCase().trim()) {
    case 'weekly':
      return 'WEEKLY';
    case 'biweekly':
      return 'BIWEEKLY';
    case 'quarterly':
      return 'QUARTERLY';
    case 'monthly':
    default:
      return 'MONTHLY';
  }
}

// Helper for extracting clean string ID from Mongoose document or POJO
function extractId(doc: { id?: unknown; _id?: unknown }): string {
  if (doc.id !== undefined && doc.id !== null) {
    return String(doc.id);
  }
  if (doc._id !== undefined && doc._id !== null) {
    return String(doc._id);
  }
  return '';
}

// ==============================================================================
// 2. Mongoose Document -> Domain Type Mappers
// ==============================================================================

/**
 * Maps a Mongoose SalaryRecord document to the domain SalaryRecord.
 */
export function mapMongoSalaryRecordToDomain(doc: ISalaryRecord): DomainSalaryRecord {
  return {
    id: extractId(doc),
    userId: doc.userId,
    amount: decimal128ToSafeNumber(doc.amount, 'SalaryRecord.amount'),
    currency: doc.currency as CurrencyCode,
    salaryType: mongoSalaryTypeToDomain(doc.salaryType),
    payPeriodMonth: doc.payPeriodMonth,
    payPeriodYear: doc.payPeriodYear,
    paymentDate: doc.paymentDate,
    employerOrSource: doc.employerOrSource ?? undefined,
    notes: doc.notes ?? undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Maps a Mongoose Expense document to the domain ExpenseRecord.
 */
export function mapMongoExpenseRecordToDomain(
  doc: IExpense,
  categorySlug?: string
): DomainExpenseRecord {
  return {
    id: extractId(doc),
    userId: doc.userId,
    amount: decimal128ToSafeNumber(doc.amount, 'Expense.amount'),
    currency: doc.currency as CurrencyCode,
    category: (categorySlug ?? doc.categoryId) as DomainExpenseRecord['category'],
    expenseType: mongoExpenseTypeToDomain(doc.expenseType),
    date: doc.date,
    description: doc.description,
    isRecurring: doc.isRecurring,
    recurringFrequency: mongoPaymentFrequencyToDomain(doc.recurringFrequency),
    notes: doc.notes ?? undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Maps a Mongoose FinancialProfile document to the domain UserFinancialProfile.
 */
export function mapMongoFinancialProfileToDomain(
  doc: IFinancialProfile
): DomainUserFinancialProfile {
  return {
    id: extractId(doc),
    userId: doc.userId,
    defaultCurrency: doc.defaultCurrency as CurrencyCode,
    monthlyIncomeTarget: optionalDecimal128ToSafeNumber(
      doc.monthlyIncomeTarget,
      'FinancialProfile.monthlyIncomeTarget'
    ),
    monthlySavingsTarget: optionalDecimal128ToSafeNumber(
      doc.monthlySavingsTarget,
      'FinancialProfile.monthlySavingsTarget'
    ),
    emergencyFundTargetMonths: doc.emergencyFundTargetMonths,
    fiscalYearStartMonth: doc.fiscalYearStartMonth,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Maps a Mongoose SavingsGoal document to the domain SavingsGoal.
 */
export function mapMongoSavingsGoalToDomain(doc: ISavingsGoal): DomainSavingsGoal {
  return {
    id: extractId(doc),
    userId: doc.userId,
    name: doc.name,
    category: mongoSavingsCategoryToDomain(doc.category),
    targetAmount: optionalDecimal128ToSafeNumber(doc.targetAmount, 'SavingsGoal.targetAmount'),
    targetDate: doc.targetDate ?? undefined,
    isEmergencyFund: doc.isEmergencyFund,
    notes: doc.notes ?? undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Maps a Mongoose SavingsRecord document to the domain SavingsRecord.
 */
export function mapMongoSavingsRecordToDomain(
  doc: ISavingsRecord,
  goalName?: string | null
): DomainSavingsRecord {
  return {
    id: extractId(doc),
    userId: doc.userId,
    goalId: doc.goalId ?? undefined,
    amount: decimal128ToSafeNumber(doc.amount, 'SavingsRecord.amount'),
    currency: doc.currency as CurrencyCode,
    category: mongoSavingsCategoryToDomain(doc.category),
    date: doc.date,
    periodYear: doc.periodYear,
    periodMonth: doc.periodMonth,
    targetGoalName: goalName ?? undefined,
    notes: doc.notes ?? undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Maps a Mongoose InvestmentAsset document to the domain InvestmentAsset.
 */
export function mapMongoInvestmentAssetToDomain(
  doc: IInvestmentAsset
): DomainInvestmentAsset {
  return {
    id: extractId(doc),
    userId: doc.userId,
    assetName: doc.assetName,
    investmentType: mongoInvestmentTypeToDomain(doc.investmentType),
    institutionOrPlatform: doc.institutionOrPlatform ?? undefined,
    notes: doc.notes ?? undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Maps a Mongoose InvestmentRecord document to the domain InvestmentRecord.
 */
export function mapMongoInvestmentRecordToDomain(
  doc: IInvestmentRecord,
  asset?: { assetName: string; institutionOrPlatform?: string | null } | null
): DomainInvestmentRecord {
  return {
    id: extractId(doc),
    userId: doc.userId,
    assetId: doc.assetId ?? undefined,
    amount: decimal128ToSafeNumber(doc.amount, 'InvestmentRecord.amount'),
    currency: doc.currency as CurrencyCode,
    investmentType: mongoInvestmentTypeToDomain(doc.investmentType),
    assetName: asset?.assetName ?? undefined,
    institutionOrPlatform: asset?.institutionOrPlatform ?? undefined,
    date: doc.date,
    periodYear: doc.periodYear,
    periodMonth: doc.periodMonth,
    notes: doc.notes ?? undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Maps a Mongoose InsurancePolicy document to the domain InsurancePolicy.
 */
export function mapMongoInsurancePolicyToDomain(
  doc: IInsurancePolicy
): DomainInsurancePolicy {
  return {
    id: extractId(doc),
    userId: doc.userId,
    policyName: doc.policyName,
    policyNumber: doc.policyNumber ?? undefined,
    provider: doc.provider ?? undefined,
    category: mongoInsuranceCategoryToDomain(doc.category),
    premiumAmount: decimal128ToSafeNumber(doc.premiumAmount, 'InsurancePolicy.premiumAmount'),
    currency: doc.currency as CurrencyCode,
    frequency: mongoInsuranceFrequencyToDomain(doc.frequency),
    startDate: doc.startDate,
    renewalDate: doc.renewalDate ?? undefined,
    isActive: doc.isActive,
    notes: doc.notes ?? undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Maps a Mongoose InsurancePayment document to the domain InsurancePayment.
 */
export function mapMongoInsurancePaymentToDomain(
  doc: IInsurancePayment,
  policy?: { policyName: string; category?: MongoInsuranceCategory } | null
): DomainInsurancePayment {
  return {
    id: extractId(doc),
    userId: doc.userId,
    policyId: doc.policyId,
    amount: decimal128ToSafeNumber(doc.amount, 'InsurancePayment.amount'),
    currency: doc.currency as CurrencyCode,
    paymentDate: doc.paymentDate,
    periodYear: doc.periodYear,
    periodMonth: doc.periodMonth,
    policyName: policy?.policyName ?? undefined,
    category: policy?.category ? mongoInsuranceCategoryToDomain(policy.category) : undefined,
    notes: doc.notes ?? undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Maps a Mongoose Loan document to the domain LoanRecord.
 */
export function mapMongoLoanToDomain(doc: ILoan): DomainLoanRecord {
  return {
    id: extractId(doc),
    userId: doc.userId,
    loanTitle: doc.loanTitle,
    lenderName: doc.lenderName,
    principalAmount: decimal128ToSafeNumber(doc.principalAmount, 'Loan.principalAmount'),
    outstandingAmount: decimal128ToSafeNumber(doc.outstandingAmount, 'Loan.outstandingAmount'),
    interestRate: decimal128ToSafeNumber(doc.interestRate, 'Loan.interestRate'),
    installmentAmount: decimal128ToSafeNumber(doc.installmentAmount, 'Loan.installmentAmount'),
    frequency: mongoLoanFrequencyToDomain(doc.frequency),
    startDate: doc.startDate,
    endDate: doc.endDate ?? undefined,
    notes: doc.notes ?? undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Maps a Mongoose LoanRepayment document to the domain DomainLoanRepayment.
 */
export function mapMongoLoanRepaymentToDomain(doc: ILoanRepayment): DomainLoanRepayment {
  return {
    id: extractId(doc),
    userId: doc.userId,
    loanId: doc.loanId,
    amount: decimal128ToSafeNumber(doc.amount, 'LoanRepayment.amount'),
    principalComponent: optionalDecimal128ToSafeNumber(
      doc.principalComponent,
      'LoanRepayment.principalComponent'
    ),
    interestComponent: optionalDecimal128ToSafeNumber(
      doc.interestComponent,
      'LoanRepayment.interestComponent'
    ),
    paymentDate: doc.paymentDate,
    periodYear: doc.periodYear,
    periodMonth: doc.periodMonth,
    notes: doc.notes ?? undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Maps a Mongoose Category document to the domain DomainCategory.
 */
export function mapMongoCategoryToDomain(doc: ICategory): DomainCategory {
  return {
    id: extractId(doc),
    userId: doc.userId ?? undefined,
    name: doc.name,
    slug: doc.slug,
    type: doc.type.toLowerCase() as DomainCategory['type'],
    defaultExpenseType: doc.defaultExpenseType
      ? (doc.defaultExpenseType.toLowerCase() as 'fixed' | 'variable')
      : null,
    icon: doc.icon ?? null,
    color: doc.color ?? null,
    isSystem: doc.isSystem,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Maps a Mongoose User document to the domain DomainUser.
 */
export function mapMongoUserToDomain(doc: IUser): DomainUser {
  return {
    id: extractId(doc),
    email: doc.email,
    name: doc.name ?? null,
    image: doc.image ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
