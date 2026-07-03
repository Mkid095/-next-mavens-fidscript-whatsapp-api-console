/**
 * errors.ts — user-friendly error messages for API errors
 */

export class FidscriptError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'FidscriptError';
  }
}

export function parseApiError(res: unknown, statusCode: number): FidscriptError {
  const body = res as Record<string, unknown> | undefined;
  const message = (body?.error as string) || (body?.message as string) || 'Unknown error';

  if (statusCode === 401) {
    return new FidscriptError(
      `Authentication failed: ${message}. Check your API key with 'fidscript whoami'`,
      'UNAUTHORIZED',
      statusCode
    );
  }
  if (statusCode === 403) {
    return new FidscriptError(
      `Access denied: ${message}. Your plan may not include this operation.`,
      'FORBIDDEN',
      statusCode
    );
  }
  if (statusCode === 404) {
    return new FidscriptError(
      `Not found: ${message}`,
      'NOT_FOUND',
      statusCode
    );
  }
  if (statusCode === 429) {
    return new FidscriptError(
      `Rate limited: ${message}. Wait before retrying.`,
      'RATE_LIMITED',
      statusCode
    );
  }
  if (statusCode === 428) {
    return new FidscriptError(
      `Precondition required: ${message}. Pass --confirm to confirm this action.`,
      'PRECONDITION_REQUIRED',
      statusCode
    );
  }

  return new FidscriptError(message, 'API_ERROR', statusCode);
}
