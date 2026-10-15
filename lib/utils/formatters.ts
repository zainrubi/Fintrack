import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from '../constants/financial';
import type { CurrencyCode } from '../../types/financial';

export interface FormatCurrencyOptions {
  /** Whether to prefix with the currency symbol/code (default: true) */
  includeSymbol?: boolean;
  /** Force specific minimum decimal places */
  minimumFractionDigits?: number;
  /** Force specific maximum decimal places */
  maximumFractionDigits?: number;
  /** Override formatting locale (default: inferred from currency) */
  locale?: string;
}

/**
 * Formats a monetary amount into a localized currency string.
 * Supports flexible currencies (PKR, USD, EUR, etc.) with PKR as default.
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: CurrencyCode = DEFAULT_CURRENCY,
  options: FormatCurrencyOptions = {}
): string {
  const safeAmount = Number.isFinite(amount) ? (amount as number) : 0;
  const currencyMeta = SUPPORTED_CURRENCIES.find((c) => c.code === currency);

  // Default to 0 decimals for PKR (standard in Pakistan for whole rupee amounts), 2 for others
  const defaultDecimals = currencyMeta ? currencyMeta.decimalPlaces : 2;
  const minDecimals = options.minimumFractionDigits ?? defaultDecimals;
  const maxDecimals = options.maximumFractionDigits ?? defaultDecimals;

  const locale = options.locale ?? (currency === 'PKR' ? 'en-PK' : 'en-US');

  try {
    if (options.includeSymbol === false) {
      return new Intl.NumberFormat(locale, {
        style: 'decimal',
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: maxDecimals,
      }).format(safeAmount);
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || DEFAULT_CURRENCY,
      currencyDisplay: 'symbol',
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    }).format(safeAmount);
  } catch {
    // Robust fallback if currency code or locale is unsupported by runtime
    const symbol = currencyMeta ? currencyMeta.symbol : currency;
    const formatted = safeAmount.toLocaleString(locale, {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    });
    return options.includeSymbol === false ? formatted : `${symbol} ${formatted}`;
  }
}

/**
 * Formats a percentage ratio with a '%' suffix.
 * Removes trailing zeroes where appropriate (e.g., 20.0% -> 20%, 14.5% -> 14.5%).
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 1
): string {
  if (!Number.isFinite(value) || value === null || value === undefined) {
    return '0%';
  }
  const formatted = Number(value).toFixed(decimals);
  // Trim trailing .0 if integer percentage
  const trimmed = formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
  return `${trimmed}%`;
}

/**
 * Formats a date value into human-friendly format (e.g. "15 Oct 2026").
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const defaultOptions: Intl.DateTimeFormatOptions = options ?? {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };

  return new Intl.DateTimeFormat('en-US', defaultOptions).format(d);
}

/**
 * Formats a month number (1-12) and year into readable period (e.g. "October 2026").
 */
export function formatMonthYear(month: number, year: number): string {
  const safeMonth = Math.min(Math.max(month, 1), 12);
  const date = new Date(year, safeMonth - 1, 1);
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}
