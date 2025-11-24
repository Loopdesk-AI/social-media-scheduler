import { prisma } from '../database/prisma.client';
import { integrationManager } from '../providers/integration.manager';
import { decrypt } from './encryption.service';
import logger from '../utils/logger';
import dayjs from 'dayjs';

/**
 * Analytics data point from platform
 */
interface PlatformAnalytics {
    label: string;
    data: Array<{ date: string; total: number }>;
    average?: boolean;
}

/**
 * Aggregated analytics across platforms
 */
interface AggregatedMetrics {
    totalPosts: number;
    totalImpressions: number;
    totalEngagements: number;
    averageEngagementRate: number;
    platformBreakdown: {
        platform: string;
        posts: number;
        impressions: number;
        engagements: number;
        engagementRate: number;
    }[];
    timeSeriesData: {
        date: string;
        impressions: number;
        engagements: number;
        posts: number;
    }[];
    topPerformingPosts: {
        id: string;
        content: string;
        platform: string;
        publishDate: Date;
        impressions: number;
        engagements: number;
        engagementRate: number;
        url: string;
    }[];
}

/**
 * Best time to post analysis
 */
interface BestTimeToPost {
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    hour: number; // 0-23
    averageEngagementRate: number;
    postCount: number;
}

/**
 * Analytics Aggregator Service
 * 
 * Aggregates analytics data from multiple platforms
 * Provides cross-platform insights and recommendations
 */
