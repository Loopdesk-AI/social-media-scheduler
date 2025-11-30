import { Queue, Worker, Job } from "bullmq";
import { Cluster } from "ioredis";
import { db } from "../database/db";
import { posts, integrations } from "../database/schema";
import { eq } from "drizzle-orm";
import { integrationManager } from "../providers/integration.manager";
import { decrypt } from "./encryption.service";
import { RefreshToken } from "../utils/errors";
import { safeJsonParse } from "../utils/helpers";
import logger from "../utils/logger";

// Check if Redis is configured
const REDIS_ENABLED = !!process.env.REDIS_HOST;
const REDIS_CLUSTER_MODE = process.env.REDIS_CLUSTER_MODE === "true";
const REDIS_TLS = process.env.REDIS_TLS === "true";

/**
 * Safely serialize errors, handling circular references from axios
 */
function serializeError(error: any): any {
  if (error?.response) {
    // Axios error - extract only the important parts
    return {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
    };
  }
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
  }
  return error;
}

/**
 * Queue Service
 * Manages BullMQ queue and worker for processing scheduled posts
 * Gracefully handles missing Redis connection
 */
export class QueueService {
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private isInitialized = false;

  constructor() {
    if (!REDIS_ENABLED) {
      logger.warn(
        "⚠️  Redis not configured - Queue service disabled. Scheduled posts will not be processed automatically.",
      );
      return;
    }

    this.initializeQueue();
  }

