/**
 * Cloudflare Worker for ChatKit Token Service
 * 
 * Provides secure token issuance for ChatKit client connections
 * to OpenAI's Agent Builder workflows.
 */

import { Env, SessionResponse, StartSessionRequest, RefreshSessionRequest, RequestContext, HealthResponse } from './types';
import { handleOptions, getCorsHeaders } from './cors';
import { checkRateLimit } from './rate-limiter';
import { generateRequestId, logRequest } from './logger';
import {
  rateLimitResponse,
  badRequestResponse,
  methodNotAllowedResponse,
  notFoundResponse,
  internalErrorResponse,
} from './errors';
import { createChatKitSession, refreshChatKitSession } from './openai';
import { APP_VERSION } from './constants';

/**
 * Get client IP address from request
 */
function getClientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || 
         request.headers.get('X-Forwarded-For')?.split(',')[0].trim() || 
         'unknown';
}

/**
 * Handle POST /api/chatkit/start
 * Creates a new ChatKit session
 */
async function handleStartSession(
  request: Request,
  env: Env,
  context: RequestContext
): Promise<Response> {
  try {
    // Validate content type
    const contentType = request.headers.get('Content-Type');
    if (contentType && !contentType.includes('application/json')) {
      logRequest(context, 400, 'error', 'Invalid content type');
      return badRequestResponse(
        'Content-Type must be application/json',
        request,
        env,
        context.requestId
      );
    }

    // Parse request body (optional metadata)
    let body: StartSessionRequest = {};
    const text = await request.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        logRequest(context, 400, 'error', 'Invalid JSON');
        return badRequestResponse('Invalid JSON in request body', request, env, context.requestId);
      }
    }

    // Create new session via OpenAI
    const session = await createChatKitSession(env);

    // Build response
    const response: SessionResponse = {
      client_secret: session.client_secret,
      expires_at: session.expires_at,
    };

    logRequest(context, 200, 'success');

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(request, env),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logRequest(context, 500, 'error', errorMessage);
    return internalErrorResponse(
      'Failed to create session',
      request,
      env,
      context.requestId
    );
  }
}

/**
 * Handle POST /api/chatkit/refresh
 * Refreshes an existing ChatKit session
 */
async function handleRefreshSession(
  request: Request,
  env: Env,
  context: RequestContext
): Promise<Response> {
  try {
    // Validate content type
    const contentType = request.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      logRequest(context, 400, 'error', 'Invalid content type');
      return badRequestResponse(
        'Content-Type must be application/json',
        request,
        env,
        context.requestId
      );
    }

    // Parse request body
    const text = await request.text();
    if (!text) {
      logRequest(context, 400, 'error', 'Empty request body');
      return badRequestResponse('Request body is required', request, env, context.requestId);
    }

    let body: RefreshSessionRequest;
    try {
      body = JSON.parse(text);
    } catch {
      logRequest(context, 400, 'error', 'Invalid JSON');
      return badRequestResponse('Invalid JSON in request body', request, env, context.requestId);
    }

    // Validate required field
    if (!body.currentClientSecret) {
      logRequest(context, 400, 'error', 'Missing currentClientSecret');
      return badRequestResponse(
        'currentClientSecret is required',
        request,
        env,
        context.requestId
      );
    }

    // Refresh session via OpenAI
    const session = await refreshChatKitSession(env, body.currentClientSecret);

    // Build response
    const response: SessionResponse = {
      client_secret: session.client_secret,
      expires_at: session.expires_at,
    };

    logRequest(context, 200, 'success');

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(request, env),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logRequest(context, 500, 'error', errorMessage);
    return internalErrorResponse(
      'Failed to refresh session',
      request,
      env,
      context.requestId
    );
  }
}

/**
 * Handle GET /api/health
 * Returns health check information
 */
function handleHealth(
  request: Request,
  env: Env,
  context: RequestContext
): Response {
  const healthResponse: HealthResponse = {
    status: 'ok',
    version: APP_VERSION,
  };

  logRequest(context, 200, 'success');

  return new Response(JSON.stringify(healthResponse), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(request, env),
    },
  });
}

/**
 * Main fetch handler for Cloudflare Worker
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Create request context for logging
    const requestId = generateRequestId();
    const url = new URL(request.url);
    const context: RequestContext = {
      requestId,
      startTime: Date.now(),
      ip: getClientIp(request),
      method: request.method,
      path: url.pathname,
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions(request, env);
    }

    // Handle health check (no rate limit)
    if (request.method === 'GET' && url.pathname === '/api/health') {
      return handleHealth(request, env, context);
    }

    // Check rate limit
    if (!checkRateLimit(context.ip)) {
      logRequest(context, 429, 'rate_limited');
      return rateLimitResponse(request, env, requestId);
    }

    // Route requests
    if (request.method === 'POST') {
      if (url.pathname === '/api/chatkit/start') {
        return await handleStartSession(request, env, context);
      } else if (url.pathname === '/api/chatkit/refresh') {
        return await handleRefreshSession(request, env, context);
      }
    }

    // Handle 404 and 405
    if (url.pathname === '/api/chatkit/start' || url.pathname === '/api/chatkit/refresh') {
      logRequest(context, 405, 'error', 'Method not allowed');
      return methodNotAllowedResponse(request, env, requestId);
    }

    logRequest(context, 404, 'error', 'Not found');
    return notFoundResponse(request, env, requestId);
  },
};
