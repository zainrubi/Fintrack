import { prisma } from '../prisma';
import {
  domainInsuranceCategoryToDb,
  domainInsuranceFrequencyToDb,
  mapInsurancePaymentToDomain,
  mapInsurancePolicyToDomain,
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
  InsurancePolicy as DomainInsurancePolicy,
  InsurancePayment as DomainInsurancePayment,
  InsuranceCategory as DomainInsuranceCategory,
  InsuranceFrequency as DomainInsuranceFrequency,
} from '@/types/financial';
import { InsuranceCategory as DbInsuranceCategory, Prisma } from '@prisma/client';

// ==============================================================================
// 1. Input Contracts
// ==============================================================================

export interface CreateInsurancePolicyInput {
  policyName: string;
  policyNumber?: string | null;
  provider?: string | null;
  category: DomainInsuranceCategory;
  premiumAmount: number;
  currency?: string;
  frequency?: DomainInsuranceFrequency;
  startDate: Date | string;
  renewalDate?: Date | string | null;
  isActive?: boolean;
  notes?: string | null;
}

export interface UpdateInsurancePolicyInput {
  policyName?: string;
  policyNumber?: string | null;
  provider?: string | null;
  category?: DomainInsuranceCategory;
  premiumAmount?: number;
  currency?: string;
  frequency?: DomainInsuranceFrequency;
  startDate?: Date | string;
  renewalDate?: Date | string | null;
  isActive?: boolean;
  notes?: string | null;
}

export interface ListInsurancePolicyFilter {
  category?: DomainInsuranceCategory;
  frequency?: DomainInsuranceFrequency;
  isActive?: boolean;
}

export interface CreateInsurancePaymentInput {
  policyId: string;
  amount: number;
  currency?: string;
  paymentDate: Date | string;
  periodYear?: number;
  periodMonth?: number;
  notes?: string | null;
}

export interface UpdateInsurancePaymentInput {
  policyId?: string;
  amount?: number;
  currency?: string;
  paymentDate?: Date | string;
  periodYear?: number;
  periodMonth?: number;
  notes?: string | null;
}