  /**
   * Initialize queue and worker with Redis connection
   * Supports both standalone Redis and AWS ElastiCache cluster mode
   */
  private initializeQueue() {
    try {
      let connection: any;

      if (REDIS_CLUSTER_MODE) {
        // AWS ElastiCache Cluster Mode - use ioredis Cluster
        logger.info("🔄 Initializing BullMQ with Redis cluster mode...");

        const clusterNodes = [
          {
            host: process.env.REDIS_HOST!,
            port: parseInt(process.env.REDIS_PORT || "6379"),
          },
        ];

        const clusterOptions = {
          redisOptions: {
            password: process.env.REDIS_PASSWORD || undefined,
            tls: REDIS_TLS
              ? {
                  rejectUnauthorized: false,
                }
              : undefined,
            connectTimeout: 10000,
            maxRetriesPerRequest: 3,
          },
          enableReadyCheck: true,
          clusterRetryStrategy: (times: number) => {
            if (times > 5) {
              logger.error("Redis cluster connection failed after 5 retries");
              return null;
            }
            return Math.min(times * 200, 5000);
          },
        };

        // BullMQ supports ioredis Cluster directly
        connection = new Cluster(clusterNodes, clusterOptions);
      } else {
        // Standalone Redis Mode
        logger.info("🔄 Initializing BullMQ with standalone Redis...");

        connection = {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT || "6379"),
          password: process.env.REDIS_PASSWORD || undefined,
          tls: REDIS_TLS
            ? {
                rejectUnauthorized: false,
              }
            : undefined,
          connectTimeout: 10000,
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => {
            if (times > 5) {
              logger.error("Redis connection failed after 5 retries");
              return null;
            }
            return Math.min(times * 200, 5000);
          },
        };
      }

      // Initialize queue
      this.queue = new Queue("posts", { connection });

      // Initialize worker in same process
      this.worker = new Worker("posts", this.processJob.bind(this), {
        connection,
        concurrency: 5,
      });

      // Event listeners
      this.worker.on("completed", (job) => {
        logger.info(`Job ${job.id} completed successfully`);
      });

      this.worker.on("failed", (job, err) => {
        logger.error(`Job ${job?.id} failed: ${err.message}`);
      });

      this.worker.on("error", (err) => {
        logger.error("Worker error:", serializeError(err));
      });

      this.isInitialized = true;
      logger.info("BullMQ worker initialized");
    } catch (error) {
      logger.error(
        "Failed to initialize queue service:",
        serializeError(error),
      );
      this.isInitialized = false;
    }
  }

  /**
   * Check if queue service is available
   */
  isAvailable(): boolean {
    return this.isInitialized && this.queue !== null;
  }

  /**
   * Add job to queue with priority and deduplication
   * @param postId Post ID to publish
   * @param publishDate When to publish
   * @param priority Job priority (1-10, higher = more urgent)
   * @returns Job ID
   */
  async addJob(
    postId: string,
    publishDate: Date,
    priority = 5,
  ): Promise<string> {
    if (!this.isAvailable() || !this.queue) {
      logger.warn(
        `Queue not available - post ${postId} scheduled but won't be auto-published`,
      );
      return `mock-job-${postId}`;
    }

    const delay = publishDate.getTime() - Date.now();

    if (delay < 0) {
      throw new Error("Publish date must be in the future");
    }

    // Check for duplicate jobs
    const existingJob = await this.findJobByPostId(postId);
    if (existingJob) {
      logger.warn(`Job already exists for post ${postId}, removing old job`);
      await existingJob.remove();
    }

    const job = await this.queue.add(
      "publish-post",
      { postId },
      {
        delay,
        priority, // Higher priority jobs are processed first
        attempts: 1, // NO retries - if it fails, it fails
        backoff: {
          type: "exponential",
          delay: 2000, // Start with 2s
        },
        removeOnComplete: {
          age: 86400, // Keep completed jobs for 24 hours
          count: 1000, // Keep max 1000 completed jobs
        },
        removeOnFail: {
          age: 604800, // Keep failed jobs for 7 days
        },
        jobId: `post-${postId}`, // Unique job ID for deduplication
      },
    );

    logger.info(
      `Scheduled job ${job.id} for post ${postId} in ${Math.round(delay / 1000)}s with priority ${priority}`,
    );
    return job.id!;
  }

  /**
   * Find job by post ID
   */
  private async findJobByPostId(postId: string): Promise<Job | null> {
    if (!this.queue) return null;
    const jobId = `post-${postId}`;
    const job = await this.queue.getJob(jobId);
    return job || null;
  }

  /**
   * Remove job from queue
   * @param jobId Job ID to remove
   */
  async removeJob(jobId: string): Promise<void> {
    if (!this.queue) {
      logger.warn(`Queue not available - cannot remove job ${jobId}`);
      return;
    }
    const job = await this.queue.getJob(jobId);
    if (job) {
      await job.remove();
      console.log(`🗑️  Removed job ${jobId}`);
    }
  }

  /**
   * Process job - publish post to platform
   * @param job BullMQ job
   */
  async processJob(job: Job): Promise<void> {
    const { postId } = job.data;

    logger.info(`Processing job ${job.id} for post ${postId}`);

    // 1. Fetch post with integration
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
      with: {
        integration: true,
      },
    });

    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    if (post.state !== "QUEUE") {
      console.log(`⏭️  Post ${postId} is not in QUEUE state, skipping`);
      return;
    }

    // 2. Get provider
    // Check if this is a storage integration - publishing is only for social integrations
    if (post.integration.type === "storage") {
      throw new Error("Cannot publish posts to storage integrations");
    }

    const provider = integrationManager.getSocialIntegration(
      post.integration.providerIdentifier,
    );

    // 3. Decrypt token
    const accessToken = decrypt(post.integration.token);

    // 4. Parse settings and prepare post details
    const settings: any =
      typeof post.settings === "string"
        ? safeJsonParse(post.settings, {})
        : post.settings || {};

    console.log("🔍 DEBUG queue.service - Post settings:", settings);

    const postDetails = [
      {
        id: post.id,
        message: post.content,
        media: settings.media || [],
        settings,
      },
    ];

    console.log("📦 DEBUG queue.service - postDetails:", postDetails[0]);

    // 5. Publish post
    let cleanupMedia: (() => Promise<void>) | undefined;

    try {
      // Resolve media (download from storage if needed)
      if (postDetails[0].media && postDetails[0].media.length > 0) {
        const { mediaResolverService } = await import(
          "./media-resolver.service"
        );
        const { resolvedMedia, cleanup } =
          await mediaResolverService.resolveMedia(
            postDetails[0].media,
            post.userId,
          );
        postDetails[0].media = resolvedMedia;
        cleanupMedia = cleanup;
      }

      logger.info(`Publishing to ${provider.identifier}...`);

      // Use rate limiter with automatic retry
      const { rateLimiterService } = await import("./rate-limiter.service");

      const result = await rateLimiterService.withRetry(
        async () => {
          return await provider.post(
            post.integration.internalId,
            accessToken,
            postDetails,
            post.integration,
          );
        },
        {
          platform: provider.identifier as any,
          userId: post.userId,
          endpoint: "post",
          maxAttempts: 5,
          baseDelay: 2000,
          maxDelay: 60000,
          onRetry: (attempt, error) => {
            logger.warn(`Retry attempt ${attempt} for post ${postId}`, {
              error: error.message,
            });
          },
        },
      );

      // 6. Update post status
      await db
        .update(posts)
        .set({
          state: "PUBLISHED",
          releaseURL: result[0].releaseURL,
          releaseId: result[0].postId,
          error: null,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, postId));

      logger.info(
        `Post ${postId} published successfully: ${result[0].releaseURL}`,
      );
    } catch (error) {
      const serializedError = serializeError(error);
      logger.error(`Failed to publish post ${postId}:`, serializedError);

      // Handle token refresh errors - automatically refresh the token
      if (error instanceof RefreshToken) {
        try {
          logger.info(
            `🔄 Attempting to refresh token for integration ${post.integrationId}`,
          );

          // Get refresh token
          const refreshToken = post.integration.refreshToken
            ? decrypt(post.integration.refreshToken)
            : null;

          if (!refreshToken) {
            logger.error(
              "No refresh token available, manual reconnection required",
            );
            await db
              .update(integrations)
              .set({ refreshNeeded: true })
              .where(eq(integrations.id, post.integrationId));
          } else {
            // Refresh the token using the provider
            const newTokens = await provider.refreshToken(refreshToken);

            // Encrypt new tokens
            const { encrypt } = await import("./encryption.service");
            const encryptedToken = encrypt(newTokens.accessToken);
            const encryptedRefreshToken = newTokens.refreshToken
              ? encrypt(newTokens.refreshToken)
              : null;

            // Calculate new expiration
            const tokenExpiration = new Date(
              Date.now() + newTokens.expiresIn * 1000,
            );

            // Update integration with new tokens
            await db
              .update(integrations)
              .set({
                token: encryptedToken,
                refreshToken: encryptedRefreshToken,
                tokenExpiration,
                refreshNeeded: false,
                updatedAt: new Date(),
              })
              .where(eq(integrations.id, post.integrationId));

            logger.info(
              `✅ Token refreshed successfully for integration ${post.integrationId}`,
            );

            // Retry the job immediately with new token
            throw new Error("Token refreshed, job will retry automatically");
          }
        } catch (refreshError) {
          logger.error(`Failed to refresh token:`, refreshError);
          await db
            .update(integrations)
            .set({ refreshNeeded: true })
            .where(eq(integrations.id, post.integrationId));
        }
      }

      // Update post with error
      await db
        .update(posts)
        .set({
          state: "ERROR",
          error: error instanceof Error ? error.message : "Unknown error",
          updatedAt: new Date(),
        })
        .where(eq(posts.id, postId));

      // Re-throw to trigger retry
      throw error;
    } finally {
      // Clean up temporary media files
      if (cleanupMedia) {
        await cleanupMedia();
      }
    }
  }

  /**
   * Get queue instance for monitoring
   */
  getQueue(): Queue | null {
    return this.queue;
  }

  /**
   * Get queue metrics
   */
  async getMetrics() {
    if (!this.isAvailable() || !this.queue) {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 0,
        available: false,
      };
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
      available: true,
    };
  }

  /**
   * Close queue and worker gracefully
   */
  async close(): Promise<void> {
    console.log("Closing queue service...");
    if (this.worker) {
      await this.worker.close();
    }
    if (this.queue) {
      await this.queue.close();
    }
  }
}

// Export singleton instance
export const queueService = new QueueService();
