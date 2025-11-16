import { Request, Response, NextFunction } from 'express';
import {
  RefreshToken,
  BadBody,
  NotEnoughScopes,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
} from '../utils/errors';
import { sentryService } from '../monitoring/sentry.service';
import logger from '../utils/logger';

/**
 * Global error handling middleware
 */
export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  logger.error('Error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Capture in Sentry for 5xx errors
  if (!(error instanceof RefreshToken) && 
      !(error instanceof BadBody) && 
      !(error instanceof NotEnoughScopes) &&
      !(error instanceof ValidationError) &&
      !(error instanceof UnauthorizedError) &&
      !(error instanceof NotFoundError)) {
    sentryService.captureException(error, {
      path: req.path,
      method: req.method,
      body: req.body,
      query: req.query,
    });
  }

  // Refresh token required
  if (error instanceof RefreshToken) {
    return res.status(401).json({
      error: 'TokenRefreshRequired',
      message: error.message,
    });
  }

  // Bad request body
  if (error instanceof BadBody) {
    return res.status(400).json({
      error: 'BadRequest',
      message: error.message,
    });
  }

  // Not enough scopes
  if (error instanceof NotEnoughScopes) {
    return res.status(403).json({
      error: 'InsufficientScopes',
      message: error.message,
    });
  }

  // Validation error
  if (error instanceof ValidationError) {
    return res.status(422).json({
      error: 'ValidationError',
      message: error.message,
    });
  }

  // Unauthorized
  if (error instanceof UnauthorizedError) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: error.message,
    });
  }

  // Not found
  if (error instanceof NotFoundError) {
    return res.status(404).json({
      error: 'NotFound',
      message: error.message,
    });
  }

  // Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      error: 'DatabaseError',
      message: 'Database operation failed',
    });
  }

  // Default error
  return res.status(500).json({
    error: 'InternalServerError',
    message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
  });
}
