import { Router } from 'express';
import { healthService } from '../monitoring/health.service';
import { metricsService } from '../monitoring/metrics.service';
import { queueService } from '../services/queue.service';
import { prisma } from '../database/prisma.client';

const router = Router();

/**
 * Health check endpoint
 * GET /health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await healthService.getHealth();
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Liveness probe (for Kubernetes)
 * GET /health/live
 */
router.get('/health/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness probe (for Kubernetes)
 * GET /health/ready
 */
router.get('/health/ready', async (req, res) => {
  try {
    // Check if critical services are ready
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Prometheus metrics endpoint
 * GET /metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    // Update queue metrics before returning
    const queueMetrics = await queueService.getMetrics();
    metricsService.updateQueueSize(
      queueMetrics.waiting,
      queueMetrics.active,
      queueMetrics.delayed
    );

    const metrics = await metricsService.getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Queue metrics endpoint (JSON format)
 * GET /admin/queue-metrics
 */
router.get('/admin/queue-metrics', async (req, res) => {
  try {
    const metrics = await queueService.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch queue metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * System info endpoint
 * GET /admin/system
 */
router.get('/admin/system', (req, res) => {
  res.json({
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    memory: {
      total: process.memoryUsage().heapTotal,
      used: process.memoryUsage().heapUsed,
      external: process.memoryUsage().external,
      rss: process.memoryUsage().rss,
    },
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  });
});

export { router as monitoringRoutes };
