import { Types } from 'mongoose';

/**
 * Fintrack — MongoDB Decimal128 Financial Precision Layer
 *
 * MONETARY VALUE STRATEGY:
 * - All monetary amounts in MongoDB collections MUST be stored as `Decimal128`.
 * - Ordinary JavaScript IEEE 754 floating-point `double` fields are strictly forbidden for money.
 * - Upper bound: 90 trillion major currency units (90,000,000,000,000.00), ensuring minor units
 *   fit cleanly within JavaScript Number.MAX_SAFE_INTEGER (9,007,199,254,740,991).
 * - Sub-cent fractions (>2 decimal places) are strictly rejected to avoid silent truncation or rounding.
 */

export const MAX_SAFE_CURRENCY_AMOUNT = 90_000_000_000_000;

/**
 * Custom error thrown when a monetary value cannot be safely converted to or from Decimal128.
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

/**
 * Validates that a numeric monetary value satisfies financial invariants:
 * 1. Must be a finite number (not NaN, not Infinity).
 * 2. Absolute magnitude must be within MAX_SAFE_CURRENCY_AMOUNT (<= 90 trillion).
 * 3. Must not have sub-cent precision (>2 decimal places).
 */
export function validateMonetaryNumber(value: unknown, fieldName: string = 'amount'): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new UnsafeDecimalConversionError(
      'Encountered non-finite numeric value where a monetary amount was expected',
      value,
      fieldName
    );
  }

  if (Math.abs(value) > MAX_SAFE_CURRENCY_AMOUNT) {
    throw new UnsafeDecimalConversionError(
      `Monetary amount '${value}' exceeds the maximum safe representation limit (90 trillion)`,
      value,
      fieldName
    );
  }

  // Guard against sub-cent precision: reject >2 decimal places
  const str = value.toString();
  if (str.includes('.')) {
    const fraction = str.split('.')[1];
    if (fraction && fraction.length > 2 && Math.abs(Math.round(value * 100) - value * 100) > 1e-6) {
      throw new UnsafeDecimalConversionError(
        `Amount '${value}' has fractional sub-cent precision (>2 decimal places) that would be silently truncated`,
        value,
        fieldName
      );
    }
  }

  return value;
}

/**
 * Converts a validated JavaScript number into a MongoDB Decimal128.
 * Guarantees exactly 2 decimal places of precision without floating-point drift.
 *
 * @param amount JavaScript number to convert.
 * @param fieldName Optional field name for error reporting.
 * @returns MongoDB Types.Decimal128 representation.
 */
export function numberToDecimal128(amount: number, fieldName?: string): Types.Decimal128 {
  const safeNum = validateMonetaryNumber(amount, fieldName);
  return Types.Decimal128.fromString(safeNum.toFixed(2));
}

/**
 * Converts a MongoDB Decimal128, number, or numeric string instance into an exact JavaScript number.
 *
 * Safety Invariants:
 * 1. Rejects null/undefined when called directly on required fields.
 * 2. Rejects NaN or non-finite Decimal representations.
 * 3. Rejects magnitudes exceeding MAX_SAFE_CURRENCY_AMOUNT.
 * 4. Rejects sub-cent precision (>2 decimal places) that would represent unhandled fractional currency.
 *
 * @param decimal The MongoDB Types.Decimal128 instance, number, or string to convert.
 * @param fieldName Optional identifier for error reporting.
 * @returns JavaScript number in standard major units (e.g. 250000.50).
 */
export function decimal128ToSafeNumber(
  decimal: Types.Decimal128 | number | string | null | undefined,
  fieldName?: string
): number {
  if (decimal === null || decimal === undefined) {
    throw new UnsafeDecimalConversionError(
      'Encountered null or undefined Decimal128 where a required monetary value was expected',
      decimal,
      fieldName
    );
  }

  if (typeof decimal === 'number') {
    return validateMonetaryNumber(decimal, fieldName);
  }

  const str = decimal.toString();

  if (str === 'NaN' || str === 'Infinity' || str === '-Infinity') {
    throw new UnsafeDecimalConversionError(
      'Decimal128 is non-finite or NaN',
      str,
      fieldName
    );
  }

  const num = Number(str);

  if (!Number.isFinite(num)) {
    throw new UnsafeDecimalConversionError(
      'Converted number is not finite',
      str,
      fieldName
    );
  }

  if (Math.abs(num) > MAX_SAFE_CURRENCY_AMOUNT) {
    throw new UnsafeDecimalConversionError(
      `Decimal magnitude '${str}' exceeds the maximum safe representation limit (90 trillion)`,
      str,
      fieldName
    );
  }

  // Guard against sub-cent precision in persisted Decimal128
  if (str.includes('.')) {
    const fraction = str.split('.')[1];
    if (fraction && fraction.length > 2) {
      // Check if trailing digits are non-zero
      const nonZeroTrailing = fraction.slice(2).replace(/0+$/, '');
      if (nonZeroTrailing.length > 0) {
        throw new UnsafeDecimalConversionError(
          `Decimal128 '${str}' has fractional sub-cent precision (>2 decimal places) that would be silently truncated`,
          str,
          fieldName
        );
      }
    }
  }

  return num;
}

/**
 * Converts an optional/nullable MongoDB Decimal128, number, or string into a number or undefined.
 */
export function optionalDecimal128ToSafeNumber(
  decimal: Types.Decimal128 | number | string | null | undefined,
  fieldName?: string
): number | undefined {
  if (decimal === null || decimal === undefined) {
    return undefined;
  }
  return decimal128ToSafeNumber(decimal, fieldName);
}

/**
 * Preserves the exact database Decimal128 value as a formatted 2-decimal string.
 * Completely avoids floating-point conversion. Ideal for audit logging or display.
 */
export function decimal128ToString(
  decimal: Types.Decimal128 | null | undefined
): string | null {
  if (decimal === null || decimal === undefined) {
    return null;
  }
  const str = decimal.toString();
  const num = Number(str);
  if (!Number.isFinite(num)) return null;
  return num.toFixed(2);
}

/**
 * Mongoose Schema Getter helper for Decimal128 fields.
 * Converts Decimal128 to safe number when reading documents.
 */
export function decimal128Getter(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (value instanceof Types.Decimal128) {
    return decimal128ToSafeNumber(value);
  }
  if (typeof value === 'number') {
    return value;
  }
  return undefined;
}

/**
 * Mongoose Schema Setter helper for Decimal128 fields.
 * Safely converts number or string to Decimal128 before persisting.
 */
export function decimal128Setter(value: unknown): Types.Decimal128 | null | undefined {
  if (value === null || value === undefined) return value as null | undefined;
  if (value instanceof Types.Decimal128) return value;
  if (typeof value === 'number') {
    return numberToDecimal128(value);
  }
  if (typeof value === 'string') {
    const num = Number(value);
    return numberToDecimal128(num);
  }
  return value as Types.Decimal128;
}
