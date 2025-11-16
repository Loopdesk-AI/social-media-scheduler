import { prisma } from '../database/prisma.client';
import { queueService } from './queue.service';
import { integrationManager } from '../providers/integration.manager';
import { NotFoundError, ValidationError } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';
import { contentValidationService } from './content-validation.service';

interface CreatePostData {
  integrationId: string;
  content: string;
  publishDate: Date;
  settings?: any;
  media?: Array<{ path: string; type: string }>;
}

interface CreateMultiPlatformPostData {
  integrationIds: string[];
  content: string;
  publishDate: Date;
  settings?: any;
  platformSpecificContent?: Record<string, { content?: string; settings?: any }>;
}

interface PostFilters {
  startDate?: Date;
  endDate?: Date;
  providerIdentifier?: string;
  state?: string;
  group?: string;
  limit?: number;
  offset?: number;
}

/**
 * Post Service
 * Handles post creation, scheduling, and management
 */
export class PostService {
  /**
   * Create and schedule a post
   */
  async createPost(
    userId: string,
    data: CreatePostData
  ) {
    // Verify integration exists and belongs to user
    const integration = await prisma.integration.findFirst({
      where: {
        id: data.integrationId,
        userId,
        deletedAt: null,
      },
    });

    if (!integration) {
      throw new NotFoundError('Integration not found');
    }

    if (integration.disabled) {
      throw new ValidationError('Integration is disabled');
    }

    // Get provider to validate content
    const provider = integrationManager.getSocialIntegration(
      integration.providerIdentifier
    );

    // Validate content length
    if (data.content.length > provider.maxLength()) {
      throw new ValidationError(
        `Content exceeds maximum length of ${provider.maxLength()} characters`
      );
    }

    // Validate publish date is in future
    if (data.publishDate <= new Date()) {
      throw new ValidationError('Publish date must be in the future');
    }

    // Generate group ID for multi-platform posts
    const group = uuidv4();

    // Prepare settings with media
    const settings = {
      ...(data.settings || {}),
      media: data.media || [],
    };

    // Create post
    const post = await prisma.post.create({
      data: {
        userId,
        integrationId: data.integrationId,
        content: data.content,
        publishDate: data.publishDate,
        group,
        settings: JSON.stringify(settings),
        state: 'QUEUE',
      },
      include: {
        integration: true,
      },
    });

    // Schedule job
    const jobId = await queueService.addJob(post.id, data.publishDate);

    // Update post with job ID
    await prisma.post.update({
      where: { id: post.id },
      data: { jobId },
    });

    console.log(`📝 Created post ${post.id} for ${integration.name}`);

    return {
      id: post.id,
      content: post.content,
      publishDate: post.publishDate,
      state: post.state,
      integration: {
        id: integration.id,
        name: integration.name,
        providerIdentifier: integration.providerIdentifier,
      },
    };
  }