export class AnalyticsAggregatorService {
    /**
     * Get aggregated analytics for user across all platforms
     */
    async getAggregatedAnalytics(
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<AggregatedMetrics> {
        // Get all social integrations for user
        const integrations = await prisma.integration.findMany({
            where: {
                userId,
                type: 'social',
                deletedAt: null,
                disabled: false,
            },
        });

        // Get published posts in date range
        const posts = await prisma.post.findMany({
            where: {
                userId,
                state: 'PUBLISHED',
                publishDate: {
                    gte: startDate,
                    lte: endDate,
                },
                deletedAt: null,
            },
            include: {
                integration: true,
            },
            orderBy: {
                publishDate: 'desc',
            },
        });

        // Fetch analytics from each platform
        const platformAnalytics = await Promise.all(
            integrations.map(async (integration) => {
                try {
                    const provider = integrationManager.getSocialIntegration(
                        integration.providerIdentifier
                    );
                    const accessToken = decrypt(integration.token);

                    const analytics = await provider.analytics(
                        integration.internalId,
                        accessToken,
                        startDate.getTime()
                    );

                    return {
                        platform: integration.providerIdentifier,
                        analytics,
                    };
                } catch (error) {
                    logger.error(`Failed to fetch analytics for ${integration.providerIdentifier}`, {
                        error,
                    });
                    return {
                        platform: integration.providerIdentifier,
                        analytics: [],
                    };
                }
            })
        );

        // Aggregate metrics
        let totalImpressions = 0;
        let totalEngagements = 0;
        const platformBreakdown: AggregatedMetrics['platformBreakdown'] = [];
        const timeSeriesMap = new Map<string, { impressions: number; engagements: number; posts: number }>();

        // Process platform analytics
        for (const { platform, analytics } of platformAnalytics) {
            let platformImpressions = 0;
            let platformEngagements = 0;

            for (const metric of analytics) {
                if (metric.label.toLowerCase().includes('impression') || metric.label.toLowerCase().includes('view')) {
                    for (const point of metric.data) {
                        platformImpressions += point.total;
                        totalImpressions += point.total;

                        // Add to time series
                        const existing = timeSeriesMap.get(point.date) || { impressions: 0, engagements: 0, posts: 0 };
                        existing.impressions += point.total;
                        timeSeriesMap.set(point.date, existing);
                    }
                } else if (
                    metric.label.toLowerCase().includes('engagement') ||
                    metric.label.toLowerCase().includes('like') ||
                    metric.label.toLowerCase().includes('comment') ||
                    metric.label.toLowerCase().includes('share') ||
                    metric.label.toLowerCase().includes('retweet')
                ) {
                    for (const point of metric.data) {
                        platformEngagements += point.total;
                        totalEngagements += point.total;

                        // Add to time series
                        const existing = timeSeriesMap.get(point.date) || { impressions: 0, engagements: 0, posts: 0 };
                        existing.engagements += point.total;
                        timeSeriesMap.set(point.date, existing);
                    }
                }
            }

            const platformPosts = posts.filter(p => p.integration.providerIdentifier === platform).length;
            const platformEngagementRate = platformImpressions > 0
                ? (platformEngagements / platformImpressions) * 100
                : 0;

            platformBreakdown.push({
                platform,
                posts: platformPosts,
                impressions: platformImpressions,
                engagements: platformEngagements,
                engagementRate: platformEngagementRate,
            });
        }

        // Add post counts to time series
        for (const post of posts) {
            const dateKey = dayjs(post.publishDate).format('YYYY-MM-DD');
            const existing = timeSeriesMap.get(dateKey) || { impressions: 0, engagements: 0, posts: 0 };
            existing.posts += 1;
            timeSeriesMap.set(dateKey, existing);
        }

        // Convert time series map to array
        const timeSeriesData = Array.from(timeSeriesMap.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Calculate top performing posts (mock data - would need actual metrics per post)
        const topPerformingPosts = posts
            .slice(0, 10)
            .map(post => ({
                id: post.id,
                content: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
                platform: post.integration.providerIdentifier,
                publishDate: post.publishDate,
                impressions: 0, // Would need to fetch from platform
                engagements: 0, // Would need to fetch from platform
                engagementRate: 0,
                url: post.releaseURL || '',
            }));

        const averageEngagementRate = totalImpressions > 0
            ? (totalEngagements / totalImpressions) * 100
            : 0;

        return {
            totalPosts: posts.length,
            totalImpressions,
            totalEngagements,
            averageEngagementRate,
            platformBreakdown,
            timeSeriesData,
            topPerformingPosts,
        };
    }

    /**
     * Analyze best times to post based on historical engagement
     */
    async getBestTimesToPost(userId: string): Promise<BestTimeToPost[]> {
        // Get all published posts for user
        const posts = await prisma.post.findMany({
            where: {
                userId,
                state: 'PUBLISHED',
                deletedAt: null,
            },
            include: {
                integration: true,
            },
        });

        // Group by day of week and hour
        const timeSlots = new Map<string, { engagementRate: number; count: number }>();

        for (const post of posts) {
            const publishDate = dayjs(post.publishDate);
            const dayOfWeek = publishDate.day();
            const hour = publishDate.hour();
            const key = `${dayOfWeek}-${hour}`;

            // Mock engagement rate - would need actual metrics
            const engagementRate = Math.random() * 10; // 0-10%

            const existing = timeSlots.get(key) || { engagementRate: 0, count: 0 };
            existing.engagementRate += engagementRate;
            existing.count += 1;
            timeSlots.set(key, existing);
        }

        // Calculate averages and convert to array
        const bestTimes: BestTimeToPost[] = Array.from(timeSlots.entries())
            .map(([key, data]) => {
                const [dayOfWeek, hour] = key.split('-').map(Number);
                return {
                    dayOfWeek,
                    hour,
                    averageEngagementRate: data.engagementRate / data.count,
                    postCount: data.count,
                };
            })
            .filter(time => time.postCount >= 3) // Only include times with at least 3 posts
            .sort((a, b) => b.averageEngagementRate - a.averageEngagementRate)
            .slice(0, 10); // Top 10 times

        return bestTimes;
    }

    /**
     * Get audience growth over time
     */
    async getAudienceGrowth(
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{
        platform: string;
        data: Array<{ date: string; followers: number; growth: number }>;
    }[]> {
        const integrations = await prisma.integration.findMany({
            where: {
                userId,
                type: 'social',
                deletedAt: null,
                disabled: false,
            },
        });

        const growthData = await Promise.all(
            integrations.map(async (integration) => {
                try {
                    const provider = integrationManager.getSocialIntegration(
                        integration.providerIdentifier
                    );
                    const accessToken = decrypt(integration.token);

                    const analytics = await provider.analytics(
                        integration.internalId,
                        accessToken,
                        startDate.getTime()
                    );

                    // Find follower/fan metrics
                    const followerMetric = analytics.find(
                        m =>
                            m.label.toLowerCase().includes('follower') ||
                            m.label.toLowerCase().includes('fan') ||
                            m.label.toLowerCase().includes('subscriber')
                    );

                    if (!followerMetric) {
                        return {
                            platform: integration.providerIdentifier,
                            data: [],
                        };
                    }

                    // Calculate growth
                    const data = followerMetric.data.map((point, index) => {
                        const growth = index > 0
                            ? point.total - followerMetric.data[index - 1].total
                            : 0;

                        return {
                            date: point.date,
                            followers: point.total,
                            growth,
                        };
                    });

                    return {
                        platform: integration.providerIdentifier,
                        data,
                    };
                } catch (error) {
                    logger.error(`Failed to fetch audience growth for ${integration.providerIdentifier}`, {
                        error,
                    });
                    return {
                        platform: integration.providerIdentifier,
                        data: [],
                    };
                }
            })
        );

        return growthData;
    }

    /**
     * Export analytics to CSV format
     */
    async exportToCSV(userId: string, startDate: Date, endDate: Date): Promise<string> {
        const analytics = await this.getAggregatedAnalytics(userId, startDate, endDate);

        // CSV header
        let csv = 'Date,Platform,Posts,Impressions,Engagements,Engagement Rate\n';

        // Add time series data
        for (const point of analytics.timeSeriesData) {
            csv += `${point.date},All Platforms,${point.posts},${point.impressions},${point.engagements},${point.impressions > 0 ? ((point.engagements / point.impressions) * 100).toFixed(2) : 0
                }%\n`;
        }

        // Add platform breakdown
        csv += '\nPlatform Summary\n';
        csv += 'Platform,Total Posts,Total Impressions,Total Engagements,Engagement Rate\n';
        for (const platform of analytics.platformBreakdown) {
            csv += `${platform.platform},${platform.posts},${platform.impressions},${platform.engagements},${platform.engagementRate.toFixed(2)}%\n`;
        }

        return csv;
    }
}

// Export singleton instance
export const analyticsAggregatorService = new AnalyticsAggregatorService();
