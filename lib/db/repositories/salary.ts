import mongoose, { Types } from 'mongoose';
import {
  SalaryRecordModel,
  type SalaryType as MongoSalaryType,
} from '../models/salary-record';
import { connectToDatabase } from '../mongoose';
import { MAX_SAFE_CURRENCY_AMOUNT, numberToDecimal128 } from '../decimal';
import {
  domainSalaryTypeToMongo,
  mapMongoSalaryRecordToDomain,
} from '../mongo-mappers';
import { RecordNotFoundError, ValidationError } from './errors';
import {
  buildPaginationMeta,
  normalizePagination,
  verifyDeletionResult,
  type PaginatedResult,
  type PaginationParams,
} from './types';
import type {
  SalaryRecord as DomainSalaryRecord,
  SalaryType as DomainSalaryType,
} from '@/types/financial';

// ==============================================================================
// 1. Input Contracts
// ==============================================================================

export interface CreateSalaryInput {
  amount: number;
  currency?: string;
  salaryType?: DomainSalaryType;
  payPeriodYear: number;
  payPeriodMonth: number;
  paymentDate: Date | string;
  employerOrSource?: string | null;
  notes?: string | null;
}

export interface UpdateSalaryInput {
  amount?: number;
  currency?: string;
  salaryType?: DomainSalaryType;
  payPeriodYear?: number;
  payPeriodMonth?: number;
  paymentDate?: Date | string;
  employerOrSource?: string | null;
  notes?: string | null;
}

export interface ListSalaryFilter {
  payPeriodYear?: number;
  payPeriodMonth?: number;
  salaryType?: DomainSalaryType;
  startDate?: Date | string;
  endDate?: Date | string;
}

// ==============================================================================
// 2. Validation Helpers
// ==============================================================================

export function validateUserId(userId: unknown): string {
  if (typeof userId !== 'string' || userId.trim() === '') {
    throw new ValidationError('A valid, non-empty userId is required.', 'userId', userId);
  }
  return userId.trim();
}

/**
 * Validates whether a value is a 24-character hexadecimal MongoDB ObjectId string.
 */
export function isValidObjectId(id: unknown): id is string {
  if (typeof id !== 'string') return false;
  const trimmed = id.trim();
  return /^[0-9a-fA-F]{24}$/.test(trimmed) && Types.ObjectId.isValid(trimmed);
}

/**
 * Validates that an ID is a valid string. For SalaryRecord entity, strictly enforces
 * a 24-character hexadecimal MongoDB ObjectId.
 */
export function validateRecordId(id: unknown, entityName: string = 'Record'): string {
  if (typeof id !== 'string' || id.trim() === '') {
    throw new ValidationError(`A valid, non-empty ${entityName} ID is required.`, 'id', id);
  }
  const trimmed = id.trim();
  if (entityName === 'SalaryRecord' && !isValidObjectId(trimmed)) {
    throw new ValidationError(
      `Invalid SalaryRecord ID '${trimmed}'. Must be a 24-character hexadecimal ObjectId.`,
      'id',
      id
    );
  }
  return trimmed;
}

/**
 * Validates that an ID is a valid 24-character hexadecimal MongoDB ObjectId.
 */
export function validateObjectId(id: unknown, entityName: string = 'Record'): string {
  if (typeof id !== 'string' || id.trim() === '') {
    throw new ValidationError(`A valid, non-empty ${entityName} ID is required.`, 'id', id);
  }
  const trimmed = id.trim();
  if (!isValidObjectId(trimmed)) {
    throw new ValidationError(
      `Invalid ${entityName} ID '${trimmed}'. Must be a 24-character hexadecimal ObjectId.`,
      'id',
      id
    );
  }
  return trimmed;
}

function parseAndValidateDate(value: Date | string, fieldName: string): Date {
  const parsed = value instanceof Date ? value : new Date(value);
  if (isNaN(parsed.getTime())) {
    throw new ValidationError(`'${String(value)}' is not a valid date.`, fieldName, value);
  }
  return parsed;
}

