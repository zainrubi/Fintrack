import { prisma } from '../prisma';
import {
  domainSavingsCategoryToDb,
  mapSavingsGoalToDomain,
  mapSavingsRecordToDomain,
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
import { validateRecordId, validateUserId } from './salary';
import type {
  SavingsGoal as DomainSavingsGoal,
  SavingsRecord as DomainSavingsRecord,
  SavingsCategory as DomainSavingsCategory,
} from '@/types/financial';
import { Prisma } from '@prisma/client';

// ==============================================================================
// 1. Input Contracts
// ==============================================================================

export interface CreateSavingsGoalInput {
  name: string;
  category?: DomainSavingsCategory;
  targetAmount?: number | null;
  targetDate?: Date | string | null;
  isEmergencyFund?: boolean;
  notes?: string | null;
}

export interface UpdateSavingsGoalInput {
  name?: string;
  category?: DomainSavingsCategory;
  targetAmount?: number | null;
  targetDate?: Date | string | null;
  isEmergencyFund?: boolean;
  notes?: string | null;
}

export interface ListSavingsGoalFilter {
  category?: DomainSavingsCategory;
  isEmergencyFund?: boolean;
}

export interface CreateSavingsRecordInput {
  amount: number;
  currency?: string;
  category?: DomainSavingsCategory;
  date: Date | string;
  periodYear?: number;
  periodMonth?: number;
  goalId?: string | null;
  notes?: string | null;
}

export interface UpdateSavingsRecordInput {
  amount?: number;
  currency?: string;
  category?: DomainSavingsCategory;
  date?: Date | string;
  periodYear?: number;
  periodMonth?: number;
  goalId?: string | null;
  notes?: string | null;
}

export interface ListSavingsRecordFilter {
  goalId?: string;
  category?: DomainSavingsCategory;
  periodYear?: number;
  periodMonth?: number;
  isEmergencyFund?: boolean;
  startDate?: Date | string;
  endDate?: Date | string;
}

// ==============================================================================
// 2. Validation & Authorization Helpers
// ==============================================================================

function parseAndValidateDate(value: Date | string, fieldName: string): Date {
  const parsed = value instanceof Date ? value : new Date(value);
  if (isNaN(parsed.getTime())) {
    throw new ValidationError(`'${String(value)}' is not a valid date.`, fieldName, value);
  }
  return parsed;
}

/**
 * Validates and sanitizes input for creating a SavingsGoal.
 */
export function validateSavingsGoalInput(input: CreateSavingsGoalInput): {
  name: string;
  category: DomainSavingsCategory;
  targetAmountDecimal: Prisma.Decimal | null;
  targetDate: Date | null;
  isEmergencyFund: boolean;
  notes: string | null;
} {
  // 1. Name validation
  if (typeof input.name !== 'string' || input.name.trim() === '') {
    throw new ValidationError('Savings goal name is required.', 'name', input.name);
  }
  const name = input.name.trim().slice(0, 120);

  // 2. Category
  const category = input.category ?? 'general_savings';

  // 3. Target Amount (optional, positive if provided)
  let targetAmountDecimal: Prisma.Decimal | null = null;
  if (input.targetAmount !== undefined && input.targetAmount !== null) {
    if (typeof input.targetAmount !== 'number' || !Number.isFinite(input.targetAmount)) {
      throw new ValidationError('targetAmount must be a finite number.', 'targetAmount', input.targetAmount);
    }
    if (input.targetAmount <= 0) {
      throw new ValidationError('targetAmount must be greater than zero.', 'targetAmount', input.targetAmount);
    }
    targetAmountDecimal = safeNumberToDecimal(input.targetAmount, 'targetAmount');
  }

  // 4. Target Date (optional)
  let targetDate: Date | null = null;
  if (input.targetDate !== undefined && input.targetDate !== null) {
    targetDate = parseAndValidateDate(input.targetDate, 'targetDate');
  }

  // 5. Emergency Fund flag
  const isEmergencyFund = Boolean(input.isEmergencyFund);

  // 6. Notes
  const notes = input.notes ? input.notes.trim() : null;

  return {
    name,
    category,
    targetAmountDecimal,
    targetDate,
    isEmergencyFund,
    notes,
  };
}

/**
 * Validates and sanitizes input for creating a SavingsRecord.
 */
export function validateSavingsRecordInput(input: CreateSavingsRecordInput): {
  amountDecimal: Prisma.Decimal;
  currency: string;
  category: DomainSavingsCategory;
  date: Date;
  periodYear: number;
  periodMonth: number;
  notes: string | null;
} {
  // 1. Amount validation
  if (typeof input.amount !== 'number' || !Number.isFinite(input.amount)) {
    throw new ValidationError('Savings amount must be a finite numeric value.', 'amount', input.amount);
  }
  if (input.amount <= 0) {
    throw new ValidationError('Savings amount must be greater than zero.', 'amount', input.amount);
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

  // 3. Category
  const category = input.category ?? 'general_savings';

  // 4. Date & Partition periods
  const date = parseAndValidateDate(input.date, 'date');
  const periodYear = input.periodYear ?? date.getUTCFullYear();
  const periodMonth = input.periodMonth ?? (date.getUTCMonth() + 1);

  if (!Number.isInteger(periodMonth) || periodMonth < 1 || periodMonth > 12) {
    throw new ValidationError('periodMonth must be between 1 and 12.', 'periodMonth', periodMonth);
  }
  if (!Number.isInteger(periodYear) || periodYear < 1900 || periodYear > 2100) {
    throw new ValidationError('periodYear must be between 1900 and 2100.', 'periodYear', periodYear);
  }

  // 5. Notes
  const notes = input.notes ? input.notes.trim() : null;

  return {
    amountDecimal,
    currency,
    category,
    date,
    periodYear,
    periodMonth,
    notes,
  };
}

/**
 * Verifies that a savings goal belongs to the specified user.
 * Prevents linking records to unauthorized or non-existent goals.
 * Throws RecordNotFoundError uniformly to prevent information leakage.
 */
export async function verifySavingsGoalAccess(
  goalId: string,
  userId: string
): Promise<{ id: string; name: string }> {
  const safeGoalId = validateRecordId(goalId, 'SavingsGoal');

  const goal = await prisma.savingsGoal.findFirst({
    where: {
      id: safeGoalId,
      userId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!goal) {
    throw new RecordNotFoundError('SavingsGoal', safeGoalId);
  }

  return goal;
}

// ==============================================================================
// 3. Savings Goal Repository Operations
// ==============================================================================

/**
 * Creates a new savings goal scoped to the authenticated user.
 */
export async function createSavingsGoal(
  userId: string,
  input: CreateSavingsGoalInput
): Promise<DomainSavingsGoal> {
  const safeUserId = validateUserId(userId);
  const validated = validateSavingsGoalInput(input);

  const created = await prisma.savingsGoal.create({
    data: {
      userId: safeUserId,
      name: validated.name,
      category: domainSavingsCategoryToDb(validated.category),
      targetAmount: validated.targetAmountDecimal,
      targetDate: validated.targetDate,
      isEmergencyFund: validated.isEmergencyFund,
      notes: validated.notes,
    },
  });

  return mapSavingsGoalToDomain(created);
}

/**
 * Retrieves a paginated list of savings goals for the user with deterministic ordering.
 */
export async function listSavingsGoals(
  userId: string,
  filter?: ListSavingsGoalFilter,
  pagination?: PaginationParams
): Promise<PaginatedResult<DomainSavingsGoal>> {
  const safeUserId = validateUserId(userId);
  const { page, limit, skip } = normalizePagination(pagination);

  const where: Prisma.SavingsGoalWhereInput = {
    userId: safeUserId,
  };

  if (filter?.category !== undefined) {
    where.category = domainSavingsCategoryToDb(filter.category);
  }
  if (filter?.isEmergencyFund !== undefined) {
    where.isEmergencyFund = filter.isEmergencyFund;
  }

  const [totalCount, dbRecords] = await Promise.all([
    prisma.savingsGoal.count({ where }),
    prisma.savingsGoal.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
    }),
  ]);

  return {
    data: dbRecords.map(mapSavingsGoalToDomain),
    pagination: buildPaginationMeta(totalCount, page, limit),
  };
}

/**
 * Fetches a single savings goal strictly scoped to the user.
 */
export async function getSavingsGoalById(
  userId: string,
  id: string
): Promise<DomainSavingsGoal> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'SavingsGoal');

  const record = await prisma.savingsGoal.findFirst({
    where: {
      id: safeId,
      userId: safeUserId,
    },
  });

  if (!record) {
    throw new RecordNotFoundError('SavingsGoal', safeId);
  }

  return mapSavingsGoalToDomain(record);
}

