import { prisma } from '../prisma';
import {
  domainExpenseTypeToDb,
  domainPaymentFrequencyToDb,
  mapExpenseRecordToDomain,
  safeNumberToDecimal,
} from '../mappers';
import {
  CategoryNotFoundError,
  RecordNotFoundError,
  ValidationError,
} from './errors';
import {
  buildPaginationMeta,
  normalizePagination,
  verifyDeletionResult,
  type PaginatedResult,
  type PaginationParams,
} from './types';
import { validateRecordId, validateUserId } from './salary';
import type {
  ExpenseRecord as DomainExpenseRecord,
  ExpenseType as DomainExpenseType,
  PaymentFrequency as DomainPaymentFrequency,
} from '@/types/financial';
import { CategoryType, Prisma } from '@prisma/client';

// ==============================================================================
// 1. Input Contracts
// ==============================================================================

export interface CreateExpenseInput {
  categoryId: string;
  amount: number;
  currency?: string;
  expenseType: DomainExpenseType;
  date: Date | string;
  description: string;
  periodYear?: number;
  periodMonth?: number;
  isRecurring?: boolean;
  recurringFrequency?: DomainPaymentFrequency | null;
  notes?: string | null;
}

export interface UpdateExpenseInput {
  categoryId?: string;
  amount?: number;
  currency?: string;
  expenseType?: DomainExpenseType;
  date?: Date | string;
  description?: string;
  periodYear?: number;
  periodMonth?: number;
  isRecurring?: boolean;
  recurringFrequency?: DomainPaymentFrequency | null;
  notes?: string | null;
}

export interface ListExpenseFilter {
  periodYear?: number;
  periodMonth?: number;
  categoryId?: string;
  expenseType?: DomainExpenseType;
  isRecurring?: boolean;
  startDate?: Date | string;
  endDate?: Date | string;
}

// ==============================================================================
// 2. Validation & Category Integrity Helpers
// ==============================================================================

function parseAndValidateDate(value: Date | string, fieldName: string): Date {
  const parsed = value instanceof Date ? value : new Date(value);
  if (isNaN(parsed.getTime())) {
    throw new ValidationError(`'${String(value)}' is not a valid date.`, fieldName, value);
  }
  return parsed;
}

/**
 * Builds the Prisma where filter for querying an authorized expense category.
 * Enforces in SQL that the category:
 * 1. Matches the requested ID (or slug for system categories fallback)
 * 2. Has CategoryType.EXPENSE
 * 3. EITHER belongs to the caller (userId === safeUserId) OR is a global system category (userId === null && isSystem === true)
 */
export function buildExpenseCategoryAccessFilter(
  categoryIdOrSlug: string,
  userId: string
): Prisma.CategoryWhereInput {
  return {
    type: CategoryType.EXPENSE,
    AND: [
      {
        OR: [
          { id: categoryIdOrSlug },
          { slug: categoryIdOrSlug, isSystem: true, userId: null },
        ],
      },
      {
        OR: [
          { userId },
          { isSystem: true, userId: null },
        ],
      },
    ],
  };
}

/**
 * Verifies category existence, category type, and user access authorization in a single SQL query.
 *
 * Security Requirements:
 * - Direct SQL-level filtering by CategoryType.EXPENSE, ID/system slug, and ownership.
 * - Rejects non-existent, cross-tenant, or non-expense categories uniformly with CategoryNotFoundError.
 * - Prevents category enumeration oracles by never revealing whether an unauthorized category ID exists.
 * - Never loads unauthorized category data into application memory.
 */
export async function verifyExpenseCategoryAccess(
  categoryId: string,
  userId: string
): Promise<{ id: string; slug: string; name: string }> {
  if (typeof categoryId !== 'string' || categoryId.trim() === '') {
    throw new ValidationError('A valid, non-empty categoryId is required.', 'categoryId', categoryId);
  }
  const cleanId = categoryId.trim();

  const where = buildExpenseCategoryAccessFilter(cleanId, userId);

  const category = await prisma.category.findFirst({
    where,
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });

  if (!category) {
    throw new CategoryNotFoundError(cleanId);
  }

  return { id: category.id, slug: category.slug, name: category.name };
}

