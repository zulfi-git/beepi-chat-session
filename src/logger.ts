import { RequestContext } from './types';

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Log request completion
 * Does NOT log secrets or sensitive data
 */
export function logRequest(
  context: RequestContext,
  statusCode: number,
  outcome: 'success' | 'error' | 'rate_limited',
  errorMessage?: string
): void {
  const latencyMs = Date.now() - context.startTime;
  
  const logEntry = {
    request_id: context.requestId,
    method: context.method,
    path: context.path,
    ip: context.ip,
    status: statusCode,
    outcome,
    latency_ms: latencyMs,
    timestamp: new Date().toISOString(),
    ...(errorMessage && { error: errorMessage }),
  };

  console.log(JSON.stringify(logEntry));
}