export interface ListInsurancePaymentFilter {
  policyId?: string;
  category?: DomainInsuranceCategory;
  periodYear?: number;
  periodMonth?: number;
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
 * Validates and sanitizes input for creating an InsurancePolicy.
 */
export function validateInsurancePolicyInput(input: CreateInsurancePolicyInput): {
  policyName: string;
  policyNumber: string | null;
  provider: string | null;
  category: DomainInsuranceCategory;
  premiumAmountDecimal: Prisma.Decimal;
  currency: string;
  frequency: DomainInsuranceFrequency;
  startDate: Date;
  renewalDate: Date | null;
  isActive: boolean;
  notes: string | null;
} {
  // 1. Policy Name
  if (typeof input.policyName !== 'string' || input.policyName.trim() === '') {
    throw new ValidationError('Insurance policy name is required.', 'policyName', input.policyName);
  }
  const policyName = input.policyName.trim().slice(0, 150);

  // 2. Policy Number & Provider
  const policyNumber = input.policyNumber ? input.policyNumber.trim().slice(0, 100) : null;
  const provider = input.provider ? input.provider.trim().slice(0, 150) : null;

  // 3. Category
  if (!input.category) {
    throw new ValidationError('Insurance category is required.', 'category', input.category);
  }
  const category = input.category;

  // 4. Premium Amount
  if (typeof input.premiumAmount !== 'number' || !Number.isFinite(input.premiumAmount)) {
    throw new ValidationError('premiumAmount must be a finite numeric value.', 'premiumAmount', input.premiumAmount);
  }
  if (input.premiumAmount <= 0) {
    throw new ValidationError('premiumAmount must be greater than zero.', 'premiumAmount', input.premiumAmount);
  }
  const premiumAmountDecimal = safeNumberToDecimal(input.premiumAmount, 'premiumAmount');

  // 5. Currency
  let currency = 'PKR';
  if (input.currency !== undefined && input.currency !== null) {
    const trimmed = input.currency.trim().toUpperCase();
    if (trimmed.length !== 3) {
      throw new ValidationError('Currency must be a 3-letter ISO code.', 'currency', input.currency);
    }
    currency = trimmed;
  }

  // 6. Frequency
  const frequency = input.frequency ?? 'annually';

  // 7. Dates
  const startDate = parseAndValidateDate(input.startDate, 'startDate');
  let renewalDate: Date | null = null;
  if (input.renewalDate !== undefined && input.renewalDate !== null) {
    renewalDate = parseAndValidateDate(input.renewalDate, 'renewalDate');
  }

  // 8. Active flag
  const isActive = input.isActive !== undefined ? Boolean(input.isActive) : true;

  // 9. Notes
  const notes = input.notes ? input.notes.trim() : null;

  return {
    policyName,
    policyNumber,
    provider,
    category,
    premiumAmountDecimal,
    currency,
    frequency,
    startDate,
    renewalDate,
    isActive,
    notes,
  };
}

/**
 * Validates and sanitizes input for creating an InsurancePayment.
 */
export function validateInsurancePaymentInput(input: CreateInsurancePaymentInput): {
  policyId: string;
  amountDecimal: Prisma.Decimal;
  currency: string;
  paymentDate: Date;
  periodYear: number;
  periodMonth: number;
  notes: string | null;
} {
  // 1. Policy ID
  const policyId = validateRecordId(input.policyId, 'InsurancePolicy');

  // 2. Amount
  if (typeof input.amount !== 'number' || !Number.isFinite(input.amount)) {
    throw new ValidationError('Payment amount must be a finite numeric value.', 'amount', input.amount);
  }
  if (input.amount <= 0) {
    throw new ValidationError('Payment amount must be greater than zero.', 'amount', input.amount);
  }
  const amountDecimal = safeNumberToDecimal(input.amount, 'amount');

  // 3. Currency
  let currency = 'PKR';
  if (input.currency !== undefined && input.currency !== null) {
    const trimmed = input.currency.trim().toUpperCase();
    if (trimmed.length !== 3) {
      throw new ValidationError('Currency must be a 3-letter ISO code.', 'currency', input.currency);
    }
    currency = trimmed;
  }

  // 4. Payment Date & Period Derivation
  const paymentDate = parseAndValidateDate(input.paymentDate, 'paymentDate');
  const periodYear = input.periodYear ?? paymentDate.getUTCFullYear();
  const periodMonth = input.periodMonth ?? (paymentDate.getUTCMonth() + 1);

  if (!Number.isInteger(periodMonth) || periodMonth < 1 || periodMonth > 12) {
    throw new ValidationError('periodMonth must be between 1 and 12.', 'periodMonth', periodMonth);
  }
  if (!Number.isInteger(periodYear) || periodYear < 1900 || periodYear > 2100) {
    throw new ValidationError('periodYear must be between 1900 and 2100.', 'periodYear', periodYear);
  }

  // 5. Notes
  const notes = input.notes ? input.notes.trim() : null;

  return {
    policyId,
    amountDecimal,
    currency,
    paymentDate,
    periodYear,
    periodMonth,
    notes,
  };
}

/**
 * Verifies that an insurance policy belongs to the specified user.
 * Prevents linking payments to unauthorized or non-existent policies.
 * Throws RecordNotFoundError uniformly to eliminate enumeration oracles.
 */
export async function verifyInsurancePolicyAccess(
  policyId: string,
  userId: string
): Promise<{ id: string; policyName: string; category: DbInsuranceCategory }> {
  const safePolicyId = validateRecordId(policyId, 'InsurancePolicy');

  const policy = await prisma.insurancePolicy.findFirst({
    where: {
      id: safePolicyId,
      userId,
    },
    select: {
      id: true,
      policyName: true,
      category: true,
    },
  });

  if (!policy) {
    throw new RecordNotFoundError('InsurancePolicy', safePolicyId);
  }

  return policy;
}

// ==============================================================================
// 3. Insurance Policy Operations
// ==============================================================================

/**
 * Creates a new insurance policy scoped to the authenticated user.
 */
export async function createInsurancePolicy(
  userId: string,
  input: CreateInsurancePolicyInput
): Promise<DomainInsurancePolicy> {
  const safeUserId = validateUserId(userId);
  const validated = validateInsurancePolicyInput(input);

  const created = await prisma.insurancePolicy.create({
    data: {
      userId: safeUserId,
      policyName: validated.policyName,
      policyNumber: validated.policyNumber,
      provider: validated.provider,
      category: domainInsuranceCategoryToDb(validated.category),
      premiumAmount: validated.premiumAmountDecimal,
      currency: validated.currency,
      frequency: domainInsuranceFrequencyToDb(validated.frequency),
      startDate: validated.startDate,
      renewalDate: validated.renewalDate,
      isActive: validated.isActive,
      notes: validated.notes,
    },
  });

  return mapInsurancePolicyToDomain(created);
}

/**
 * Retrieves a paginated list of insurance policies for the user with deterministic ordering.
 */
export async function listInsurancePolicies(
  userId: string,
  filter?: ListInsurancePolicyFilter,
  pagination?: PaginationParams
): Promise<PaginatedResult<DomainInsurancePolicy>> {
  const safeUserId = validateUserId(userId);
  const { page, limit, skip } = normalizePagination(pagination);

  const where: Prisma.InsurancePolicyWhereInput = {
    userId: safeUserId,
  };

  if (filter?.category !== undefined) {
    where.category = domainInsuranceCategoryToDb(filter.category);
  }
  if (filter?.frequency !== undefined) {
    where.frequency = domainInsuranceFrequencyToDb(filter.frequency);
  }
  if (filter?.isActive !== undefined) {
    where.isActive = filter.isActive;
  }

  const [totalCount, dbRecords] = await Promise.all([
    prisma.insurancePolicy.count({ where }),
    prisma.insurancePolicy.findMany({
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
    data: dbRecords.map(mapInsurancePolicyToDomain),
    pagination: buildPaginationMeta(totalCount, page, limit),
  };
}

/**
 * Fetches a single insurance policy strictly scoped to the user.
 */
export async function getInsurancePolicyById(
  userId: string,
  id: string
): Promise<DomainInsurancePolicy> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'InsurancePolicy');

  const record = await prisma.insurancePolicy.findFirst({
    where: {
      id: safeId,
      userId: safeUserId,
    },
  });

  if (!record) {
    throw new RecordNotFoundError('InsurancePolicy', safeId);
  }

  return mapInsurancePolicyToDomain(record);
}

/**
 * Updates an insurance policy with defensive field whitelisting and user isolation.
 */
export async function updateInsurancePolicy(
  userId: string,
  id: string,
  input: UpdateInsurancePolicyInput
): Promise<DomainInsurancePolicy> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'InsurancePolicy');

