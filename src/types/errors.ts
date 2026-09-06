export type FieldErrors = Record<string, string>;

/**
 * Single client error envelope used by every failed API response.
 * Global: `fields` is null. Field: `fields` has one message per input.
 */
export interface ApiErrorBody {
  message: string;
  fields: FieldErrors | null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly fields: FieldErrors | null;

  /**
   * Creates a typed API error the UI can split into global vs field messages.
   *
   * @param message - Global message
   * @param status - HTTP status
   * @param fields - Field errors, or null for a global-only error
   */
  constructor(message: string, status: number, fields: FieldErrors | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
  }
}

/**
 * Narrows unknown thrown values to an ApiError with a safe fallback.
 *
 * @param error - Value caught in a try/catch
 * @returns An ApiError the UI can render
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (error instanceof Error && error.message) {
    return new ApiError(error.message, 0);
  }
  return new ApiError('Something went wrong. Please try again.', 0);
}