/**
 * Updates a savings goal with defensive field whitelisting and user isolation.
 */
export async function updateSavingsGoal(
  userId: string,
  id: string,
  input: UpdateSavingsGoalInput
): Promise<DomainSavingsGoal> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'SavingsGoal');

  // Verify ownership before modifying
  const existing = await prisma.savingsGoal.findFirst({
    where: {
      id: safeId,
      userId: safeUserId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new RecordNotFoundError('SavingsGoal', safeId);
  }

  const updateData: Prisma.SavingsGoalUpdateInput = {};

  if (input.name !== undefined) {
    if (typeof input.name !== 'string' || input.name.trim() === '') {
      throw new ValidationError('Savings goal name cannot be empty.', 'name', input.name);
    }
    updateData.name = input.name.trim().slice(0, 120);
  }

  if (input.category !== undefined) {
    updateData.category = domainSavingsCategoryToDb(input.category);
  }

  if (input.targetAmount !== undefined) {
    if (input.targetAmount === null) {
      updateData.targetAmount = null;
    } else {
      if (typeof input.targetAmount !== 'number' || !Number.isFinite(input.targetAmount) || input.targetAmount <= 0) {
        throw new ValidationError('targetAmount must be a positive finite number.', 'targetAmount', input.targetAmount);
      }
      updateData.targetAmount = safeNumberToDecimal(input.targetAmount, 'targetAmount');
    }
  }

  if (input.targetDate !== undefined) {
    updateData.targetDate = input.targetDate === null
      ? null
      : parseAndValidateDate(input.targetDate, 'targetDate');
  }

  if (input.isEmergencyFund !== undefined) {
    updateData.isEmergencyFund = Boolean(input.isEmergencyFund);
  }

  if (input.notes !== undefined) {
    updateData.notes = input.notes ? input.notes.trim() : null;
  }

  const updated = await prisma.savingsGoal.update({
    where: { id: safeId },
    data: updateData,
  });

  return mapSavingsGoalToDomain(updated);
}

/**
 * Deletes a savings goal atomically scoped to the user.
 * Associated SavingsRecord rows have their goalId set to null by database onDelete: SetNull.
 */
export async function deleteSavingsGoal(
  userId: string,
  id: string
): Promise<void> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'SavingsGoal');

  const result = await prisma.savingsGoal.deleteMany({
    where: {
      id: safeId,
      userId: safeUserId,
    },
  });

  verifyDeletionResult(result.count, 'SavingsGoal', safeId);
}