  // Verify ownership before modifying
  const existing = await prisma.insurancePolicy.findFirst({
    where: {
      id: safeId,
      userId: safeUserId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new RecordNotFoundError('InsurancePolicy', safeId);
  }

  const updateData: Prisma.InsurancePolicyUpdateInput = {};

  if (input.policyName !== undefined) {
    if (typeof input.policyName !== 'string' || input.policyName.trim() === '') {
      throw new ValidationError('Insurance policy name cannot be empty.', 'policyName', input.policyName);
    }
    updateData.policyName = input.policyName.trim().slice(0, 150);
  }

  if (input.policyNumber !== undefined) {
    updateData.policyNumber = input.policyNumber ? input.policyNumber.trim().slice(0, 100) : null;
  }

  if (input.provider !== undefined) {
    updateData.provider = input.provider ? input.provider.trim().slice(0, 150) : null;
  }

  if (input.category !== undefined) {
    updateData.category = domainInsuranceCategoryToDb(input.category);
  }

  if (input.premiumAmount !== undefined) {
    if (typeof input.premiumAmount !== 'number' || !Number.isFinite(input.premiumAmount) || input.premiumAmount <= 0) {
      throw new ValidationError('premiumAmount must be a positive finite number.', 'premiumAmount', input.premiumAmount);
    }
    updateData.premiumAmount = safeNumberToDecimal(input.premiumAmount, 'premiumAmount');
  }

  if (input.currency !== undefined) {
    const trimmed = input.currency.trim().toUpperCase();
    if (trimmed.length !== 3) {
      throw new ValidationError('Currency must be a 3-letter ISO code.', 'currency', input.currency);
    }
    updateData.currency = trimmed;
  }

  if (input.frequency !== undefined) {
    updateData.frequency = domainInsuranceFrequencyToDb(input.frequency);
  }

  if (input.startDate !== undefined) {
    updateData.startDate = parseAndValidateDate(input.startDate, 'startDate');
  }

  if (input.renewalDate !== undefined) {
    updateData.renewalDate = input.renewalDate === null
      ? null
      : parseAndValidateDate(input.renewalDate, 'renewalDate');
  }

  if (input.isActive !== undefined) {
    updateData.isActive = Boolean(input.isActive);
  }

  if (input.notes !== undefined) {
    updateData.notes = input.notes ? input.notes.trim() : null;
  }

  const updated = await prisma.insurancePolicy.update({
    where: { id: safeId },
    data: updateData,
  });

  return mapInsurancePolicyToDomain(updated);
}

/**
 * Deletes an insurance policy atomically scoped to the user.
 * Linked InsurancePayment rows cascade-delete via database onDelete: Cascade.
 */
export async function deleteInsurancePolicy(
  userId: string,
  id: string
): Promise<void> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'InsurancePolicy');

  const result = await prisma.insurancePolicy.deleteMany({
    where: {
      id: safeId,
      userId: safeUserId,
    },
  });

  verifyDeletionResult(result.count, 'InsurancePolicy', safeId);
}

// ==============================================================================
// 4. Insurance Payment Operations
// ==============================================================================

/**
 * Creates a new insurance payment record scoped to the authenticated user.
 * Validates policy ownership before connecting.
 */
