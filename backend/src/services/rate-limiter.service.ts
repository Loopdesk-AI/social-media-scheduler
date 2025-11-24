import { redisService } from './redis.service';
import logger from '../utils/logger';

/**
 * Platform-specific rate limit configurations
 * Based on official API documentation as of 2024
 */
const RATE_LIMITS = {
    facebook: {
        requests: 200,
        window: 3600, // 1 hour in seconds
        name: 'Facebook Pages API',
    },
    linkedin: {
        requests: 100,
        window: 86400, // 24 hours in seconds
        name: 'LinkedIn API',
    },
    twitter: {
        requests: 300,
        window: 10800, // 3 hours in seconds
        name: 'Twitter API v2',
    },
    instagram: {
        requests: 200,
        window: 3600, // 1 hour in seconds
        name: 'Instagram Graph API',
    },
    youtube: {
        requests: 10000,
        window: 86400, // 24 hours in seconds
        name: 'YouTube Data API v3',
    },
} as const;

type Platform = keyof typeof RATE_LIMITS;

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    retryAfter?: number; // seconds to wait before retry
}

interface BackoffConfig {
    attempt: number;
    maxAttempts: number;
    baseDelay: number; // milliseconds
    maxDelay: number; // milliseconds
}

/**
 * Centralized Rate Limiting Service
 * 
 * Features:
 * - Token bucket algorithm with Redis backing
 * - Platform-specific rate limits
 * - Exponential backoff with jitter
 * - Distributed rate limiting across multiple instances
 * - Automatic retry scheduling
 */
export class RateLimiterService {
    private readonly keyPrefix = 'ratelimit';

    /**
     * Check if request is allowed under rate limit
     * Uses token bucket algorithm
     */
    async checkRateLimit(
        platform: Platform,
        userId: string,
        endpoint?: string
    ): Promise<RateLimitResult> {
        const config = RATE_LIMITS[platform];
        const key = this.getRateLimitKey(platform, userId, endpoint);

        try {
            const redis = redisService.getClient();
            const now = Date.now();
            const windowStart = now - config.window * 1000;

            // Use Redis sorted set to track requests in time window
            // Remove old requests outside the window
            await redis.zremrangebyscore(key, 0, windowStart);

            // Count requests in current window
            const requestCount = await redis.zcard(key);

            if (requestCount >= config.requests) {
                // Rate limit exceeded
                const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES');
                const resetTime = oldestRequest.length > 0
                    ? parseInt(oldestRequest[1]) + config.window * 1000
                    : now + config.window * 1000;

                logger.warn('Rate limit exceeded', {
                    platform,
                    userId,
                    endpoint,
                    requestCount,
                    limit: config.requests,
                    resetAt: new Date(resetTime),
                });

                return {
                    allowed: false,
                    remaining: 0,
                    resetAt: new Date(resetTime),
                    retryAfter: Math.ceil((resetTime - now) / 1000),
                };
            }

            // Add current request to the window
            await redis.zadd(key, now, `${now}-${Math.random()}`);

            // Set expiration to window size + buffer
            await redis.expire(key, config.window + 60);

            const remaining = config.requests - requestCount - 1;

            logger.debug('Rate limit check passed', {
                platform,
                userId,
                endpoint,
                remaining,
                limit: config.requests,
            });

            return {
                allowed: true,
                remaining,
                resetAt: new Date(now + config.window * 1000),
            };
        } catch (error) {
            logger.error('Rate limit check failed', {
                platform,
                userId,
                endpoint,
                error,
            });

            // Fail open - allow request if Redis is down
            return {
                allowed: true,
                remaining: config.requests,
                resetAt: new Date(Date.now() + config.window * 1000),
            };
        }
    }

    /**
     * Wait for rate limit to reset if needed
     * Returns immediately if request is allowed
     */
    async waitForRateLimit(
        platform: Platform,
        userId: string,
        endpoint?: string
    ): Promise<void> {
        const result = await this.checkRateLimit(platform, userId, endpoint);

        if (!result.allowed && result.retryAfter) {
            const waitTime = result.retryAfter * 1000;
            logger.info('Waiting for rate limit reset', {
                platform,
                userId,
                endpoint,
                waitTime,
                resetAt: result.resetAt,
            });

            await this.sleep(waitTime);
        }
    }

    /**
     * Calculate exponential backoff delay with jitter
     * 
     * Formula: min(maxDelay, baseDelay * 2^attempt) + random jitter
     */
    calculateBackoff(config: BackoffConfig): number {
        const { attempt, maxAttempts, baseDelay, maxDelay } = config;

        if (attempt >= maxAttempts) {
            throw new Error(`Max retry attempts (${maxAttempts}) exceeded`);
        }

        // Exponential backoff: baseDelay * 2^attempt
        const exponentialDelay = baseDelay * Math.pow(2, attempt);

        // Cap at maxDelay
        const cappedDelay = Math.min(exponentialDelay, maxDelay);

        // Add jitter (0-25% of delay)
        const jitter = Math.random() * cappedDelay * 0.25;

        const totalDelay = cappedDelay + jitter;

        logger.debug('Calculated backoff delay', {
            attempt,
            maxAttempts,
            baseDelay,
            maxDelay,
            exponentialDelay,
            cappedDelay,
            jitter,
            totalDelay,
        });

        return Math.floor(totalDelay);
    }

