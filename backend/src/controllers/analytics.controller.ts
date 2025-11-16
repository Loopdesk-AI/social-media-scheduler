import { Request, Response, NextFunction } from 'express';
import { integrationManager } from '../providers/integration.manager';
import { prisma } from '../database/prisma.client';
import { decrypt, encrypt } from '../services/encryption.service';

// Simple in-memory cache for analytics (1 hour TTL)
const analyticsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export class AnalyticsController {
  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { integrationId } = req.params;
      const userId = req.user!.id; // Fix: Use userId instead of organizationId
      // Convert timestamp to number of days (default 30 days)
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const date = Date.now() - days * 24 * 60 * 60 * 1000;

      // Check cache
      const cacheKey = `${integrationId}-${date}`;
      const cached = analyticsCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json(cached.data);
      }

      // Get integration
      const integration = await prisma.integration.findFirst({
        where: {
          id: integrationId,
          userId, // Fix: Use userId instead of organizationId
          deletedAt: null,
        },
      });

      if (!integration) {
        return res.status(404).json({ error: 'Integration not found' });
      }

      // Get provider
      const provider = integrationManager.getSocialIntegration(
        integration.providerIdentifier
      );

      // Decrypt token
      let accessToken = decrypt(integration.token);

      // Fetch analytics from provider
      let analytics;
      try {
        analytics = await provider.analytics(
          integration.internalId,
          accessToken,
          days // Pass number of days instead of timestamp
        );
      } catch (error: any) {
        // Check if it's an authentication error and try to refresh the token
        if (error.code === 401 || (error.message && error.message.includes('Invalid Credentials'))) {
          console.log('Attempting to refresh YouTube token');
          try {
            // Try to refresh the token
            const refreshToken = integration.refreshToken;
            if (refreshToken) {
              const newTokens = await provider.refreshToken(refreshToken);
              
              // Update integration with new tokens
              await prisma.integration.update({
                where: { id: integrationId },
                data: {
                  token: encrypt(newTokens.accessToken),
                  refreshToken: newTokens.refreshToken,
                  tokenExpiration: new Date(Date.now() + newTokens.expiresIn * 1000),
                  refreshNeeded: false,
                },
              });
              
              // Retry the analytics call with the new token
              accessToken = newTokens.accessToken;
              analytics = await provider.analytics(
                integration.internalId,
                accessToken,
                days
              );
            } else {
              throw new Error('No refresh token available');
            }
          } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError);
            // Mark integration as needing refresh
            await prisma.integration.update({
              where: { id: integrationId },
              data: { refreshNeeded: true },
            });
            throw new Error('Token refresh required');
          }
        } else {
          throw error;
        }
      }

      const response = {
        integration: {
          id: integration.id,
          name: integration.name,
          provider: integration.providerIdentifier,
          picture: integration.picture,
        },
        analytics,
        period: {
          from: new Date(date).toISOString(),
          to: new Date().toISOString(),
        },
      };

      // Cache the response
      analyticsCache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
      });

      res.json(response);
    } catch (error) {
      console.error('Analytics error:', error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        // Check if it's a token refresh error
        if (error.message.includes('token') || error.message.includes('access') || error.message.includes('blocked')) {
          // Mark integration as needing refresh
          try {
            const { integrationId } = req.params;
            await prisma.integration.update({
              where: { id: integrationId },
              data: { refreshNeeded: true },
            });
          } catch (updateError) {
            console.error('Failed to mark integration for refresh:', updateError);
          }
          
          return res.status(401).json({ 
            error: 'Token refresh required', 
            message: 'Please re-authenticate your account',
            refreshNeeded: true
          });
        }
      }
      
      next(error);
    }
  }

  async clearCache(req: Request, res: Response, next: NextFunction) {
    try {
      analyticsCache.clear();
      res.json({ success: true, message: 'Analytics cache cleared' });
    } catch (error) {
      next(error);
    }
  }
}