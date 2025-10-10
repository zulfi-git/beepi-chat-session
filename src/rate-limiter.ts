import { RateLimitEntry } from './types';

/**
 * Simple IP-based token bucket rate limiter
 * Stores rate limit state in memory (per-worker instance)
 */
class RateLimiter {
  private buckets: Map<string, RateLimitEntry>;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second
  private readonly refillInterval: number; // milliseconds

  constructor(maxTokens = 10, refillRate = 1, refillIntervalMs = 1000) {
    this.buckets = new Map();
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.refillInterval = refillIntervalMs;
  }

  /**
   * Check if request is allowed for given IP
   */
  isAllowed(ip: string): boolean {
    const now = Date.now();
    let entry = this.buckets.get(ip);

    if (!entry) {
      // New IP - create bucket with max tokens minus one
      entry = {
        tokens: this.maxTokens - 1,
        lastRefill: now,
      };
      this.buckets.set(ip, entry);
      return true;
    }

    // Calculate tokens to add based on time elapsed
    const timeSinceRefill = now - entry.lastRefill;
    const tokensToAdd = Math.floor(timeSinceRefill / this.refillInterval) * this.refillRate;

    if (tokensToAdd > 0) {
      entry.tokens = Math.min(this.maxTokens, entry.tokens + tokensToAdd);
      entry.lastRefill = now;
    }

    // Check if request can proceed
    if (entry.tokens > 0) {
      entry.tokens--;
      return true;
    }

    return false;
  }

  /**
   * Clean up old entries periodically
   */
  cleanup(maxAgeMs = 3600000): void {
    const now = Date.now();
    for (const [ip, entry] of this.buckets.entries()) {
      if (now - entry.lastRefill > maxAgeMs) {
        this.buckets.delete(ip);
      }
    }
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter(10, 1, 1000);

/**
 * Middleware to check rate limit for request
 */
export function checkRateLimit(ip: string): boolean {
  return rateLimiter.isAllowed(ip);
}