    /**
     * Execute function with automatic retry and exponential backoff
     */
    async withRetry<T>(
        fn: () => Promise<T>,
        options: {
            platform: Platform;
            userId: string;
            endpoint?: string;
            maxAttempts?: number;
            baseDelay?: number;
            maxDelay?: number;
            onRetry?: (attempt: number, error: any) => void;
        }
    ): Promise<T> {
        const {
            platform,
            userId,
            endpoint,
            maxAttempts = 5,
            baseDelay = 1000,
            maxDelay = 30000,
            onRetry,
        } = options;

        let lastError: any;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                // Check rate limit before attempt
                await this.waitForRateLimit(platform, userId, endpoint);

                // Execute function
                const result = await fn();

                if (attempt > 0) {
                    logger.info('Retry succeeded', {
                        platform,
                        userId,
                        endpoint,
                        attempt,
                        maxAttempts,
                    });
                }

                return result;
            } catch (error: any) {
                lastError = error;

                // Check if error is retryable
                if (!this.isRetryableError(error)) {
                    logger.error('Non-retryable error encountered', {
                        platform,
                        userId,
                        endpoint,
                        attempt,
                        error,
                    });
                    throw error;
                }

                // Don't retry on last attempt
                if (attempt === maxAttempts - 1) {
                    break;
                }

                // Calculate backoff delay
                const delay = this.calculateBackoff({
                    attempt,
                    maxAttempts,
                    baseDelay,
                    maxDelay,
                });

                logger.warn('Retrying after error', {
                    platform,
                    userId,
                    endpoint,
                    attempt: attempt + 1,
                    maxAttempts,
                    delay,
                    error: error.message,
                });

                // Call retry callback if provided
                if (onRetry) {
                    onRetry(attempt + 1, error);
                }

                // Wait before retry
                await this.sleep(delay);
            }
        }

        // All retries exhausted
        logger.error('All retry attempts exhausted', {
            platform,
            userId,
            endpoint,
            maxAttempts,
            lastError,
        });

        throw lastError;
    }

    /**
     * Check if error is retryable
     */
    private isRetryableError(error: any): boolean {
        // Network errors
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            return true;
        }

        // HTTP status codes that are retryable
        const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
        if (error.response && retryableStatusCodes.includes(error.response.status)) {
            return true;
        }

        // Platform-specific rate limit errors
        if (error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
            return true;
        }

        return false;
    }

    /**
     * Get rate limit statistics for monitoring
     */
    async getRateLimitStats(platform: Platform, userId: string): Promise<{
        platform: string;
        limit: number;
        window: number;
        current: number;
        remaining: number;
        resetAt: Date;
    }> {
        const config = RATE_LIMITS[platform];
        const key = this.getRateLimitKey(platform, userId);

        try {
            const redis = redisService.getClient();
            const now = Date.now();
            const windowStart = now - config.window * 1000;

            // Clean up old requests
            await redis.zremrangebyscore(key, 0, windowStart);

            // Get current count
            const current = await redis.zcard(key);
            const remaining = Math.max(0, config.requests - current);

            return {
                platform: config.name,
                limit: config.requests,
                window: config.window,
                current,
                remaining,
                resetAt: new Date(now + config.window * 1000),
            };
        } catch (error) {
            logger.error('Failed to get rate limit stats', { platform, userId, error });

            return {
                platform: config.name,
                limit: config.requests,
                window: config.window,
                current: 0,
                remaining: config.requests,
                resetAt: new Date(Date.now() + config.window * 1000),
            };
        }
    }

    /**
     * Reset rate limit for user (admin/testing only)
     */
    async resetRateLimit(platform: Platform, userId: string): Promise<void> {
        const key = this.getRateLimitKey(platform, userId);

        try {
            const redis = redisService.getClient();
            await redis.del(key);

            logger.info('Rate limit reset', { platform, userId });
        } catch (error) {
            logger.error('Failed to reset rate limit', { platform, userId, error });
            throw error;
        }
    }

    /**
     * Generate Redis key for rate limiting
     */
    private getRateLimitKey(platform: Platform, userId: string, endpoint?: string): string {
        const parts = [this.keyPrefix, platform, userId];
        if (endpoint) {
            parts.push(endpoint);
        }
        return parts.join(':');
    }

    /**
     * Sleep for specified milliseconds
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
export const rateLimiterService = new RateLimiterService();
