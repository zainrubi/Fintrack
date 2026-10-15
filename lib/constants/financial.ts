import type {
  CurrencyCode,
  DefaultExpenseCategory,
  DefaultInsuranceCategory,
  DefaultInvestmentType,
  DefaultSavingsCategory,
  ExpenseType,
  InsuranceFrequency,
  LoanFrequency,
  PaymentFrequency,
  SalaryType,
} from '../../types/financial';

/** System default currency */
export const DEFAULT_CURRENCY: CurrencyCode = 'PKR';

/** Metadata for supported currencies */
export interface CurrencyMetadata {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimalPlaces: number;
}

export const SUPPORTED_CURRENCIES: readonly CurrencyMetadata[] = [
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', decimalPlaces: 0 },
  { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', decimalPlaces: 2 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', decimalPlaces: 2 },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', decimalPlaces: 2 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', decimalPlaces: 2 },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', decimalPlaces: 2 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimalPlaces: 2 },
] as const;

/** Category option definition for select menus and displays */
export interface CategoryOption<T extends string> {
  value: T;
  label: string;
  defaultType?: ExpenseType;
  description?: string;
}

/** Default expense categories tailored for salaried individuals */
export const DEFAULT_EXPENSE_CATEGORIES: readonly CategoryOption<DefaultExpenseCategory>[] = [
  { value: 'housing', label: 'Housing & Rent', defaultType: 'fixed' },
  { value: 'utilities', label: 'Utilities (Electricity, Gas, Water, Net)', defaultType: 'fixed' },
  { value: 'groceries', label: 'Groceries & Household Supplies', defaultType: 'variable' },
  { value: 'transportation', label: 'Transportation & Fuel', defaultType: 'variable' },
  { value: 'healthcare', label: 'Healthcare & Medical', defaultType: 'variable' },
  { value: 'education', label: 'Education & Tuition', defaultType: 'fixed' },
  { value: 'family_support', label: 'Family Support & Remittances', defaultType: 'fixed' },
  { value: 'charity_zakat', label: 'Charity & Zakat', defaultType: 'variable' },
  { value: 'debt_payment', label: 'Debt & Informal Loans', defaultType: 'fixed' },
  { value: 'dining_out', label: 'Dining Out & Food Delivery', defaultType: 'variable' },
  { value: 'entertainment', label: 'Entertainment & Subscriptions', defaultType: 'variable' },
  { value: 'shopping', label: 'Shopping & Apparel', defaultType: 'variable' },
  { value: 'personal_care', label: 'Personal Care & Wellness', defaultType: 'variable' },
  { value: 'miscellaneous', label: 'Miscellaneous / Other', defaultType: 'variable' },
] as const;

/** Default savings categories for financial resilience and goals */
export const DEFAULT_SAVINGS_CATEGORIES: readonly CategoryOption<DefaultSavingsCategory>[] = [
  { value: 'emergency_fund', label: 'Emergency Fund (Cash Cushion)' },
  { value: 'general_savings', label: 'General / Liquid Savings' },
  { value: 'house_downpayment', label: 'House Down Payment' },
  { value: 'retirement', label: 'Retirement Reserve' },
  { value: 'education', label: 'Higher Education Fund' },
  { value: 'wedding', label: 'Wedding & Major Events' },
  { value: 'travel_vacation', label: 'Travel & Vacation' },
  { value: 'hajj_umrah', label: 'Hajj & Umrah Fund' },
] as const;

/** Default investment vehicles for salaried professionals */
export const DEFAULT_INVESTMENT_TYPES: readonly CategoryOption<DefaultInvestmentType>[] = [
  { value: 'mutual_fund', label: 'Mutual Funds / Asset Management' },
  { value: 'stocks', label: 'Equities & Stock Market' },
  { value: 'real_estate', label: 'Real Estate / Land / Property' },
  { value: 'gold_precious_metals', label: 'Gold & Precious Metals' },
  { value: 'government_bonds', label: 'Govt. Bonds / National Savings' },
  { value: 'provident_fund', label: 'Provident Fund / Gratuity' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'business_venture', label: 'Private Business Venture' },
  { value: 'other', label: 'Other Investments' },
] as const;

/** Default insurance policy classifications */
export const DEFAULT_INSURANCE_CATEGORIES: readonly CategoryOption<DefaultInsuranceCategory>[] = [
  { value: 'health', label: 'Health & Medical Insurance' },
  { value: 'life', label: 'Life & Term Takaful' },
  { value: 'vehicle', label: 'Vehicle & Auto Insurance' },
  { value: 'home', label: 'Home & Property Insurance' },
  { value: 'disability', label: 'Disability & Critical Illness' },
  { value: 'other', label: 'Other Insurance Policy' },
] as const;

/** Salary type options */
export const SALARY_TYPES: readonly CategoryOption<SalaryType>[] = [
  { value: 'primary', label: 'Primary Monthly Salary' },
  { value: 'secondary', label: 'Secondary / Dual Employment' },
  { value: 'bonus', label: 'Annual / Performance Bonus' },
  { value: 'allowance', label: 'Special Allowance / Stipend' },
  { value: 'freelance', label: 'Freelance & Consulting' },
  { value: 'overtime', label: 'Overtime Pay' },
  { value: 'other', label: 'Other Income' },
] as const;

/** Expense types */
export const EXPENSE_TYPES: readonly { value: ExpenseType; label: string; description: string }[] = [
  { value: 'fixed', label: 'Fixed Expense', description: 'Predictable, recurring obligations that must be paid' },
  { value: 'variable', label: 'Variable Expense', description: 'Discretionary or fluctuating day-to-day spending' },
] as const;

/** Frequencies supported across recurring financial transactions */
export const PAYMENT_FREQUENCIES: readonly { value: PaymentFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly (Every 2 Weeks)' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly (Every 3 Months)' },
  { value: 'semi-annually', label: 'Semi-Annually (Every 6 Months)' },
  { value: 'annually', label: 'Annually' },
  { value: 'one-time', label: 'One-Time' },
] as const;

export const INSURANCE_FREQUENCIES: readonly { value: InsuranceFrequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi-annually', label: 'Semi-Annually' },
  { value: 'annually', label: 'Annually' },
] as const;

export const LOAN_FREQUENCIES: readonly { value: LoanFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly (EMI)' },
  { value: 'quarterly', label: 'Quarterly' },
] as const;
