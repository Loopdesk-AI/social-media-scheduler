import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../monitoring/metrics.service';

/**
 * Metrics Middleware
 * Tracks HTTP request metrics
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Capture response finish event
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route?.path || req.path;
    const method = req.method;
    const statusCode = res.statusCode;

    // Record metrics
    metricsService.recordHttpRequest(method, route, statusCode, duration);

    // Record errors (4xx and 5xx)
    if (statusCode >= 400) {
      const errorType = statusCode >= 500 ? 'server_error' : 'client_error';
      metricsService.recordHttpError(method, route, errorType);
    }
  });

  next();
};
