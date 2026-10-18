import { prisma } from '../prisma';
import {
  domainInvestmentTypeToDb,
  mapInvestmentAssetToDomain,
  mapInvestmentRecordToDomain,
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
  InvestmentAsset as DomainInvestmentAsset,
  InvestmentRecord as DomainInvestmentRecord,
  InvestmentType as DomainInvestmentType,
} from '@/types/financial';
import { InvestmentType as DbInvestmentType, Prisma } from '@prisma/client';

// ==============================================================================
// 1. Input Contracts
// ==============================================================================

export interface CreateInvestmentAssetInput {
  assetName: string;
  investmentType?: DomainInvestmentType;
  institutionOrPlatform?: string | null;
  notes?: string | null;
}

export interface UpdateInvestmentAssetInput {
  assetName?: string;
  investmentType?: DomainInvestmentType;
  institutionOrPlatform?: string | null;
  notes?: string | null;
}

export interface ListInvestmentAssetFilter {
  investmentType?: DomainInvestmentType;
}

export interface CreateInvestmentRecordInput {
  amount: number;
  currency?: string;
  investmentType?: DomainInvestmentType;
  date: Date | string;
  periodYear?: number;
  periodMonth?: number;
  assetId?: string | null;
  notes?: string | null;
}

export interface UpdateInvestmentRecordInput {
  amount?: number;
  currency?: string;
  investmentType?: DomainInvestmentType;
  date?: Date | string;
  periodYear?: number;
  periodMonth?: number;
  assetId?: string | null;
  notes?: string | null;
}

export interface ListInvestmentRecordFilter {
  assetId?: string;
  investmentType?: DomainInvestmentType;
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
 * Validates and sanitizes input for creating an InvestmentAsset.
 */
export function validateInvestmentAssetInput(input: CreateInvestmentAssetInput): {
  assetName: string;
  investmentType: DomainInvestmentType;
  institutionOrPlatform: string | null;
  notes: string | null;
} {
  // 1. Asset Name
  if (typeof input.assetName !== 'string' || input.assetName.trim() === '') {
    throw new ValidationError('Investment asset name is required.', 'assetName', input.assetName);
  }
  const assetName = input.assetName.trim().slice(0, 150);

  // 2. Investment Type
  const investmentType = input.investmentType ?? 'other';

  // 3. Institution or Platform
  const institutionOrPlatform = input.institutionOrPlatform
    ? input.institutionOrPlatform.trim().slice(0, 150)
    : null;

  // 4. Notes
  const notes = input.notes ? input.notes.trim() : null;

  return {
    assetName,
    investmentType,
    institutionOrPlatform,
    notes,
  };
}

/**
 * Validates and sanitizes input for creating an InvestmentRecord.
 */
export function validateInvestmentRecordInput(input: CreateInvestmentRecordInput): {
  amountDecimal: Prisma.Decimal;
  currency: string;
  investmentType: DomainInvestmentType;
  date: Date;
  periodYear: number;
  periodMonth: number;
  notes: string | null;
} {
  // 1. Amount validation
  if (typeof input.amount !== 'number' || !Number.isFinite(input.amount)) {
    throw new ValidationError('Investment amount must be a finite numeric value.', 'amount', input.amount);
  }
  if (input.amount <= 0) {
    throw new ValidationError('Investment amount must be greater than zero.', 'amount', input.amount);
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

  // 3. Investment Type
  const investmentType = input.investmentType ?? 'other';

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
    investmentType,
    date,
    periodYear,
    periodMonth,
    notes,
  };
}

/**
 * Verifies that an investment asset exists and belongs to the specified user.
 * Prevents linking records to unauthorized or non-existent assets.
 * Throws RecordNotFoundError uniformly to prevent information leakage.
 */
export async function verifyInvestmentAssetAccess(
  assetId: string,
  userId: string
): Promise<{ id: string; assetName: string; investmentType: DbInvestmentType; institutionOrPlatform: string | null }> {
  const safeAssetId = validateRecordId(assetId, 'InvestmentAsset');

  const asset = await prisma.investmentAsset.findFirst({
    where: {
      id: safeAssetId,
      userId,
    },
    select: {
      id: true,
      assetName: true,
      investmentType: true,
      institutionOrPlatform: true,
    },
  });

  if (!asset) {
    throw new RecordNotFoundError('InvestmentAsset', safeAssetId);
  }

  return asset;
}

// ==============================================================================
// 3. Investment Asset Operations
// ==============================================================================

/**
 * Creates a new investment asset scoped to the user.
 */
export async function createInvestmentAsset(
  userId: string,
  input: CreateInvestmentAssetInput
): Promise<DomainInvestmentAsset> {
  const safeUserId = validateUserId(userId);
  const validated = validateInvestmentAssetInput(input);

  const created = await prisma.investmentAsset.create({
    data: {
      userId: safeUserId,
      assetName: validated.assetName,
      investmentType: domainInvestmentTypeToDb(validated.investmentType),
      institutionOrPlatform: validated.institutionOrPlatform,
      notes: validated.notes,
    },
  });

  return mapInvestmentAssetToDomain(created);
}

/**
 * Retrieves a paginated list of investment assets for the user with deterministic ordering.
 */
export async function listInvestmentAssets(
  userId: string,
  filter?: ListInvestmentAssetFilter,
  pagination?: PaginationParams
): Promise<PaginatedResult<DomainInvestmentAsset>> {
  const safeUserId = validateUserId(userId);
  const { page, limit, skip } = normalizePagination(pagination);

  const where: Prisma.InvestmentAssetWhereInput = {
    userId: safeUserId,
  };

  if (filter?.investmentType !== undefined) {
    where.investmentType = domainInvestmentTypeToDb(filter.investmentType);
  }

  const [totalCount, dbRecords] = await Promise.all([
    prisma.investmentAsset.count({ where }),
    prisma.investmentAsset.findMany({
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
    data: dbRecords.map(mapInvestmentAssetToDomain),
    pagination: buildPaginationMeta(totalCount, page, limit),
  };
}

/**
 * Fetches a single investment asset strictly scoped to the user.
 */
export async function getInvestmentAssetById(
  userId: string,
  id: string
): Promise<DomainInvestmentAsset> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'InvestmentAsset');

  const record = await prisma.investmentAsset.findFirst({
    where: {
      id: safeId,
      userId: safeUserId,
    },
  });

  if (!record) {
    throw new RecordNotFoundError('InvestmentAsset', safeId);
  }

  return mapInvestmentAssetToDomain(record);
}

/**
 * Updates an investment asset with defensive field whitelisting and user isolation.
 */
export async function updateInvestmentAsset(
  userId: string,
  id: string,
  input: UpdateInvestmentAssetInput
): Promise<DomainInvestmentAsset> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'InvestmentAsset');