  /**
   * Create multi-platform post (post to multiple platforms simultaneously)
   */
  async createMultiPlatformPost(
    userId: string,
    data: CreateMultiPlatformPostData
  ) {
    // Validate content
    const validation = await contentValidationService.validateContent({
      defaultContent: data.content,
      integrationIds: data.integrationIds,
      platformSpecificContent: data.platformSpecificContent
    });

    if (!validation.isValid) {
      throw new ValidationError(`Content validation failed: ${validation.errors.join(', ')}`);
    }

    // Validate at least one integration
    if (!data.integrationIds || data.integrationIds.length === 0) {
      throw new ValidationError('At least one integration must be selected');
    }

    // Verify all integrations exist and belong to user
    const integrations = await prisma.integration.findMany({
      where: {
        id: { in: data.integrationIds },
        userId,
        deletedAt: null,
      },
    });

    if (integrations.length !== data.integrationIds.length) {
      throw new NotFoundError('One or more integrations not found');
    }

    // Check for disabled integrations
    const disabledIntegrations = integrations.filter(i => i.disabled);
    if (disabledIntegrations.length > 0) {
      throw new ValidationError(
        `The following integrations are disabled: ${disabledIntegrations.map(i => i.name).join(', ')}`
      );
    }

    // Validate publish date is in future
    if (data.publishDate <= new Date()) {
      throw new ValidationError('Publish date must be in the future');
    }

    // Generate group UUID for related posts
    const groupId = uuidv4();

    // Create posts for each integration
    const createdPosts = [];

    for (const integration of integrations) {
      // Get provider
      const provider = integrationManager.getSocialIntegration(integration.providerIdentifier);

      // Get platform-specific content or use default
      const platformContent = data.platformSpecificContent?.[integration.id];
      const postContent = platformContent?.content || data.content;
      const postSettings = platformContent?.settings || data.settings;

      // Create post record
      const post = await prisma.post.create({
        data: {
          userId,
          integrationId: integration.id,
          content: postContent,
          publishDate: data.publishDate,
          settings: postSettings ? JSON.stringify(postSettings) : null,
          state: 'QUEUE',
          group: groupId,
        },
      });

      // Add job to queue
      const jobId = await queueService.addJob(post.id, data.publishDate);

      // Update post with job ID
      await prisma.post.update({
        where: { id: post.id },
        data: { jobId },
      });

      createdPosts.push({
        ...post,
        integration: {
          id: integration.id,
          name: integration.name,
          providerIdentifier: integration.providerIdentifier,
          picture: integration.picture,
        },
      });
    }

    return {
      groupId,
      posts: createdPosts,
      totalPosts: createdPosts.length,
    };
  }

