import { Request, Response, NextFunction } from "express";
import {
  RefreshToken,
  BadBody,
  NotEnoughScopes,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
} from "../utils/errors";
import logger from "../utils/logger";

/**
 * Global error handling middleware
 */
export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Log error
  logger.error("Error:", {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Refresh token required
  if (error instanceof RefreshToken) {
    return res.status(401).json({
      error: "TokenRefreshRequired",
      message: error.message,
    });
  }

  // Bad request body
  if (error instanceof BadBody) {
    return res.status(400).json({
      error: "BadRequest",
      message: error.message,
    });
  }

  // Not enough scopes
  if (error instanceof NotEnoughScopes) {
    return res.status(403).json({
      error: "InsufficientScopes",
      message: error.message,
    });
  }

  // Validation error
  if (error instanceof ValidationError) {
    return res.status(422).json({
      error: "ValidationError",
      message: error.message,
    });
  }

  // Unauthorized
  if (error instanceof UnauthorizedError) {
    return res.status(401).json({
      error: "Unauthorized",
      message: error.message,
    });
  }

  // Not found
  if (error instanceof NotFoundError) {
    return res.status(404).json({
      error: "NotFound",
      message: error.message,
    });
  }

  // Drizzle query errors (wraps underlying pg errors)
  if (error.message && error.message.startsWith("Failed query:")) {
    logger.error("Drizzle query failed:", {
      message: error.message,
      cause: (error as any).cause,
      stack: error.stack,
    });
    return res.status(500).json({
      error: "InternalServerError",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Database query failed",
      hint:
        process.env.NODE_ENV === "development"
          ? "Check if database schema is synced (npm run db:push) and default user exists (npm run db:seed)"
          : undefined,
    });
  }

  // PostgreSQL/pg errors (Drizzle uses node-postgres under the hood)
  // Common pg error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
  const pgError = error as any;
  if (pgError.code) {
    // Unique constraint violation
    if (pgError.code === "23505") {
      return res.status(409).json({
        error: "ConflictError",
        message: "A record with this value already exists",
        detail:
          process.env.NODE_ENV === "development" ? pgError.detail : undefined,
      });
    }

    // Foreign key violation
    if (pgError.code === "23503") {
      return res.status(400).json({
        error: "ReferenceError",
        message: "Referenced record does not exist",
        detail:
          process.env.NODE_ENV === "development" ? pgError.detail : undefined,
      });
    }

    // Not null violation
    if (pgError.code === "23502") {
      return res.status(400).json({
        error: "ValidationError",
        message: "Required field is missing",
        detail:
          process.env.NODE_ENV === "development" ? pgError.column : undefined,
      });
    }

    // Check constraint violation
    if (pgError.code === "23514") {
      return res.status(400).json({
        error: "ValidationError",
        message: "Data validation failed",
        detail:
          process.env.NODE_ENV === "development"
            ? pgError.constraint
            : undefined,
      });
    }

    // Invalid text representation (e.g., invalid UUID)
    if (pgError.code === "22P02") {
      return res.status(400).json({
        error: "ValidationError",
        message: "Invalid data format",
      });
    }

    // Connection errors
    if (pgError.code === "ECONNREFUSED" || pgError.code === "ENOTFOUND") {
      logger.error("Database connection error:", pgError);
      return res.status(503).json({
        error: "ServiceUnavailable",
        message: "Database connection failed",
      });
    }

    // Connection timeout
    if (pgError.code === "ETIMEDOUT" || pgError.code === "57014") {
      return res.status(503).json({
        error: "ServiceUnavailable",
        message: "Database operation timed out",
      });
    }

    // Other database errors
    if (pgError.code.startsWith("22") || pgError.code.startsWith("23")) {
      return res.status(400).json({
        error: "DatabaseError",
        message: "Database operation failed",
        detail:
          process.env.NODE_ENV === "development" ? pgError.message : undefined,
      });
    }
  }

  // Drizzle-specific errors (if any custom error types)
  if (error.name === "DrizzleError") {
    return res.status(400).json({
      error: "DatabaseError",
      message: "Database operation failed",
    });
  }

  // Default error
  return res.status(500).json({
    error: "InternalServerError",
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "An error occurred",
  });
}