// ==============================================================================
// 4. Savings Record Repository Operations
// ==============================================================================

/**
 * Creates a new savings record scoped to the authenticated user.
 * Validates goal ownership if goalId is specified.
 */
export async function createSavingsRecord(
  userId: string,
  input: CreateSavingsRecordInput
): Promise<DomainSavingsRecord> {
  const safeUserId = validateUserId(userId);
  const validated = validateSavingsRecordInput(input);

  let verifiedGoalId: string | null = null;
  if (input.goalId !== undefined && input.goalId !== null && input.goalId.trim() !== '') {
    const goal = await verifySavingsGoalAccess(input.goalId, safeUserId);
    verifiedGoalId = goal.id;
  }

  const created = await prisma.savingsRecord.create({
    data: {
      userId: safeUserId,
      goalId: verifiedGoalId,
      amount: validated.amountDecimal,
      currency: validated.currency,
      category: domainSavingsCategoryToDb(validated.category),
      date: validated.date,
      periodYear: validated.periodYear,
      periodMonth: validated.periodMonth,
      notes: validated.notes,
    },
    include: {
      goal: {
        select: { name: true },
      },
    },
  });

  return mapSavingsRecordToDomain(created, created.goal?.name);
}

/**
 * Retrieves a paginated list of savings records for the user with deterministic ordering.
 */
