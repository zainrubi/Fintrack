/**
 * Fintrack — Repository Error Classes
 *
 * Provides predictable, strongly typed error handling for the data access layer.
 * All error messages are safe and avoid leaking sensitive cross-user record information.
 */

/**
 * Base repository error class.
 */
export class RepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RepositoryError';
  }
}

/**
 * Thrown when an input argument fails validation before any database query is issued.
 */
export class ValidationError extends RepositoryError {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly invalidValue?: unknown
  ) {
    super(field ? `[Validation Error: ${field}] ${message}` : message);
    this.name = 'ValidationError';
  }
}

/**
 * Thrown when a record cannot be found for the specified user.
 *
 * Security Note:
 * This error is intentionally ambiguous regarding whether a record ID exists for a
 * different user. If a record belongs to User B, User A will receive this error,
 * preventing attackers from probing for the existence of other users' IDs.
 */
export class RecordNotFoundError extends RepositoryError {
  constructor(
    public readonly entityName: string,
    public readonly recordId: string
  ) {
    super(`${entityName} with ID '${recordId}' was not found.`);
    this.name = 'RecordNotFoundError';
  }
}

/**
 * Thrown when a referenced category cannot be found in the database.
 */
export class CategoryNotFoundError extends RepositoryError {
  constructor(public readonly categoryId: string) {
    super(`Category '${categoryId}' does not exist.`);
    this.name = 'CategoryNotFoundError';
  }
}

/**
 * Thrown when a user attempts to associate a record with another user's private category.
 */
export class CategoryAccessDeniedError extends RepositoryError {
  constructor(public readonly categoryId: string) {
    super(`Access denied to category '${categoryId}'. It is a private category belonging to another user.`);
    this.name = 'CategoryAccessDeniedError';
  }
}