export async function createInsurancePayment(
  userId: string,
  input: CreateInsurancePaymentInput
): Promise<DomainInsurancePayment> {
  const safeUserId = validateUserId(userId);
  const validated = validateInsurancePaymentInput(input);

  // Validate policy access
  const policy = await verifyInsurancePolicyAccess(validated.policyId, safeUserId);

  const created = await prisma.insurancePayment.create({
    data: {
      userId: safeUserId,
      policyId: policy.id,
      amount: validated.amountDecimal,
      currency: validated.currency,
      paymentDate: validated.paymentDate,
      periodYear: validated.periodYear,
      periodMonth: validated.periodMonth,
      notes: validated.notes,
    },
    include: {
      policy: {
        select: { policyName: true, category: true },
      },
    },
  });

  return mapInsurancePaymentToDomain(created, created.policy);
}

/**
 * Retrieves a paginated list of insurance payments for the user with deterministic ordering.
 */
export async function listInsurancePayments(
  userId: string,
  filter?: ListInsurancePaymentFilter,
  pagination?: PaginationParams
): Promise<PaginatedResult<DomainInsurancePayment>> {
  const safeUserId = validateUserId(userId);
  const { page, limit, skip } = normalizePagination(pagination);

  const where: Prisma.InsurancePaymentWhereInput = {
    userId: safeUserId,
  };

  if (filter?.policyId !== undefined) {
    where.policyId = filter.policyId;
  }
  if (filter?.category !== undefined) {
    where.policy = {
      category: domainInsuranceCategoryToDb(filter.category),
    };
  }
  if (filter?.periodYear !== undefined) {
    where.periodYear = filter.periodYear;
  }
  if (filter?.periodMonth !== undefined) {
    where.periodMonth = filter.periodMonth;
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
    prisma.insurancePayment.count({ where }),
    prisma.insurancePayment.findMany({
      where,
      skip,
      take: limit,
      include: {
        policy: {
          select: { policyName: true, category: true },
        },
      },
      orderBy: [
        { paymentDate: 'desc' },
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
    }),
  ]);

  type InsurancePaymentWithPolicy = Prisma.InsurancePaymentGetPayload<{
    include: { policy: { select: { policyName: true, category: true } } };
  }>;

  return {
    data: (dbRecords as InsurancePaymentWithPolicy[]).map((r) =>
      mapInsurancePaymentToDomain(r, r.policy)
    ),
    pagination: buildPaginationMeta(totalCount, page, limit),
  };
}

/**
 * Retrieves a single insurance payment by ID strictly scoped to the user.
 */
export async function getInsurancePaymentById(
  userId: string,
  id: string
): Promise<DomainInsurancePayment> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'InsurancePayment');

  const record = await prisma.insurancePayment.findFirst({
    where: {
      id: safeId,
      userId: safeUserId,
    },
    include: {
      policy: {
        select: { policyName: true, category: true },
      },
    },
  });

  if (!record) {
    throw new RecordNotFoundError('InsurancePayment', safeId);
  }

  return mapInsurancePaymentToDomain(record, record.policy);
}

/**
 * Updates an insurance payment with defensive field whitelisting and user isolation.
 */
export async function updateInsurancePayment(
  userId: string,
  id: string,
  input: UpdateInsurancePaymentInput
): Promise<DomainInsurancePayment> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'InsurancePayment');

  // Verify ownership before modifying
  const existing = await prisma.insurancePayment.findFirst({
    where: {
      id: safeId,
      userId: safeUserId,
    },
    select: { id: true, policyId: true },
  });

  if (!existing) {
    throw new RecordNotFoundError('InsurancePayment', safeId);
  }

  const updateData: Prisma.InsurancePaymentUpdateInput = {};

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

  if (input.paymentDate !== undefined) {
    const paymentDate = parseAndValidateDate(input.paymentDate, 'paymentDate');
    updateData.paymentDate = paymentDate;
    if (input.periodYear === undefined) {
      updateData.periodYear = paymentDate.getUTCFullYear();
    }
    if (input.periodMonth === undefined) {
      updateData.periodMonth = paymentDate.getUTCMonth() + 1;
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

  if (input.policyId !== undefined) {
    const verifiedPolicy = await verifyInsurancePolicyAccess(input.policyId, safeUserId);
    updateData.policy = { connect: { id: verifiedPolicy.id } };
  }

  if (input.notes !== undefined) {
    updateData.notes = input.notes ? input.notes.trim() : null;
  }

  const updated = await prisma.insurancePayment.update({
    where: { id: safeId },
    data: updateData,
    include: {
      policy: {
        select: { policyName: true, category: true },
      },
    },
  });

  return mapInsurancePaymentToDomain(updated, updated.policy);
}

/**
 * Deletes an insurance payment atomically scoped to the user.
 */
export async function deleteInsurancePayment(
  userId: string,
  id: string
): Promise<void> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'InsurancePayment');

  const result = await prisma.insurancePayment.deleteMany({
    where: {
      id: safeId,
      userId: safeUserId,
    },
  });

  verifyDeletionResult(result.count, 'InsurancePayment', safeId);
}