export function validateExpenseInput(input: CreateExpenseInput): {
  amountDecimal: Prisma.Decimal;
  currency: string;
  expenseType: DomainExpenseType;
  date: Date;
  periodYear: number;
  periodMonth: number;
  description: string;
  isRecurring: boolean;
  recurringFrequency: DomainPaymentFrequency | null;
  notes: string | null;
} {
  // 1. Amount
  if (typeof input.amount !== 'number' || !Number.isFinite(input.amount)) {
    throw new ValidationError('Expense amount must be a finite numeric value.', 'amount', input.amount);
  }
  if (input.amount <= 0) {
    throw new ValidationError('Expense amount must be greater than zero.', 'amount', input.amount);
  }
  const amountDecimal = safeNumberToDecimal(input.amount, 'amount');

  // 2. Currency
  let currency = 'PKR';
  if (input.currency !== undefined && input.currency !== null) {
    const trimmed = input.currency.trim().toUpperCase();
    if (trimmed.length !== 3) {
      throw new ValidationError('Currency must be a 3-letter ISO code.', 'currency', input.currency);
    }
    currency = trimmed;
  }

  // 3. Expense Type
  if (input.expenseType !== 'fixed' && input.expenseType !== 'variable') {
    throw new ValidationError(
      `Invalid expenseType '${input.expenseType}'. Must be 'fixed' or 'variable'.`,
      'expenseType',
      input.expenseType
    );
  }

  // 4. Date & Partition Periods
  const date = parseAndValidateDate(input.date, 'date');
  const periodYear = input.periodYear ?? date.getUTCFullYear();
  const periodMonth = input.periodMonth ?? (date.getUTCMonth() + 1);

  if (!Number.isInteger(periodMonth) || periodMonth < 1 || periodMonth > 12) {
    throw new ValidationError('periodMonth must be between 1 and 12.', 'periodMonth', periodMonth);
  }
  if (!Number.isInteger(periodYear) || periodYear < 1900 || periodYear > 2100) {
    throw new ValidationError('periodYear must be between 1900 and 2100.', 'periodYear', periodYear);
  }

  // 5. Description
  if (typeof input.description !== 'string' || input.description.trim() === '') {
    throw new ValidationError('Expense description is required.', 'description', input.description);
  }
  const description = input.description.trim().slice(0, 255);

  // 6. Recurring options
  const isRecurring = Boolean(input.isRecurring);
  let recurringFrequency: DomainPaymentFrequency | null = null;
  if (input.recurringFrequency) {
    recurringFrequency = input.recurringFrequency;
  }

  // 7. Notes
  const notes = input.notes ? input.notes.trim() : null;

  return {
    amountDecimal,
    currency,
    expenseType: input.expenseType,
    date,
    periodYear,
    periodMonth,
    description,
    isRecurring,
    recurringFrequency,
    notes,
  };
}

// ==============================================================================
// 3. Repository Implementation
// ==============================================================================

/**
 * Creates a new expense record with verified user ownership and category authorization.
 */
export async function createExpense(
  userId: string,
  input: CreateExpenseInput
): Promise<DomainExpenseRecord> {
  const safeUserId = validateUserId(userId);
  const validated = validateExpenseInput(input);

  // Verify and resolve authorized category ID
  const category = await verifyExpenseCategoryAccess(input.categoryId, safeUserId);

  const created = await prisma.expense.create({
    data: {
      userId: safeUserId,
      categoryId: category.id,
      amount: validated.amountDecimal,
      currency: validated.currency,
      expenseType: domainExpenseTypeToDb(validated.expenseType),
      date: validated.date,
      periodYear: validated.periodYear,
      periodMonth: validated.periodMonth,
      description: validated.description,
      isRecurring: validated.isRecurring,
      recurringFrequency: validated.recurringFrequency
        ? domainPaymentFrequencyToDb(validated.recurringFrequency)
        : null,
      notes: validated.notes,
    },
    include: {
      category: {
        select: { slug: true },
      },
    },
  });

  return mapExpenseRecordToDomain(created, created.category.slug);
}

/**
 * Retrieves a paginated list of expenses for the user with deterministic ordering.
 */