export function validateSalaryInput(input: CreateSalaryInput): {
  amountDecimal: Types.Decimal128;
  currency: string;
  salaryType: DomainSalaryType;
  payPeriodYear: number;
  payPeriodMonth: number;
  paymentDate: Date;
  employerOrSource: string | null;
  notes: string | null;
} {
  // 1. Amount validation
  if (typeof input.amount !== 'number' || !Number.isFinite(input.amount)) {
    throw new ValidationError('Salary amount must be a finite numeric value.', 'amount', input.amount);
  }
  if (input.amount <= 0) {
    throw new ValidationError('Salary amount must be greater than zero.', 'amount', input.amount);
  }
  if (Math.abs(input.amount) > MAX_SAFE_CURRENCY_AMOUNT) {
    throw new ValidationError(
      `Salary amount '${input.amount}' exceeds the maximum safe representation limit (90 trillion).`,
      'amount',
      input.amount
    );
  }

  // Guard against sub-cent precision: reject >2 decimal places
  const str = input.amount.toString();
  if (str.includes('.')) {
    const fraction = str.split('.')[1];
    if (fraction && fraction.length > 2 && Math.abs(Math.round(input.amount * 100) - input.amount * 100) > 1e-6) {
      throw new ValidationError(
        `Salary amount '${input.amount}' cannot have fractional sub-cent precision (>2 decimal places).`,
        'amount',
        input.amount
      );
    }
  }

  let amountDecimal: Types.Decimal128;
  try {
    amountDecimal = numberToDecimal128(input.amount, 'amount');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ValidationError(message, 'amount', input.amount);
  }

  // 2. Currency validation
  let currency = 'PKR';
  if (input.currency !== undefined && input.currency !== null) {
    const trimmed = input.currency.trim().toUpperCase();
    if (trimmed.length !== 3) {
      throw new ValidationError('Currency must be a 3-letter ISO code.', 'currency', input.currency);
    }
    currency = trimmed;
  }

  // 3. SalaryType validation
  const validTypes: DomainSalaryType[] = [
    'primary',
    'secondary',
    'bonus',
    'allowance',
    'freelance',
    'overtime',
    'other',
  ];
  const salaryType = input.salaryType ?? 'primary';
  if (!validTypes.includes(salaryType)) {
    throw new ValidationError(
      `Invalid salaryType '${salaryType}'. Permitted types: ${validTypes.join(', ')}`,
      'salaryType',
      salaryType
    );
  }

  // 4. Pay period month & year
  if (!Number.isInteger(input.payPeriodMonth) || input.payPeriodMonth < 1 || input.payPeriodMonth > 12) {
    throw new ValidationError(
      'payPeriodMonth must be an integer between 1 and 12.',
      'payPeriodMonth',
      input.payPeriodMonth
    );
  }
  if (!Number.isInteger(input.payPeriodYear) || input.payPeriodYear < 1900 || input.payPeriodYear > 2100) {
    throw new ValidationError(
      'payPeriodYear must be an integer between 1900 and 2100.',
      'payPeriodYear',
      input.payPeriodYear
    );
  }

  // 5. Payment Date
  const paymentDate = parseAndValidateDate(input.paymentDate, 'paymentDate');

  // 6. Strings bounds
  const employerOrSource = input.employerOrSource
    ? input.employerOrSource.trim().slice(0, 150)
    : null;
  const notes = input.notes ? input.notes.trim() : null;

  return {
    amountDecimal,
    currency,
    salaryType,
    payPeriodYear: input.payPeriodYear,
    payPeriodMonth: input.payPeriodMonth,
    paymentDate,
    employerOrSource,
    notes,
  };
}

async function ensureDbConnected(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  await connectToDatabase();
}

// ==============================================================================
// 3. Repository Implementation
// ==============================================================================

/**
 * Creates a new salary record for the specified user.
 */
