import { Request, Response, NextFunction } from "express";
import { integrationManager } from "../providers/integration.manager";
import { db } from "../database/db";
import { integrations } from "../database/schema";
import { eq, and, isNull } from "drizzle-orm";
import { decrypt, encrypt } from "../services/encryption.service";
import { redisService } from "../services/redis.service";

// Default user ID for simplified operation (no auth)
const DEFAULT_USER_ID = "default-user";

// Redis-based cache for analytics (1 hour TTL)
const CACHE_TTL = 60 * 60; // 1 hour in seconds

export class AnalyticsController {
  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { integrationId } = req.params;
      const userId = DEFAULT_USER_ID;
      // Convert timestamp to number of days (default 30 days)
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const date = Date.now() - days * 24 * 60 * 60 * 1000;

      // Check Redis cache
      const cacheKey = `analytics:${integrationId}:${date}`;
      const cached = await redisService.get(cacheKey);

      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Get integration
      const integration = await db.query.integrations.findFirst({
        where: and(
          eq(integrations.id, integrationId),
          eq(integrations.userId, userId),
          isNull(integrations.deletedAt),
        ),
      });

      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      // Check if this is a storage integration - analytics are only for social integrations
      if (integration.type === "storage") {
        return res.status(400).json({
          error: "Analytics not available",
          message:
            "Analytics are only available for social media accounts, not storage accounts",
        });
      }

      // Get provider
      const provider = integrationManager.getSocialIntegration(
        integration.providerIdentifier,
      );

      // Decrypt token
      let accessToken = decrypt(integration.token);

      // Fetch analytics from provider
      let analytics;
      try {
        analytics = await provider.analytics(
          integration.internalId,
          accessToken,
          days, // Pass number of days instead of timestamp
        );
      } catch (error: any) {
        // Check if it's an authentication error and try to refresh the token
        const isAuthError =
          error.code === 401 ||
          error.status === 401 ||
          error.response?.status === 401 ||
          error.message?.includes("Invalid Credentials") ||
          error.message?.includes("invalid_token");

        if (isAuthError) {
          console.log("Attempting to refresh token");
          try {
            // Try to refresh the token
            const refreshToken = integration.refreshToken;
            if (refreshToken) {
              const newTokens = await provider.refreshToken(refreshToken);

              // Update integration with new tokens
              await db
                .update(integrations)
                .set({
                  token: encrypt(newTokens.accessToken),
                  refreshToken: newTokens.refreshToken,
                  tokenExpiration: new Date(
                    Date.now() + newTokens.expiresIn * 1000,
                  ),
                  refreshNeeded: false,
                  updatedAt: new Date(),
                })
                .where(eq(integrations.id, integrationId));

              // Retry the analytics call with the new token
              accessToken = newTokens.accessToken;
              analytics = await provider.analytics(
                integration.internalId,
                accessToken,
                days,
              );
            } else {
              throw new Error("No refresh token available");
            }
          } catch (refreshError: any) {
            console.error("Failed to refresh token:", refreshError);
            // Mark integration as needing refresh
            await db
              .update(integrations)
              .set({ refreshNeeded: true })
              .where(eq(integrations.id, integrationId));

            // Check if it's an invalid_grant error (refresh token revoked/expired)
            const isInvalidGrant =
              refreshError.response?.data?.error === "invalid_grant" ||
              refreshError.message?.includes("invalid_grant");

            if (isInvalidGrant) {
              return res.status(401).json({
                error: "Re-authentication required",
                message:
                  "Your YouTube authorization has expired or been revoked. Please disconnect and reconnect your YouTube account.",
                refreshNeeded: true,
                requiresReauth: true,
              });
            }

            throw new Error("Token refresh required");
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

      // Cache the response in Redis
      await redisService.setex(cacheKey, CACHE_TTL, JSON.stringify(response));

      res.json(response);
    } catch (error) {
      console.error("Analytics error:", error);

      // Handle specific error cases
      if (error instanceof Error) {
        // Check if it's a token refresh error
        if (
          error.message.includes("token") ||
          error.message.includes("access") ||
          error.message.includes("blocked") ||
          error.message.includes("invalid_grant")
        ) {
          // Mark integration as needing refresh
          try {
            const { integrationId } = req.params;
            await db
              .update(integrations)
              .set({ refreshNeeded: true })
              .where(eq(integrations.id, integrationId));
          } catch (updateError) {
            console.error(
              "Failed to mark integration for refresh:",
              updateError,
            );
          }

          return res.status(401).json({
            error: "Re-authentication required",
            message:
              "Your social media authorization has expired or been revoked. Please disconnect and reconnect your account.",
            refreshNeeded: true,
            requiresReauth: true,
          });
        }
      }

      next(error);
    }
  }

  async clearCache(req: Request, res: Response, next: NextFunction) {
    try {
      // Clear all analytics cache keys in Redis
      await redisService.deletePattern("analytics:*");
      res.json({ success: true, message: "Analytics cache cleared" });
    } catch (error) {
      next(error);
    }
  }
}
