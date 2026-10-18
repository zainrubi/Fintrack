import { prisma } from '../prisma';
import {
  domainSalaryTypeToDb,
  mapSalaryRecordToDomain,
  safeNumberToDecimal,
} from '../mappers';
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
import { Prisma } from '@prisma/client';

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

export function validateRecordId(id: unknown, entityName: string = 'Record'): string {
  if (typeof id !== 'string' || id.trim() === '') {
    throw new ValidationError(`A valid, non-empty ${entityName} ID is required.`, 'id', id);
  }
  return id.trim();
}

function parseAndValidateDate(value: Date | string, fieldName: string): Date {
  const parsed = value instanceof Date ? value : new Date(value);
  if (isNaN(parsed.getTime())) {
    throw new ValidationError(`'${String(value)}' is not a valid date.`, fieldName, value);
  }
  return parsed;
}

export function validateSalaryInput(input: CreateSalaryInput): {
  amountDecimal: Prisma.Decimal;
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
  const amountDecimal = safeNumberToDecimal(input.amount, 'amount');

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

  const created = await prisma.salaryRecord.create({
    data: {
      userId: safeUserId,
      amount: validated.amountDecimal,
      currency: validated.currency,
      salaryType: domainSalaryTypeToDb(validated.salaryType),
      payPeriodYear: validated.payPeriodYear,
      payPeriodMonth: validated.payPeriodMonth,
      paymentDate: validated.paymentDate,
      employerOrSource: validated.employerOrSource,
      notes: validated.notes,
    },
  });

  return mapSalaryRecordToDomain(created);
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

  const where: Prisma.SalaryRecordWhereInput = {
    userId: safeUserId,
  };

  if (filter?.payPeriodYear !== undefined) {
    where.payPeriodYear = filter.payPeriodYear;
  }
  if (filter?.payPeriodMonth !== undefined) {
    where.payPeriodMonth = filter.payPeriodMonth;
  }
  if (filter?.salaryType !== undefined) {
    where.salaryType = domainSalaryTypeToDb(filter.salaryType);
  }
  if (filter?.startDate || filter?.endDate) {
    where.paymentDate = {};
    if (filter.startDate) {
      where.paymentDate.gte = parseAndValidateDate(filter.startDate, 'filter.startDate');
    }
    if (filter.endDate) {
      where.paymentDate.lte = parseAndValidateDate(filter.endDate, 'filter.endDate');
    }
  }

  const [totalCount, dbRecords] = await Promise.all([
    prisma.salaryRecord.count({ where }),
    prisma.salaryRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { paymentDate: 'desc' },
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
    }),
  ]);

  return {
    data: dbRecords.map(mapSalaryRecordToDomain),
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

  const record = await prisma.salaryRecord.findFirst({
    where: {
      id: safeId,
      userId: safeUserId,
    },
  });

  if (!record) {
    throw new RecordNotFoundError('SalaryRecord', safeId);
  }

  return mapSalaryRecordToDomain(record);
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

  // Verify ownership before modifying
  const existing = await prisma.salaryRecord.findFirst({
    where: {
      id: safeId,
      userId: safeUserId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new RecordNotFoundError('SalaryRecord', safeId);
  }

  const updateData: Prisma.SalaryRecordUpdateInput = {};

  if (input.amount !== undefined) {
    if (typeof input.amount !== 'number' || !Number.isFinite(input.amount) || input.amount <= 0) {
      throw new ValidationError('Updated amount must be a positive finite number.', 'amount', input.amount);
    }
    updateData.amount = safeNumberToDecimal(input.amount, 'amount');
  }

  if (input.currency !== undefined) {
    const trimmed = input.currency.trim().toUpperCase();
    if (trimmed.length !== 3) {
      throw new ValidationError('Currency must be a 3-letter ISO code.', 'currency', input.currency);
    }
    updateData.currency = trimmed;
  }

  if (input.salaryType !== undefined) {
    updateData.salaryType = domainSalaryTypeToDb(input.salaryType);
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

  const updated = await prisma.salaryRecord.update({
    where: { id: safeId },
    data: updateData,
  });

  return mapSalaryRecordToDomain(updated);
}

/**
 * Deletes a salary record, atomically scoped by both record ID and user ID.
 * Uses deleteMany to execute a single atomic SQL statement:
 * DELETE FROM salary_records WHERE id = ? AND user_id = ?
 */
export async function deleteSalary(
  userId: string,
  id: string
): Promise<void> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'SalaryRecord');

  const result = await prisma.salaryRecord.deleteMany({
    where: {
      id: safeId,
      userId: safeUserId,
    },
  });

  verifyDeletionResult(result.count, 'SalaryRecord', safeId);
}