  // Verify ownership before modifying
  const existing = await prisma.investmentAsset.findFirst({
    where: {
      id: safeId,
      userId: safeUserId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new RecordNotFoundError('InvestmentAsset', safeId);
  }

  const updateData: Prisma.InvestmentAssetUpdateInput = {};

  if (input.assetName !== undefined) {
    if (typeof input.assetName !== 'string' || input.assetName.trim() === '') {
      throw new ValidationError('Investment asset name cannot be empty.', 'assetName', input.assetName);
    }
    updateData.assetName = input.assetName.trim().slice(0, 150);
  }

  if (input.investmentType !== undefined) {
    updateData.investmentType = domainInvestmentTypeToDb(input.investmentType);
  }

  if (input.institutionOrPlatform !== undefined) {
    updateData.institutionOrPlatform = input.institutionOrPlatform
      ? input.institutionOrPlatform.trim().slice(0, 150)
      : null;
  }

  if (input.notes !== undefined) {
    updateData.notes = input.notes ? input.notes.trim() : null;
  }

  const updated = await prisma.investmentAsset.update({
    where: { id: safeId },
    data: updateData,
  });

  return mapInvestmentAssetToDomain(updated);
}

/**
 * Deletes an investment asset atomically scoped to the user.
 * Linked InvestmentRecord rows have their assetId set to null by database onDelete: SetNull.
 */
export async function deleteInvestmentAsset(
  userId: string,
  id: string
): Promise<void> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'InvestmentAsset');

  const result = await prisma.investmentAsset.deleteMany({
    where: {
      id: safeId,
      userId: safeUserId,
    },
  });

  verifyDeletionResult(result.count, 'InvestmentAsset', safeId);
}

// ==============================================================================
// 4. Investment Record Operations
// ==============================================================================

/**
 * Creates a new investment record scoped to the authenticated user.
 * Validates asset ownership if assetId is provided.
 */
export async function createInvestmentRecord(
  userId: string,
  input: CreateInvestmentRecordInput
): Promise<DomainInvestmentRecord> {
  const safeUserId = validateUserId(userId);
  const validated = validateInvestmentRecordInput(input);

  let verifiedAssetId: string | null = null;
  let assetInvestmentType = validated.investmentType;

  if (input.assetId !== undefined && input.assetId !== null && input.assetId.trim() !== '') {
    const asset = await verifyInvestmentAssetAccess(input.assetId, safeUserId);
    verifiedAssetId = asset.id;
    // If investmentType was not explicitly customized in input, inherit from asset
    if (input.investmentType === undefined) {
      assetInvestmentType = asset.investmentType.toLowerCase() as DomainInvestmentType;
    }
  }

  const created = await prisma.investmentRecord.create({
    data: {
      userId: safeUserId,
      assetId: verifiedAssetId,
      amount: validated.amountDecimal,
      currency: validated.currency,
      investmentType: domainInvestmentTypeToDb(assetInvestmentType),
      date: validated.date,
      periodYear: validated.periodYear,
      periodMonth: validated.periodMonth,
      notes: validated.notes,
    },
    include: {
      asset: {
        select: { assetName: true, institutionOrPlatform: true },
      },
    },
  });

  return mapInvestmentRecordToDomain(created, created.asset);
}

