import { ErrorResponse, Env } from './types';
import { getCorsHeaders } from './cors';
/**
 * Create a JSON error response
 */
export function createErrorResponse(
  error: string,
  message: string,
  statusCode: number,
  request: Request,
  env: Env,
  requestId?: string
): Response {
  const body: ErrorResponse = {
    error,
    message,
    ...(requestId && { request_id: requestId }),
  };

  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(request, env),
    },
  });
}

/**
 * Handle rate limit exceeded
 */
export function rateLimitResponse(request: Request, env: Env, requestId: string): Response {
  return createErrorResponse(
    'rate_limit_exceeded',
    'Too many requests. Please try again later.',
    429,
    request,
    env,
    requestId
  );
}

/**
 * Handle bad request
 */
export function badRequestResponse(
  message: string,
  request: Request,
  env: Env,
  requestId: string
): Response {
  return createErrorResponse('bad_request', message, 400, request, env, requestId);
}

/**
 * Handle method not allowed
 */
export function methodNotAllowedResponse(request: Request, env: Env, requestId: string): Response {
  return createErrorResponse(
    'method_not_allowed',
    'Method not allowed',
    405,
    request,
    env,
    requestId
  );
}

/**
 * Handle not found
 */
export function notFoundResponse(request: Request, env: Env, requestId: string): Response {
  return createErrorResponse('not_found', 'Endpoint not found', 404, request, env, requestId);
}

/**
 * Handle internal server error
 */
export function internalErrorResponse(
  message: string,
  request: Request,
  env: Env,
  requestId: string
): Response {
  return createErrorResponse('internal_error', message, 500, request, env, requestId);
}