  /**
   * List posts with filters
   */
  async listPosts(userId: string, filters: PostFilters = {}) {
    const where: any = {
      userId,
      deletedAt: null,
    };

    if (filters.startDate || filters.endDate) {
      where.publishDate = {};
      if (filters.startDate) {
        where.publishDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.publishDate.lte = filters.endDate;
      }
    }

    if (filters.providerIdentifier) {
      where.integration = {
        providerIdentifier: filters.providerIdentifier,
      };
    }

    if (filters.state) {
      where.state = filters.state;
    }

    if (filters.group) {
      where.group = filters.group;
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        integration: {
          select: {
            id: true,
            name: true,
            picture: true,
            providerIdentifier: true,
          },
        },
      },
      orderBy: {
        publishDate: 'asc',
      },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    });

    return posts.map((post: any) => ({
      id: post.id,
      content: post.content,
      publishDate: post.publishDate,
      state: post.state,
      group: post.group,
      settings: post.settings,
      releaseURL: post.releaseURL,
      releaseId: post.releaseId,
      error: post.error,
      integration: post.integration,
      createdAt: post.createdAt,
    }));
  }

  /**
   * Get single post
   */
  async getPost(id: string, userId: string) {
    const post = await prisma.post.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        integration: true,
      },
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    return post;
  }

  /**
   * Update post content and settings
   */
  async updatePost(
    id: string,
    userId: string,
    data: { content?: string; settings?: any }
  ) {
    const post = await this.getPost(id, userId);

    if (post.state !== 'QUEUE') {
      throw new ValidationError('Can only update posts in QUEUE state');
    }

    // Validate content length if provided
    if (data.content) {
      const provider = integrationManager.getSocialIntegration(
        post.integration.providerIdentifier
      );

      if (data.content.length > provider.maxLength()) {
        throw new ValidationError(
          `Content exceeds maximum length of ${provider.maxLength()} characters`
        );
      }
    }

    const updated = await prisma.post.update({
      where: { id },
      data: {
        ...(data.content && { content: data.content }),
        ...(data.settings && { settings: JSON.stringify(data.settings) }),
      },
    });

    console.log(`✏️  Updated post ${id}`);

    return updated;
  }

  /**
   * Reschedule post to new date
   */
  async reschedulePost(
    id: string,
    userId: string,
    newPublishDate: Date
  ) {
    const post = await this.getPost(id, userId);

    if (post.state !== 'QUEUE') {
      throw new ValidationError('Can only reschedule posts in QUEUE state');
    }

    if (newPublishDate <= new Date()) {
      throw new ValidationError('Publish date must be in the future');
    }

    // Remove old job
    if (post.jobId) {
      await queueService.removeJob(post.jobId);
    }

    // Create new job
    const jobId = await queueService.addJob(post.id, newPublishDate);

    // Update post
    await prisma.post.update({
      where: { id },
      data: {
        publishDate: newPublishDate,
        jobId,
      },
    });

    console.log(`📅 Rescheduled post ${id} to ${newPublishDate}`);

    return { success: true };
  }

  /**
   * Cancel post (soft delete)
   */
  async cancelPost(id: string, userId: string) {
    const post = await this.getPost(id, userId);

    // Remove job from queue
    if (post.jobId) {
      await queueService.removeJob(post.jobId);
    }

    // Soft delete post
    await prisma.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    console.log(`🗑️  Cancelled post ${id}`);

    return { success: true };
  }

  /**
   * Get posts count by date for calendar
   */
  async getPostsCountByDate(
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    const posts = await prisma.post.groupBy({
      by: ['publishDate'],
      where: {
        userId,
        deletedAt: null,
        publishDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    return posts.map((p: any) => ({
      date: p.publishDate.toISOString().split('T')[0],
      count: p._count,
    }));
  }

  /**
   * Get all posts in a group
   */
  async getPostsByGroup(userId: string, groupId: string) {
    const posts = await prisma.post.findMany({
      where: {
        userId,
        group: groupId,
        deletedAt: null,
      },
      include: {
        integration: {
          select: {
            id: true,
            name: true,
            providerIdentifier: true,
            picture: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return posts;
  }

  /**
   * Update all posts in a group
   */
  async updateGroupPosts(
    userId: string,
    groupId: string,
    updates: {
      content?: string;
      publishDate?: Date;
      settings?: any;
    }
  ) {
    // Get all posts in group
    const posts = await prisma.post.findMany({
      where: {
        userId,
        group: groupId,
        state: 'QUEUE',
        deletedAt: null,
      },
    });

    if (posts.length === 0) {
      throw new NotFoundError('No posts found in group or all posts already published');
    }

    const updatedPosts = [];

    for (const post of posts) {
      // Remove old job if rescheduling
      if (updates.publishDate && post.jobId) {
        await queueService.removeJob(post.jobId);
      }

      // Update post
      const updated = await prisma.post.update({
        where: { id: post.id },
        data: {
          content: updates.content || post.content,
          publishDate: updates.publishDate || post.publishDate,
          settings: updates.settings ? JSON.stringify(updates.settings) : post.settings,
        },
      });

      // Add new job if rescheduling
      if (updates.publishDate) {
        const jobId = await queueService.addJob(updated.id, updates.publishDate);
        await prisma.post.update({
          where: { id: updated.id },
          data: { jobId },
        });
      }

      updatedPosts.push(updated);
    }

    return updatedPosts;
  }

  /**
   * Cancel all posts in a group
   */
  async cancelGroupPosts(userId: string, groupId: string) {
    // Get all posts in group
    const posts = await prisma.post.findMany({
      where: {
        userId,
        group: groupId,
        state: 'QUEUE',
        deletedAt: null,
      },
    });

    if (posts.length === 0) {
      throw new NotFoundError('No posts found in group or all posts already published');
    }

    for (const post of posts) {
      // Remove job from queue
      if (post.jobId) {
        await queueService.removeJob(post.jobId);
      }

      // Soft delete post
      await prisma.post.update({
        where: { id: post.id },
        data: { deletedAt: new Date() },
      });
    }

    return { cancelled: posts.length };
  }
}

// Export singleton instance
export const postService = new PostService();