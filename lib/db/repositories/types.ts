/**
 * Fintrack — Shared Repository Types & Pagination Contracts
 */

import { RecordNotFoundError } from './errors';

export interface PaginationParams {
  /** Page number, 1-indexed. Default: 1 */
  page?: number;
  /** Number of items to return per page (1 to 100). Default: 20 */
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface DateRangeFilter {
  /** Optional start date boundary (inclusive) */
  startDate?: Date | string;
  /** Optional end date boundary (inclusive) */
  endDate?: Date | string;
}

/**
 * Normalizes pagination arguments with strict safety bounds.
 * Defensively guards against NaN, Infinity, -Infinity, negative numbers, zero, and non-numeric inputs.
 */
export function normalizePagination(params?: PaginationParams): {
  page: number;
  limit: number;
  skip: number;
} {
  const rawPage = typeof params?.page === 'number' ? params.page : Number(params?.page);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;

  const rawLimit = typeof params?.limit === 'number' ? params.limit : Number(params?.limit);
  const limit = Number.isFinite(rawLimit) && rawLimit >= 1
    ? Math.min(100, Math.floor(rawLimit))
    : 20;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Builds standard pagination metadata from total count and normalized pagination.
 * Hardens against non-finite or negative totalCount.
 */
export function buildPaginationMeta(
  totalCount: number,
  page: number,
  limit: number
): PaginationMeta {
  const safeTotal = Number.isFinite(totalCount) && totalCount >= 0 ? Math.floor(totalCount) : 0;
  const safePage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit >= 1 ? Math.floor(limit) : 20;

  const totalPages = Math.max(1, Math.ceil(safeTotal / safeLimit));

  return {
    page: safePage,
    limit: safeLimit,
    totalCount: safeTotal,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };
}

/**
 * Verifies that a tenant-scoped deletion modified at least one row.
 * Throws RecordNotFoundError if count is 0.
 */
export function verifyDeletionResult(count: number, entityName: string, id: string): void {
  if (count === 0) {
    throw new RecordNotFoundError(entityName, id);
  }
}