/**
 * Retrieves a paginated list of investment records for the user with deterministic ordering.
 */
export async function listInvestmentRecords(
  userId: string,
  filter?: ListInvestmentRecordFilter,
  pagination?: PaginationParams
): Promise<PaginatedResult<DomainInvestmentRecord>> {
  const safeUserId = validateUserId(userId);
  const { page, limit, skip } = normalizePagination(pagination);

  const where: Prisma.InvestmentRecordWhereInput = {
    userId: safeUserId,
  };

  if (filter?.assetId !== undefined) {
    where.assetId = filter.assetId;
  }
  if (filter?.investmentType !== undefined) {
    where.investmentType = domainInvestmentTypeToDb(filter.investmentType);
  }
  if (filter?.periodYear !== undefined) {
    where.periodYear = filter.periodYear;
  }
  if (filter?.periodMonth !== undefined) {
    where.periodMonth = filter.periodMonth;
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
    prisma.investmentRecord.count({ where }),
    prisma.investmentRecord.findMany({
      where,
      skip,
      take: limit,
      include: {
        asset: {
          select: { assetName: true, institutionOrPlatform: true },
        },
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
    }),
  ]);

  type InvestmentRecordWithAsset = Prisma.InvestmentRecordGetPayload<{
    include: { asset: { select: { assetName: true, institutionOrPlatform: true } } };
  }>;

  return {
    data: (dbRecords as InvestmentRecordWithAsset[]).map((r) =>
      mapInvestmentRecordToDomain(r, r.asset)
    ),
    pagination: buildPaginationMeta(totalCount, page, limit),
  };
}

/**
 * Retrieves a single investment record by ID strictly scoped to the user.
 */
export async function getInvestmentRecordById(
  userId: string,
  id: string
): Promise<DomainInvestmentRecord> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'InvestmentRecord');

  const record = await prisma.investmentRecord.findFirst({
    where: {
      id: safeId,
      userId: safeUserId,
    },
    include: {
      asset: {
        select: { assetName: true, institutionOrPlatform: true },
      },
    },
  });

  if (!record) {
    throw new RecordNotFoundError('InvestmentRecord', safeId);
  }

  return mapInvestmentRecordToDomain(record, record.asset);
}

/**
 * Updates an investment record with defensive field whitelisting and user isolation.
 */
export async function updateInvestmentRecord(
  userId: string,
  id: string,
  input: UpdateInvestmentRecordInput
): Promise<DomainInvestmentRecord> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'InvestmentRecord');

  // Verify ownership before modifying
  const existing = await prisma.investmentRecord.findFirst({
    where: {
      id: safeId,
      userId: safeUserId,
    },
    select: { id: true, assetId: true },
  });

  if (!existing) {
    throw new RecordNotFoundError('InvestmentRecord', safeId);
  }

  const updateData: Prisma.InvestmentRecordUpdateInput = {};

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

  if (input.investmentType !== undefined) {
    updateData.investmentType = domainInvestmentTypeToDb(input.investmentType);
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

  if (input.assetId !== undefined) {
    if (input.assetId === null || input.assetId.trim() === '') {
      updateData.asset = { disconnect: true };
    } else {
      const verifiedAsset = await verifyInvestmentAssetAccess(input.assetId, safeUserId);
      updateData.asset = { connect: { id: verifiedAsset.id } };
    }
  }

  if (input.notes !== undefined) {
    updateData.notes = input.notes ? input.notes.trim() : null;
  }

  const updated = await prisma.investmentRecord.update({
    where: { id: safeId },
    data: updateData,
    include: {
      asset: {
        select: { assetName: true, institutionOrPlatform: true },
      },
    },
  });

  return mapInvestmentRecordToDomain(updated, updated.asset);
}

/**
 * Deletes an investment record atomically scoped to the user.
 */
export async function deleteInvestmentRecord(
  userId: string,
  id: string
): Promise<void> {
  const safeUserId = validateUserId(userId);
  const safeId = validateRecordId(id, 'InvestmentRecord');

  const result = await prisma.investmentRecord.deleteMany({
    where: {
      id: safeId,
      userId: safeUserId,
    },
  });

  verifyDeletionResult(result.count, 'InvestmentRecord', safeId);
}
