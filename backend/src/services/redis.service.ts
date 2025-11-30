import Redis from 'ioredis';
import logger from '../utils/logger';

/**
 * Redis Service
 * Centralized Redis client for caching and state management
 */
class RedisService {
    private client: Redis | null = null;
    private isConnected = false;

    constructor() {
        this.connect();
    }

    /**
     * Connect to Redis with retry logic
     */
    private connect() {
        const redisUrl = process.env.REDIS_URL;

        if (!redisUrl) {
            logger.warn('⚠️  REDIS_URL not configured - Redis features disabled');
            return;
        }

        try {
            this.client = new Redis(redisUrl, {
                maxRetriesPerRequest: 3,
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                reconnectOnError: (err) => {
                    const targetError = 'READONLY';
                    if (err.message.includes(targetError)) {
                        return true;
                    }
                    return false;
                },
            });

            this.client.on('connect', () => {
                this.isConnected = true;
                logger.info('✅ Redis connected');
            });

            this.client.on('error', (error) => {
                logger.error('❌ Redis error:', error);
                this.isConnected = false;
            });

            this.client.on('close', () => {
                this.isConnected = false;
                logger.warn('⚠️  Redis connection closed');
            });

        } catch (error) {
            logger.error('❌ Failed to initialize Redis:', error);
        }
    }

    /**
     * Check if Redis is available
     */
    isAvailable(): boolean {
        return this.client !== null && this.isConnected;
    }

    /**
     * Get Redis client instance
     * For advanced operations not covered by helper methods
     */
    getClient(): Redis {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        return this.client;
    }

    /**
     * Set a key-value pair
     */
    async set(key: string, value: string): Promise<void> {
        if (!this.isAvailable()) {
            logger.warn('Redis not available, skipping set operation');
            return;
        }
        await this.client!.set(key, value);
    }

    /**
     * Set a key-value pair with expiration (in seconds)
     */
    async setex(key: string, seconds: number, value: string): Promise<void> {
        if (!this.isAvailable()) {
            logger.warn('Redis not available, skipping setex operation');
            return;
        }
        await this.client!.setex(key, seconds, value);
    }

    /**
     * Get a value by key
     */
    async get(key: string): Promise<string | null> {
        if (!this.isAvailable()) {
            return null;
        }
        return await this.client!.get(key);
    }

    /**
     * Delete a key
     */
    async delete(key: string): Promise<void> {
        if (!this.isAvailable()) {
            return;
        }
        await this.client!.del(key);
    }

    /**
     * Delete keys matching a pattern
     */
    async deletePattern(pattern: string): Promise<void> {
        if (!this.isAvailable()) {
            return;
        }

        const keys = await this.client!.keys(pattern);
        if (keys.length > 0) {
            await this.client!.del(...keys);
        }
    }

    /**
     * Check if a key exists
     */
    async exists(key: string): Promise<boolean> {
        if (!this.isAvailable()) {
            return false;
        }
        const result = await this.client!.exists(key);
        return result === 1;
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<{ status: string; message?: string }> {
        if (!this.isAvailable()) {
            return { status: 'unavailable', message: 'Redis not configured or not connected' };
        }

        try {
            await this.client!.ping();
            return { status: 'healthy' };
        } catch (error) {
            return { status: 'unhealthy', message: (error as Error).message };
        }
    }

    /**
     * Graceful shutdown
     */
    async close(): Promise<void> {
        if (this.client) {
            await this.client.quit();
            this.isConnected = false;
            logger.info('✅ Redis connection closed gracefully');
        }
    }
}

// Export singleton instance
export const redisService = new RedisService();
