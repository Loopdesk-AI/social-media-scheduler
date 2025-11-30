import { pool } from "../database/db";
import { queueService } from "../services/queue.service";
import Redis from "ioredis";

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
  status: "up" | "down";
  responseTime?: number;
  details?: any;
}

/**
 * Health Check Service
 * Monitors the health of all system components
 */
export class HealthService {
  private redis: Redis;

  constructor() {
    // Connect to cloud-hosted Redis
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      tls: process.env.REDIS_TLS === "true" ? {} : undefined,
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
    const start = Date.now();
    try {
      await this.redis.ping();
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
    const allUp = Object.values(services).every((s) => s.status === "up");
    const anyDown = Object.values(services).some((s) => s.status === "down");

    let status: "healthy" | "degraded" | "unhealthy";
    if (allUp) {
      status = "healthy";
    } else if (anyDown) {
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
    await this.redis.quit();
  }
}

// Export singleton instance
export const healthService = new HealthService();
