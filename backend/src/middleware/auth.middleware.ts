import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors';
import { authService } from '../services/auth.service';
import { redisService } from '../services/redis.service';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        organizationId?: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const { userId } = authService.verifyToken(token);

    // Try to get user from Redis cache first
    const cacheKey = `user:${userId}`;
    const cachedUser = await redisService.get(cacheKey);

    let user;
    if (cachedUser) {
      user = JSON.parse(cachedUser);
    } else {
      // Get user from database
      user = await authService.getUserById(userId);

      // Cache user data in Redis for 5 minutes
      await redisService.setex(cacheKey, 300, JSON.stringify(user));
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    next(error);
  }
}
