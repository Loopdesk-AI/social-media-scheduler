import Redis, { Cluster } from "ioredis";
import logger from "../utils/logger";

/**
 * Redis Service
 * Centralized Redis client for caching and state management
 * Supports both standalone Redis and AWS ElastiCache cluster mode
 */

// Check if cluster mode is enabled
const REDIS_CLUSTER_MODE = process.env.REDIS_CLUSTER_MODE === "true";

class RedisService {
  private client: Redis | Cluster | null = null;
  private isConnected = false;

  constructor() {
    this.connect();
  }

  /**
   * Connect to Redis with retry logic
   * Supports both standalone and cluster mode
   */
  private connect() {
    const redisHost = process.env.REDIS_HOST;
    const redisPort = parseInt(process.env.REDIS_PORT || "6379");
    const redisPassword = process.env.REDIS_PASSWORD;
    const redisTls = process.env.REDIS_TLS === "true";

    if (!redisHost) {
      logger.warn("⚠️  REDIS_HOST not configured - Redis features disabled");
      return;
    }

    try {
      if (REDIS_CLUSTER_MODE) {
        // AWS ElastiCache Cluster Mode
        logger.info("🔄 Connecting to Redis in cluster mode...");

        this.client = new Cluster([{ host: redisHost, port: redisPort }], {
          redisOptions: {
            password: redisPassword || undefined,
            tls: redisTls
              ? {
                  rejectUnauthorized: false, // For AWS ElastiCache
                }
              : undefined,
            connectTimeout: 10000,
            maxRetriesPerRequest: 3,
          },
          clusterRetryStrategy: (times) => {
            if (times > 5) {
              logger.error("Redis cluster connection failed after 5 retries");
              return null;
            }
            const delay = Math.min(times * 200, 5000);
            return delay;
          },
          enableReadyCheck: true,
          scaleReads: "replica", // Read from replicas when possible
          natMap: {}, // Empty natMap for AWS ElastiCache
        });
      } else {
        // Standalone Redis Mode
        logger.info("🔄 Connecting to Redis in standalone mode...");

        this.client = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword || undefined,
          tls: redisTls
            ? {
                rejectUnauthorized: false, // For AWS ElastiCache
              }
            : undefined,
          connectTimeout: 10000,
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 5) {
              logger.error("Redis connection failed after 5 retries");
              return null;
            }
            const delay = Math.min(times * 200, 5000);
            return delay;
          },
          reconnectOnError: (err) => {
            const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"];
            if (targetErrors.some((e) => err.message.includes(e))) {
              return true;
            }
            return false;
          },
        });
      }

      this.client.on("connect", () => {
        this.isConnected = true;
        const mode = REDIS_CLUSTER_MODE ? "cluster" : "standalone";
        logger.info(`✅ Redis connected (${mode} mode, TLS: ${redisTls})`);
      });

      this.client.on("ready", () => {
        this.isConnected = true;
        logger.info("✅ Redis ready to accept commands");
      });

      this.client.on("error", (error) => {
        // Don't spam logs with repeated errors
        if (this.isConnected) {
          logger.error("❌ Redis error:", { message: error.message });
        }
        this.isConnected = false;
      });

      this.client.on("close", () => {
        if (this.isConnected) {
          logger.warn("⚠️  Redis connection closed");
        }
        this.isConnected = false;
      });

      this.client.on("reconnecting", () => {
        logger.info("🔄 Redis reconnecting...");
      });
    } catch (error) {
      logger.error("❌ Failed to initialize Redis:", error);
      this.isConnected = false;
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
  getClient(): Redis | Cluster {
    if (!this.client) {
      throw new Error("Redis client not initialized");
    }
    return this.client;
  }

  /**
   * Set a key-value pair
   */
  async set(key: string, value: string): Promise<void> {
    if (!this.isAvailable()) {
      logger.debug("Redis not available, skipping set operation");
      return;
    }
    await this.client!.set(key, value);
  }

  /**
   * Set a key-value pair with expiration (in seconds)
   */
  async setex(key: string, seconds: number, value: string): Promise<void> {
    if (!this.isAvailable()) {
      logger.debug("Redis not available, skipping setex operation");
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
   * Note: In cluster mode, KEYS command is discouraged for large datasets
   */
  async deletePattern(pattern: string): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      if (REDIS_CLUSTER_MODE && this.client instanceof Cluster) {
        // In cluster mode, we need to scan each node
        const nodes = this.client.nodes("master");
        for (const node of nodes) {
          const keys = await node.keys(pattern);
          if (keys.length > 0) {
            // Delete keys one by one to handle cross-slot keys
            for (const key of keys) {
              await this.client.del(key);
            }
          }
        }
      } else {
        const keys = await this.client!.keys(pattern);
        if (keys.length > 0) {
          await this.client!.del(...keys);
        }
      }
    } catch (error) {
      logger.error("Error deleting keys by pattern:", error);
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
   * Increment a key
   */
  async incr(key: string): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }
    return await this.client!.incr(key);
  }

  /**
   * Set expiration on a key
   */
  async expire(key: string, seconds: number): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }
    await this.client!.expire(key, seconds);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; message?: string }> {
    if (!this.isAvailable()) {
      return {
        status: "unavailable",
        message: "Redis not configured or not connected",
      };
    }

    try {
      await this.client!.ping();
      return {
        status: "healthy",
        message: REDIS_CLUSTER_MODE ? "Cluster mode" : "Standalone mode",
      };
    } catch (error) {
      return { status: "unhealthy", message: (error as Error).message };
    }
  }

  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    if (this.client) {
      try {
        if (this.client instanceof Cluster) {
          await this.client.quit();
        } else {
          await this.client.quit();
        }
        this.isConnected = false;
        logger.info("✅ Redis connection closed gracefully");
      } catch (error) {
        logger.error("Error closing Redis connection:", error);
      }
    }
  }
}

// Export singleton instance
export const redisService = new RedisService();
