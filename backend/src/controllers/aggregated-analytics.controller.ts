import { Request, Response, NextFunction } from "express";
import { integrationManager } from "../providers/integration.manager";
import { db } from "../database/db";
import { integrations } from "../database/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { decrypt, encrypt } from "../services/encryption.service";

// Default user ID for simplified operation (no auth)
const DEFAULT_USER_ID = "default-user";

// Simple in-memory cache for analytics (1 hour TTL)
const analyticsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export class AggregatedAnalyticsController {
  async getAggregatedAnalytics(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = DEFAULT_USER_ID;
      const { startDate, endDate, platforms, metrics } = req.query;

      // Parse platforms and metrics if provided
      const platformList = platforms
        ? (platforms as string).split(",")
        : undefined;
      const metricList = metrics ? (metrics as string).split(",") : undefined;

      // Create cache key
      const cacheKey = `aggregated-analytics:${userId}:${startDate || "default"}:${endDate || "default"}:${platformList?.join(",") || "all"}:${metricList?.join(",") || "all"}`;

      // Check cache
      const cached = analyticsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json(cached.data);
      }

      // Build conditions for query
      const conditions = [
        eq(integrations.userId, userId),
        isNull(integrations.deletedAt),
      ];

      // Get integrations for user
      let integrationsList;
      if (platformList && platformList.length > 0) {
        integrationsList = await db.query.integrations.findMany({
          where: and(
            ...conditions,
            inArray(integrations.providerIdentifier, platformList),
          ),
        });
      } else {
        integrationsList = await db.query.integrations.findMany({
          where: and(...conditions),
        });
      }

      // Filter out storage integrations - analytics are only for social integrations
      const socialIntegrations = integrationsList.filter(
        (integration) => integration.type !== "storage",
      );

      // Fetch analytics for each integration
      const analyticsData = await Promise.all(
        socialIntegrations.map(async (integration) => {
          try {
            const provider = integrationManager.getSocialIntegration(
              integration.providerIdentifier,
            );

            // Decrypt token
            let accessToken = decrypt(integration.token);

            // Calculate days for analytics
            let days = 30;
            if (startDate && endDate) {
              const start = new Date(startDate as string);
              const end = new Date(endDate as string);
              days = Math.ceil(
                (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
              );
            }

            // Fetch analytics from provider
            let analytics;
            try {
              analytics = await provider.analytics(
                integration.internalId,
                accessToken,
                days,
              );
            } catch (error: any) {
              // Check if it's an authentication error and try to refresh the token
              if (
                error.code === 401 ||
                (error.message && error.message.includes("Invalid Credentials"))
              ) {
                console.log(
                  `Attempting to refresh token for integration ${integration.id}`,
                );
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
                      .where(eq(integrations.id, integration.id));

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
                } catch (refreshError) {
                  console.error(
                    `Failed to refresh token for integration ${integration.id}:`,
                    refreshError,
                  );
                  // Mark integration as needing refresh
                  await db
                    .update(integrations)
                    .set({ refreshNeeded: true })
                    .where(eq(integrations.id, integration.id));
                  throw new Error("Token refresh required");
                }
              } else {
                throw error;
              }
            }

            return {
              integration: {
                id: integration.id,
                name: integration.name,
                provider: integration.providerIdentifier,
                picture: integration.picture,
              },
              analytics: metricList
                ? analytics.filter((metric: any) =>
                    metricList.includes(
                      metric.label.toLowerCase().replace(/\s+/g, ""),
                    ),
                  )
                : analytics,
            };
          } catch (error) {
            console.error(
              `Failed to fetch analytics for integration ${integration.id}:`,
              error,
            );
            return {
              integration: {
                id: integration.id,
                name: integration.name,
                provider: integration.providerIdentifier,
                picture: integration.picture,
              },
              analytics: [],
              error: "Failed to fetch analytics",
            };
          }
        }),
      );

      const response = {
        data: analyticsData,
        period: {
          from:
            startDate ||
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          to: endDate || new Date().toISOString(),
        },
      };

      // Cache the response
      analyticsCache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
      });

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async clearCache(req: Request, res: Response, next: NextFunction) {
    try {
      analyticsCache.clear();
      res.json({
        success: true,
        message: "Aggregated analytics cache cleared",
      });
    } catch (error) {
      next(error);
    }
  }
}
