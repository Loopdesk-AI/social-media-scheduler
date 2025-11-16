import { Queue, Worker, Job } from 'bullmq';
import { prisma } from '../database/prisma.client';
import { integrationManager } from '../providers/integration.manager';
import { decrypt } from './encryption.service';
import { RefreshToken } from '../utils/errors';
import { safeJsonParse } from '../utils/helpers';
import { metricsService } from '../monitoring/metrics.service';
import logger from '../utils/logger';

/**
 * Queue Service
 * Manages BullMQ queue and worker for processing scheduled posts
 */
export class QueueService {
  private queue: Queue;
  private worker: Worker;

  constructor() {
    const connection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    };

    // Initialize queue
    this.queue = new Queue('posts', { connection });

    // Initialize worker in same process
    this.worker = new Worker('posts', this.processJob.bind(this), {
      connection,
      concurrency: 5,
    });

    // Event listeners
    this.worker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed successfully`);
      metricsService.queueJobsProcessed.labels('completed').inc();
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed: ${err.message}`);
      metricsService.queueJobsProcessed.labels('failed').inc();
    });

    this.worker.on('error', (err) => {
      logger.error('Worker error:', err);
    });

    logger.info('BullMQ worker initialized');
  }

  /**
   * Add job to queue
   * @param postId Post ID to publish
   * @param publishDate When to publish
   * @returns Job ID
   */
  async addJob(postId: string, publishDate: Date): Promise<string> {
    const delay = publishDate.getTime() - Date.now();
    
    if (delay < 0) {
      throw new Error('Publish date must be in the future');
    }

    const job = await this.queue.add(
      'publish-post',
      { postId },
      {
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );

    console.log(`📅 Scheduled job ${job.id} for post ${postId} in ${Math.round(delay / 1000)}s`);
    return job.id!;
  }

  /**
   * Remove job from queue
   * @param jobId Job ID to remove
   */
  async removeJob(jobId: string): Promise<void> {
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
    const startTime = Date.now();

    logger.info(`Processing job ${job.id} for post ${postId}`);

    // 1. Fetch post with integration
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { integration: true },
    });

    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    if (post.state !== 'QUEUE') {
      console.log(`⏭️  Post ${postId} is not in QUEUE state, skipping`);
      return;
    }

    // 2. Get provider
    const provider = integrationManager.getSocialIntegration(
      post.integration.providerIdentifier
    );

    // 3. Decrypt token
    const accessToken = decrypt(post.integration.token);

    // 4. Parse settings and prepare post details
    const settings: any = safeJsonParse(post.settings || '{}', {});
    const postDetails = [
      {
        id: post.id,
        message: post.content,
        media: settings.media || [],
        settings,
      },
    ];

    // 5. Publish post
    try {
      logger.info(`Publishing to ${provider.identifier}...`);
      
      const result = await provider.post(
        post.integration.internalId,
        accessToken,
        postDetails,
        post.integration
      );

      // Record metrics
      const duration = (Date.now() - startTime) / 1000;
      metricsService.queueJobDuration.labels(provider.identifier).observe(duration);
      metricsService.postsPublished.labels(provider.identifier).inc();

      // 6. Update post status
      await prisma.post.update({
        where: { id: postId },
        data: {
          state: 'PUBLISHED',
          releaseURL: result[0].releaseURL,
          releaseId: result[0].postId,
          error: null,
        },
      });

      logger.info(`Post ${postId} published successfully: ${result[0].releaseURL}`);
    } catch (error) {
      logger.error(`Failed to publish post ${postId}:`, error);

      // Record failure metrics
      const errorType = error instanceof RefreshToken ? 'token_refresh' : 'publish_error';
      metricsService.queueJobsFailed.labels(provider.identifier).inc();
      metricsService.postsFailed.labels(provider.identifier, errorType).inc();

      // Handle token refresh errors - automatically refresh the token
      if (error instanceof RefreshToken) {
        try {
          logger.info(`🔄 Attempting to refresh token for integration ${post.integrationId}`);
          
          // Get refresh token
          const refreshToken = post.integration.refreshToken 
            ? decrypt(post.integration.refreshToken)
            : null;

          if (!refreshToken) {
            logger.error('No refresh token available, manual reconnection required');
            await prisma.integration.update({
              where: { id: post.integrationId },
              data: { refreshNeeded: true },
            });
          } else {
            // Refresh the token using the provider
            const newTokens = await provider.refreshToken(refreshToken);
            
            // Encrypt new tokens
            const { encrypt } = await import('./encryption.service');
            const encryptedToken = encrypt(newTokens.accessToken);
            const encryptedRefreshToken = newTokens.refreshToken 
              ? encrypt(newTokens.refreshToken)
              : null;

            // Calculate new expiration
            const tokenExpiration = new Date(Date.now() + newTokens.expiresIn * 1000);

            // Update integration with new tokens
            await prisma.integration.update({
              where: { id: post.integrationId },
              data: {
                token: encryptedToken,
                refreshToken: encryptedRefreshToken,
                tokenExpiration,
                refreshNeeded: false,
              },
            });

            logger.info(`✅ Token refreshed successfully for integration ${post.integrationId}`);
            
            // Retry the job immediately with new token
            throw new Error('Token refreshed, job will retry automatically');
          }
        } catch (refreshError) {
          logger.error(`Failed to refresh token:`, refreshError);
          await prisma.integration.update({
            where: { id: post.integrationId },
            data: { refreshNeeded: true },
          });
        }
      }

      // Update post with error
      await prisma.post.update({
        where: { id: postId },
        data: {
          state: 'ERROR',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      // Re-throw to trigger retry
      throw error;
    }
  }

  /**
   * Get queue instance for monitoring
   */
  getQueue(): Queue {
    return this.queue;
  }

  /**
   * Get queue metrics
   */
  async getMetrics() {
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
    };
  }

  /**
   * Close queue and worker gracefully
   */
  async close(): Promise<void> {
    console.log('Closing queue service...');
    await this.worker.close();
    await this.queue.close();
  }
}

// Export singleton instance
export const queueService = new QueueService();