export async function createSalary(
  userId: string,
  input: CreateSalaryInput
): Promise<DomainSalaryRecord> {
  const safeUserId = validateUserId(userId);
  const validated = validateSalaryInput(input);

  await ensureDbConnected();

  const created = await SalaryRecordModel.create({
    userId: safeUserId,
    amount: validated.amountDecimal,
    currency: validated.currency,
    salaryType: domainSalaryTypeToMongo(validated.salaryType),
    payPeriodYear: validated.payPeriodYear,
    payPeriodMonth: validated.payPeriodMonth,
    paymentDate: validated.paymentDate,
    employerOrSource: validated.employerOrSource,
    notes: validated.notes,
  });

  return mapMongoSalaryRecordToDomain(created);
}

/**
 * Retrieves a paginated list of salary records for a specific user with deterministic ordering.
 */
export async function listSalaries(
  userId: string,
  filter?: ListSalaryFilter,
  pagination?: PaginationParams
): Promise<PaginatedResult<DomainSalaryRecord>> {
  const safeUserId = validateUserId(userId);
  const { page, limit, skip } = normalizePagination(pagination);

  await ensureDbConnected();

  const query: Record<string, unknown> = {
    userId: safeUserId,
  };

  if (filter?.payPeriodYear !== undefined) {
    if (!Number.isInteger(filter.payPeriodYear) || filter.payPeriodYear < 1900 || filter.payPeriodYear > 2100) {
      throw new ValidationError(
        'filter.payPeriodYear must be an integer between 1900 and 2100.',
        'payPeriodYear',
        filter.payPeriodYear
      );
    }
    query.payPeriodYear = filter.payPeriodYear;
  }

  if (filter?.payPeriodMonth !== undefined) {
    if (!Number.isInteger(filter.payPeriodMonth) || filter.payPeriodMonth < 1 || filter.payPeriodMonth > 12) {
      throw new ValidationError(
        'filter.payPeriodMonth must be an integer between 1 and 12.',
        'payPeriodMonth',
        filter.payPeriodMonth
      );
    }
    query.payPeriodMonth = filter.payPeriodMonth;
  }

  if (filter?.salaryType !== undefined) {
    const validTypes: DomainSalaryType[] = [
      'primary',
      'secondary',
      'bonus',
      'allowance',
      'freelance',
      'overtime',
      'other',
    ];
    if (!validTypes.includes(filter.salaryType)) {
      throw new ValidationError(
        `Invalid salaryType '${filter.salaryType}'. Permitted types: ${validTypes.join(', ')}`,
        'salaryType',
        filter.salaryType
      );
    }
    query.salaryType = domainSalaryTypeToMongo(filter.salaryType);
  }

  if (filter?.startDate || filter?.endDate) {
    const paymentDateFilter: Record<string, Date> = {};
    if (filter.startDate) {
      paymentDateFilter.$gte = parseAndValidateDate(filter.startDate, 'filter.startDate');
    }
    if (filter.endDate) {
      paymentDateFilter.$lte = parseAndValidateDate(filter.endDate, 'filter.endDate');
    }
    query.paymentDate = paymentDateFilter;
  }

  const [totalCount, dbRecords] = await Promise.all([
    SalaryRecordModel.countDocuments(query),
    SalaryRecordModel.find(query)
      .sort({ paymentDate: -1, createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return {
    data: dbRecords.map(mapMongoSalaryRecordToDomain),
    pagination: buildPaginationMeta(totalCount, page, limit),
  };
}

/**
 * Retrieves a single salary record by ID, strictly enforcing user ownership.
 */
export async function getSalaryById(
  userId: string,
  id: string
): Promise<DomainSalaryRecord> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'SalaryRecord');

  await ensureDbConnected();

  const record = await SalaryRecordModel.findOne({
    _id: new Types.ObjectId(safeId),
    userId: safeUserId,
  });

  if (!record) {
    throw new RecordNotFoundError('SalaryRecord', safeId);
  }

  return mapMongoSalaryRecordToDomain(record);
}

/**
 * Updates an existing salary record belonging to the specified user.
 * Explicitly whitelists updateable fields to prevent arbitrary field injection.
 */
export async function updateSalary(
  userId: string,
  id: string,
  input: UpdateSalaryInput
): Promise<DomainSalaryRecord> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'SalaryRecord');

  await ensureDbConnected();

  const updateData: Partial<{
    amount: Types.Decimal128;
    currency: string;
    salaryType: MongoSalaryType;
    payPeriodYear: number;
    payPeriodMonth: number;
    paymentDate: Date;
    employerOrSource: string | null;
    notes: string | null;
  }> = {};

  if (input.amount !== undefined) {
    if (typeof input.amount !== 'number' || !Number.isFinite(input.amount)) {
      throw new ValidationError('Updated amount must be a finite numeric value.', 'amount', input.amount);
    }
    if (input.amount <= 0) {
      throw new ValidationError('Updated amount must be a positive finite number.', 'amount', input.amount);
    }
    if (Math.abs(input.amount) > MAX_SAFE_CURRENCY_AMOUNT) {
      throw new ValidationError(
        `Updated amount '${input.amount}' exceeds the maximum safe representation limit (90 trillion).`,
        'amount',
        input.amount
      );
    }
    const str = input.amount.toString();
    if (str.includes('.')) {
      const fraction = str.split('.')[1];
      if (fraction && fraction.length > 2 && Math.abs(Math.round(input.amount * 100) - input.amount * 100) > 1e-6) {
        throw new ValidationError('Updated amount cannot have fractional sub-cent precision (>2 decimal places).', 'amount', input.amount);
      }
    }
    try {
      updateData.amount = numberToDecimal128(input.amount, 'amount');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new ValidationError(message, 'amount', input.amount);
    }
  }

  if (input.currency !== undefined) {
    const trimmed = input.currency.trim().toUpperCase();
    if (trimmed.length !== 3) {
      throw new ValidationError('Currency must be a 3-letter ISO code.', 'currency', input.currency);
    }
    updateData.currency = trimmed;
  }

  if (input.salaryType !== undefined) {
    const validTypes: DomainSalaryType[] = [
      'primary',
      'secondary',
      'bonus',
      'allowance',
      'freelance',
      'overtime',
      'other',
    ];
    if (!validTypes.includes(input.salaryType)) {
      throw new ValidationError(
        `Invalid salaryType '${input.salaryType}'. Permitted types: ${validTypes.join(', ')}`,
        'salaryType',
        input.salaryType
      );
    }
    updateData.salaryType = domainSalaryTypeToMongo(input.salaryType);
  }

  if (input.payPeriodMonth !== undefined) {
    if (!Number.isInteger(input.payPeriodMonth) || input.payPeriodMonth < 1 || input.payPeriodMonth > 12) {
      throw new ValidationError('payPeriodMonth must be between 1 and 12.', 'payPeriodMonth', input.payPeriodMonth);
    }
    updateData.payPeriodMonth = input.payPeriodMonth;
  }

  if (input.payPeriodYear !== undefined) {
    if (!Number.isInteger(input.payPeriodYear) || input.payPeriodYear < 1900 || input.payPeriodYear > 2100) {
      throw new ValidationError('payPeriodYear must be between 1900 and 2100.', 'payPeriodYear', input.payPeriodYear);
    }
    updateData.payPeriodYear = input.payPeriodYear;
  }

  if (input.paymentDate !== undefined) {
    updateData.paymentDate = parseAndValidateDate(input.paymentDate, 'paymentDate');
  }

  if (input.employerOrSource !== undefined) {
    updateData.employerOrSource = input.employerOrSource
      ? input.employerOrSource.trim().slice(0, 150)
      : null;
  }

  if (input.notes !== undefined) {
    updateData.notes = input.notes ? input.notes.trim() : null;
  }

  const updated = await SalaryRecordModel.findOneAndUpdate(
    {
      _id: new Types.ObjectId(safeId),
      userId: safeUserId,
    },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw new RecordNotFoundError('SalaryRecord', safeId);
  }

  return mapMongoSalaryRecordToDomain(updated);
}

/**
 * Deletes a salary record, atomically scoped by both record ID and user ID.
 */
export async function deleteSalary(
  userId: string,
  id: string
): Promise<void> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'SalaryRecord');

  await ensureDbConnected();

  const result = await SalaryRecordModel.deleteOne({
    _id: new Types.ObjectId(safeId),
    userId: safeUserId,
  });

  verifyDeletionResult(result.deletedCount, 'SalaryRecord', safeId);
}
