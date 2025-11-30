import { pool } from "../database/db";
import { queueService } from "../services/queue.service";
import Redis, { Cluster } from "ioredis";

// Check if Redis is configured
const REDIS_ENABLED = !!process.env.REDIS_HOST;
const REDIS_CLUSTER_MODE = process.env.REDIS_CLUSTER_MODE === "true";
const REDIS_TLS = process.env.REDIS_TLS === "true";

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    queue: ServiceHealth;
  };
}

export interface ServiceHealth {
  status: "up" | "down" | "disabled";
  responseTime?: number;
  details?: any;
}

/**
 * Health Check Service
 * Monitors the health of all system components
 */
export class HealthService {
  private redis: Redis | Cluster | null = null;

  constructor() {
    if (!REDIS_ENABLED) {
      console.log("⚠️  Redis not configured - Redis health checks disabled");
      return;
    }

    const redisHost = process.env.REDIS_HOST!;
    const redisPort = parseInt(process.env.REDIS_PORT || "6379");
    const redisPassword = process.env.REDIS_PASSWORD;

    const tlsOptions = REDIS_TLS ? { rejectUnauthorized: false } : undefined;

    if (REDIS_CLUSTER_MODE) {
      // AWS ElastiCache Cluster Mode
      console.log("🔄 Health service connecting to Redis cluster...");
      this.redis = new Cluster([{ host: redisHost, port: redisPort }], {
        redisOptions: {
          password: redisPassword || undefined,
          tls: tlsOptions,
          connectTimeout: 5000,
          maxRetriesPerRequest: 1,
        },
        lazyConnect: true,
        clusterRetryStrategy: (times) => {
          if (times > 2) {
            return null;
          }
          return Math.min(times * 100, 2000);
        },
      });
    } else {
      // Standalone Redis Mode
      console.log("🔄 Health service connecting to standalone Redis...");
      this.redis = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword || undefined,
        lazyConnect: true,
        tls: tlsOptions,
        maxRetriesPerRequest: 1,
        connectTimeout: 5000,
        retryStrategy: (times) => {
          if (times > 2) {
            return null;
          }
          return Math.min(times * 100, 2000);
        },
      });
    }

    this.redis.on("error", (err) => {
      // Silently handle connection errors - they'll be reported in health checks
      console.error("Redis health check connection error:", err.message);
    });
  }

  /**
   * Check database health
   */
  async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await pool.query("SELECT 1");
      return {
        status: "up",
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check Redis health
   */
  async checkRedis(): Promise<ServiceHealth> {
    if (!this.redis) {
      return {
        status: "disabled",
        details: "Redis not configured",
      };
    }

    const start = Date.now();
    try {
      await Promise.race([
        this.redis.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Redis ping timeout")), 3000),
        ),
      ]);
      return {
        status: "up",
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check queue health
   */
  async checkQueue(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const metrics = await queueService.getMetrics();
      if (!metrics.available) {
        return {
          status: "disabled",
          details: "Queue service not available (Redis not configured)",
        };
      }
      return {
        status: "up",
        responseTime: Date.now() - start,
        details: metrics,
      };
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get overall system health
   */
  async getHealth(): Promise<HealthStatus> {
    const [database, redis, queue] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkQueue(),
    ]);

    const services = { database, redis, queue };

    // Determine overall status
    // Only consider "up" and "down" for health calculation, not "disabled"
    const criticalServices = [database]; // Only database is critical
    const optionalServices = [redis, queue];

    const criticalUp = criticalServices.every((s) => s.status === "up");
    const anyDown = [...criticalServices, ...optionalServices].some(
      (s) => s.status === "down",
    );
    const anyDisabled = optionalServices.some((s) => s.status === "disabled");

    let status: "healthy" | "degraded" | "unhealthy";
    if (criticalUp && !anyDown) {
      status = anyDisabled ? "degraded" : "healthy";
    } else if (!criticalUp) {
      status = "unhealthy";
    } else {
      status = "degraded";
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      services,
    };
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Export singleton instance
export const healthService = new HealthService();