export async function listExpenses(
  userId: string,
  filter?: ListExpenseFilter,
  pagination?: PaginationParams
): Promise<PaginatedResult<DomainExpenseRecord>> {
  const safeUserId = validateUserId(userId);
  const { page, limit, skip } = normalizePagination(pagination);

  const where: Prisma.ExpenseWhereInput = {
    userId: safeUserId,
  };

  if (filter?.periodYear !== undefined) {
    where.periodYear = filter.periodYear;
  }
  if (filter?.periodMonth !== undefined) {
    where.periodMonth = filter.periodMonth;
  }
  if (filter?.categoryId !== undefined) {
    where.categoryId = filter.categoryId;
  }
  if (filter?.expenseType !== undefined) {
    where.expenseType = domainExpenseTypeToDb(filter.expenseType);
  }
  if (filter?.isRecurring !== undefined) {
    where.isRecurring = filter.isRecurring;
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
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: {
          select: { slug: true },
        },
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
    }),
  ]);

  type ExpenseWithCategorySlug = Prisma.ExpenseGetPayload<{
    include: { category: { select: { slug: true } } };
  }>;

  return {
    data: (dbRecords as ExpenseWithCategorySlug[]).map((r) =>
      mapExpenseRecordToDomain(r, r.category.slug)
    ),
    pagination: buildPaginationMeta(totalCount, page, limit),
  };
}

/**
 * Retrieves a single expense record by ID, enforcing user isolation.
 */
export async function getExpenseById(
  userId: string,
  id: string
): Promise<DomainExpenseRecord> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'Expense');

  const record = await prisma.expense.findFirst({
    where: {
      id: safeId,
      userId: safeUserId,
    },
    include: {
      category: {
        select: { slug: true },
      },
    },
  });

  if (!record) {
    throw new RecordNotFoundError('Expense', safeId);
  }

  return mapExpenseRecordToDomain(record, record.category.slug);
}

/**
 * Updates an expense record. Whitelists updateable fields and verifies category access
 * if a new categoryId is supplied.
 */
export async function updateExpense(
  userId: string,
  id: string,
  input: UpdateExpenseInput
): Promise<DomainExpenseRecord> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'Expense');

  // Verify ownership before modifying
  const existing = await prisma.expense.findFirst({
    where: {
      id: safeId,
      userId: safeUserId,
    },
    select: { id: true, categoryId: true },
  });

  if (!existing) {
    throw new RecordNotFoundError('Expense', safeId);
  }

  const updateData: Prisma.ExpenseUpdateInput = {};

  if (input.categoryId !== undefined) {
    const verifiedCat = await verifyExpenseCategoryAccess(input.categoryId, safeUserId);
    updateData.category = {
      connect: { id: verifiedCat.id },
    };
  }

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

  if (input.expenseType !== undefined) {
    if (input.expenseType !== 'fixed' && input.expenseType !== 'variable') {
      throw new ValidationError('expenseType must be fixed or variable.', 'expenseType', input.expenseType);
    }
    updateData.expenseType = domainExpenseTypeToDb(input.expenseType);
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

  if (input.description !== undefined) {
    if (typeof input.description !== 'string' || input.description.trim() === '') {
      throw new ValidationError('description cannot be empty.', 'description', input.description);
    }
    updateData.description = input.description.trim().slice(0, 255);
  }

  if (input.isRecurring !== undefined) {
    updateData.isRecurring = Boolean(input.isRecurring);
  }

  if (input.recurringFrequency !== undefined) {
    updateData.recurringFrequency = input.recurringFrequency
      ? domainPaymentFrequencyToDb(input.recurringFrequency)
      : null;
  }

  if (input.notes !== undefined) {
    updateData.notes = input.notes ? input.notes.trim() : null;
  }

  const updated = await prisma.expense.update({
    where: { id: safeId },
    data: updateData,
    include: {
      category: {
        select: { slug: true },
      },
    },
  });

  return mapExpenseRecordToDomain(updated, updated.category.slug);
}

/**
 * Deletes an expense record, atomically scoped by both record ID and user ID.
 * Uses deleteMany to execute a single atomic SQL statement:
 * DELETE FROM expenses WHERE id = ? AND user_id = ?
 */
export async function deleteExpense(
  userId: string,
  id: string
): Promise<void> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'Expense');

  const result = await prisma.expense.deleteMany({
    where: {
      id: safeId,
      userId: safeUserId,
    },
  });

  verifyDeletionResult(result.count, 'Expense', safeId);
}
