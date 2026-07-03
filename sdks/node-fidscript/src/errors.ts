/**
 * errors.ts — typed error class for every FIDScript API response.
 */
export type FidscriptErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'BAD_REQUEST'
  | 'CONFLICT'
  | 'PAYMENT_REQUIRED'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT';

export class FidscriptError extends Error {
  public readonly code: FidscriptErrorCode | string;
  public readonly status: number;
  public readonly details: unknown;

  constructor(message: string, code: string | FidscriptErrorCode, status: number, details?: unknown) {
    super(message);
    this.name = 'FidscriptError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}