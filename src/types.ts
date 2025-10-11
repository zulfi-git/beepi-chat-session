/**
 * Environment bindings for the Cloudflare Worker
 */
export interface Env {
  OPENAI_API_KEY: string;
  CHATKIT_WORKFLOW_ID: string;
  ALLOWED_ORIGINS?: string;
}

/**
 * Request body for starting a new ChatKit session
 */
export interface StartSessionRequest {
  // Optional metadata can be added here
  metadata?: Record<string, unknown>;
}

/**
 * Request body for refreshing a ChatKit session
 */
export interface RefreshSessionRequest {
  currentClientSecret: string;
}

/**
 * Response for successful session creation/refresh
 */
export interface SessionResponse {
  client_secret: string;
  expires_at: number; // Unix timestamp in seconds
}

/**
 * Standard error response
 */
export interface ErrorResponse {
  error: string;
  message: string;
  request_id?: string;
}

/**
 * OpenAI ChatKit session creation request
 */
export interface OpenAISessionRequest {
  workflow_id: string;
}

/**
 * OpenAI ChatKit session response
 */
export interface OpenAISessionResponse {
  client_secret: string;
  expires_at: number;
}

/**
 * Rate limiter entry for IP-based tracking
 */
export interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

/**
 * Request context for logging
 */
export interface RequestContext {
  requestId: string;
  startTime: number;
  ip: string;
  method: string;
  path: string;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: string;
  version: string;
}