export async function listSavingsRecords(
  userId: string,
  filter?: ListSavingsRecordFilter,
  pagination?: PaginationParams
): Promise<PaginatedResult<DomainSavingsRecord>> {
  const safeUserId = validateUserId(userId);
  const { page, limit, skip } = normalizePagination(pagination);

  const where: Prisma.SavingsRecordWhereInput = {
    userId: safeUserId,
  };

  if (filter?.goalId !== undefined) {
    where.goalId = filter.goalId;
  }
  if (filter?.category !== undefined) {
    where.category = domainSavingsCategoryToDb(filter.category);
  }
  if (filter?.periodYear !== undefined) {
    where.periodYear = filter.periodYear;
  }
  if (filter?.periodMonth !== undefined) {
    where.periodMonth = filter.periodMonth;
  }
  if (filter?.isEmergencyFund !== undefined) {
    where.goal = {
      isEmergencyFund: filter.isEmergencyFund,
    };
  }
  if (filter?.startDate || filter?.endDate) {
    where.date = {};
    if (filter.startDate) {
      where.date.gte = parseAndValidateDate(filter.startDate, 'filter.startDate');
    }
    if (filter.endDate) {
      where.date.lte = parseAndValidateDate(filter.endDate, 'filter.endDate');
    }
  }

  const [totalCount, dbRecords] = await Promise.all([
    prisma.savingsRecord.count({ where }),
    prisma.savingsRecord.findMany({
      where,
      skip,
      take: limit,
      include: {
        goal: {
          select: { name: true },
        },
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
    }),
  ]);

  type SavingsRecordWithGoal = Prisma.SavingsRecordGetPayload<{
    include: { goal: { select: { name: true } } };
  }>;

  return {
    data: (dbRecords as SavingsRecordWithGoal[]).map((r) =>
      mapSavingsRecordToDomain(r, r.goal?.name)
    ),
    pagination: buildPaginationMeta(totalCount, page, limit),
  };
}

/**
 * Retrieves a single savings record by ID strictly scoped to the user.
 */
export async function getSavingsRecordById(
  userId: string,
  id: string
): Promise<DomainSavingsRecord> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'SavingsRecord');

  const record = await prisma.savingsRecord.findFirst({
    where: {
      id: safeId,
      userId: safeUserId,
    },
    include: {
      goal: {
        select: { name: true },
      },
    },
  });

  if (!record) {
    throw new RecordNotFoundError('SavingsRecord', safeId);
  }

  return mapSavingsRecordToDomain(record, record.goal?.name);
}

/**
 * Updates a savings record with defensive field whitelisting and user isolation.
 */
export async function updateSavingsRecord(
  userId: string,
  id: string,
  input: UpdateSavingsRecordInput
): Promise<DomainSavingsRecord> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'SavingsRecord');

  // Verify ownership before modifying
  const existing = await prisma.savingsRecord.findFirst({
    where: {
      id: safeId,
      userId: safeUserId,
    },
    select: { id: true, goalId: true },
  });

  if (!existing) {
    throw new RecordNotFoundError('SavingsRecord', safeId);
  }

  const updateData: Prisma.SavingsRecordUpdateInput = {};

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

  if (input.category !== undefined) {
    updateData.category = domainSavingsCategoryToDb(input.category);
  }

  if (input.date !== undefined) {
    const date = parseAndValidateDate(input.date, 'date');
    updateData.date = date;
    if (input.periodYear === undefined) {
      updateData.periodYear = date.getUTCFullYear();
    }
    if (input.periodMonth === undefined) {
      updateData.periodMonth = date.getUTCMonth() + 1;
    }
  }

  if (input.periodYear !== undefined) {
    if (!Number.isInteger(input.periodYear) || input.periodYear < 1900 || input.periodYear > 2100) {
      throw new ValidationError('periodYear must be between 1900 and 2100.', 'periodYear', input.periodYear);
    }
    updateData.periodYear = input.periodYear;
  }

  if (input.periodMonth !== undefined) {
    if (!Number.isInteger(input.periodMonth) || input.periodMonth < 1 || input.periodMonth > 12) {
      throw new ValidationError('periodMonth must be between 1 and 12.', 'periodMonth', input.periodMonth);
    }
    updateData.periodMonth = input.periodMonth;
  }

  if (input.goalId !== undefined) {
    if (input.goalId === null || input.goalId.trim() === '') {
      updateData.goal = { disconnect: true };
    } else {
      const verifiedGoal = await verifySavingsGoalAccess(input.goalId, safeUserId);
      updateData.goal = { connect: { id: verifiedGoal.id } };
    }
  }

  if (input.notes !== undefined) {
    updateData.notes = input.notes ? input.notes.trim() : null;
  }

  const updated = await prisma.savingsRecord.update({
    where: { id: safeId },
    data: updateData,
    include: {
      goal: {
        select: { name: true },
      },
    },
  });

  return mapSavingsRecordToDomain(updated, updated.goal?.name);
}

/**
 * Deletes a savings record atomically scoped to the user.
 */
export async function deleteSavingsRecord(
  userId: string,
  id: string
): Promise<void> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'SavingsRecord');

  const result = await prisma.savingsRecord.deleteMany({
    where: {
      id: safeId,
      userId: safeUserId,
    },
  });

  verifyDeletionResult(result.count, 'SavingsRecord', safeId);
}
