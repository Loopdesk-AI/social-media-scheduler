import { db } from "../database/db";
import { posts, integrations } from "../database/schema";
import { eq, and, isNull, gte, lte, sql, desc, asc } from "drizzle-orm";
import { queueService } from "./queue.service";
import { integrationManager } from "../providers/integration.manager";
import { NotFoundError, ValidationError } from "../utils/errors";
import { v4 as uuidv4 } from "uuid";
import { contentValidationService } from "./content-validation.service";

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
  platformSpecificContent?: Record<
    string,
    { content?: string; settings?: any }
  >;
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
  async createPost(userId: string, data: CreatePostData) {
    // Verify integration exists and belongs to user
    const integration = await db.query.integrations.findFirst({
      where: and(
        eq(integrations.id, data.integrationId),
        eq(integrations.userId, userId),
        isNull(integrations.deletedAt),
      ),
    });

    if (!integration) {
      throw new NotFoundError("Integration not found");
    }

    if (integration.disabled) {
      throw new ValidationError("Integration is disabled");
    }

    // Check if this is a storage integration - validation is only for social integrations
    if (integration.type === "storage") {
      throw new ValidationError(
        "Content validation is only available for social media accounts, not storage accounts",
      );
    }

    const provider = integrationManager.getSocialIntegration(
      integration.providerIdentifier,
    );

    // Validate content length
    if (data.content.length > provider.maxLength()) {
      throw new ValidationError(
        `Content exceeds maximum length of ${provider.maxLength()} characters`,
      );
    }

    // Validate publish date is in future
    if (data.publishDate <= new Date()) {
      throw new ValidationError("Publish date must be in the future");
    }

    // Generate group ID for multi-platform posts
    const group = uuidv4();

    // DEBUG: Log what we received
    console.log(`🔍 DEBUG createPost - Received data:`, {
      media: data.media,
      settings: data.settings,
      integrationId: data.integrationId,
    });

    // Prepare settings with media
    const settings = {
      ...(data.settings || {}),
      media: data.media || [],
    };

    console.log(`📦 DEBUG merged settings:`, settings);

    // Create post
    const [post] = await db
      .insert(posts)
      .values({
        userId,
        integrationId: data.integrationId,
        content: data.content,
        publishDate: data.publishDate,
        group,
        settings: settings,
        state: "QUEUE",
      })
      .returning();

    // Schedule job
    const jobId = await queueService.addJob(post.id, data.publishDate);

    // Update post with job ID
    await db.update(posts).set({ jobId }).where(eq(posts.id, post.id));

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
    data: CreateMultiPlatformPostData,
  ) {
    // Validate content
    const validation = await contentValidationService.validateContent({
      defaultContent: data.content,
      integrationIds: data.integrationIds,
      platformSpecificContent: data.platformSpecificContent,
    });

    if (!validation.isValid) {
      throw new ValidationError(
        `Content validation failed: ${validation.errors.join(", ")}`,
      );
    }

    // Validate at least one integration
    if (!data.integrationIds || data.integrationIds.length === 0) {
      throw new ValidationError("At least one integration must be selected");
    }

    // Verify all integrations exist and belong to user
    const integrationsList = await db.query.integrations.findMany({
      where: and(
        sql`${integrations.id} IN ${data.integrationIds}`,
        eq(integrations.userId, userId),
        isNull(integrations.deletedAt),
      ),
    });

    if (integrationsList.length !== data.integrationIds.length) {
      throw new NotFoundError("One or more integrations not found");
    }

    // Check for disabled integrations
    const disabledIntegrations = integrationsList.filter((i) => i.disabled);
    if (disabledIntegrations.length > 0) {
      throw new ValidationError(
        `The following integrations are disabled: ${disabledIntegrations.map((i) => i.name).join(", ")}`,
      );
    }

    // Validate publish date is in future
    if (data.publishDate <= new Date()) {
      throw new ValidationError("Publish date must be in the future");
    }

    // Generate group UUID for related posts
    const groupId = uuidv4();

    // Create posts for each integration
    const createdPosts = [];

    for (const integration of integrationsList) {
      // Get provider
      const provider = integrationManager.getSocialIntegration(
        integration.providerIdentifier,
      );

      // Get platform-specific content or use default
      const platformContent = data.platformSpecificContent?.[integration.id];
      const postContent = platformContent?.content || data.content;
      const postSettings = platformContent?.settings || data.settings;

      // Create post record
      const [post] = await db
        .insert(posts)
        .values({
          userId,
          integrationId: integration.id,
          content: postContent,
          publishDate: data.publishDate,
          settings: postSettings || null,
          state: "QUEUE",
          group: groupId,
        })
        .returning();

      // Add job to queue
      const jobId = await queueService.addJob(post.id, data.publishDate);

      // Update post with job ID
      await db.update(posts).set({ jobId }).where(eq(posts.id, post.id));

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
    const conditions = [eq(posts.userId, userId), isNull(posts.deletedAt)];

    if (filters.startDate) {
      conditions.push(gte(posts.publishDate, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(posts.publishDate, filters.endDate));
    }

    if (filters.state) {
      conditions.push(eq(posts.state, filters.state as any));
    }

    if (filters.group) {
      conditions.push(eq(posts.group, filters.group));
    }

    const results = await db.query.posts.findMany({
      where: and(...conditions),
      with: {
        integration: {
          columns: {
            id: true,
            name: true,
            picture: true,
            providerIdentifier: true,
          },
        },
      },
      orderBy: [asc(posts.publishDate)],
      limit: filters.limit || 100,
      offset: filters.offset || 0,
    });

    // Filter by provider if needed (done in memory since it's a join)
    let filteredResults = results;
    if (filters.providerIdentifier) {
      filteredResults = results.filter(
        (p) => p.integration?.providerIdentifier === filters.providerIdentifier,
      );
    }

    return filteredResults.map((post) => ({
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
    const post = await db.query.posts.findFirst({
      where: and(
        eq(posts.id, id),
        eq(posts.userId, userId),
        isNull(posts.deletedAt),
      ),
      with: {
        integration: true,
      },
    });

    if (!post) {
      throw new NotFoundError("Post not found");
    }

    return post;
  }

  /**
   * Update post content and settings
   */
  async updatePost(
    id: string,
    userId: string,
    data: { content?: string; settings?: any },
  ) {
    const post = await this.getPost(id, userId);

    if (post.state !== "QUEUE") {
      throw new ValidationError("Can only update posts in QUEUE state");
    }

    // Validate content length if provided
    if (data.content) {
      // Check if this is a storage integration - validation is only for social integrations
      if (post.integration.type === "storage") {
        throw new ValidationError(
          "Content validation is only available for social media accounts, not storage accounts",
        );
      }

      const provider = integrationManager.getSocialIntegration(
        post.integration.providerIdentifier,
      );

      if (data.content.length > provider.maxLength()) {
        throw new ValidationError(
          `Content exceeds maximum length of ${provider.maxLength()} characters`,
        );
      }
    }

    const [updated] = await db
      .update(posts)
      .set({
        ...(data.content && { content: data.content }),
        ...(data.settings && { settings: data.settings }),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning();

    console.log(`✏️  Updated post ${id}`);

    return updated;
  }

  /**
   * Reschedule post to new date
   */
  async reschedulePost(id: string, userId: string, newPublishDate: Date) {
    const post = await this.getPost(id, userId);

    if (post.state !== "QUEUE") {
      throw new ValidationError("Can only reschedule posts in QUEUE state");
    }

    if (newPublishDate <= new Date()) {
      throw new ValidationError("Publish date must be in the future");
    }

    // Remove old job
    if (post.jobId) {
      await queueService.removeJob(post.jobId);
    }

    // Create new job
    const jobId = await queueService.addJob(post.id, newPublishDate);

    // Update post
    await db
      .update(posts)
      .set({
        publishDate: newPublishDate,
        jobId,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id));

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
    await db
      .update(posts)
      .set({ deletedAt: new Date() })
      .where(eq(posts.id, id));

    console.log(`🗑️  Cancelled post ${id}`);

    return { success: true };
  }

  /**
   * Get posts count by date for calendar
   */
  async getPostsCountByDate(userId: string, startDate: Date, endDate: Date) {
    const results = await db
      .select({
        publishDate: posts.publishDate,
        count: sql<number>`count(*)::int`,
      })
      .from(posts)
      .where(
        and(
          eq(posts.userId, userId),
          isNull(posts.deletedAt),
          gte(posts.publishDate, startDate),
          lte(posts.publishDate, endDate),
        ),
      )
      .groupBy(posts.publishDate);

    return results.map((p) => ({
      date: p.publishDate.toISOString().split("T")[0],
      count: p.count,
    }));
  }

  /**
   * Get all posts in a group
   */
  async getPostsByGroup(userId: string, groupId: string) {
    const results = await db.query.posts.findMany({
      where: and(
        eq(posts.userId, userId),
        eq(posts.group, groupId),
        isNull(posts.deletedAt),
      ),
      with: {
        integration: {
          columns: {
            id: true,
            name: true,
            providerIdentifier: true,
            picture: true,
          },
        },
      },
      orderBy: [asc(posts.createdAt)],
    });

    return results;
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
    },
  ) {
    // Get all posts in group
    const groupPosts = await db.query.posts.findMany({
      where: and(
        eq(posts.userId, userId),
        eq(posts.group, groupId),
        eq(posts.state, "QUEUE"),
        isNull(posts.deletedAt),
      ),
    });

    if (groupPosts.length === 0) {
      throw new NotFoundError(
        "No posts found in group or all posts already published",
      );
    }

    const updatedPosts = [];

    for (const post of groupPosts) {
      // Remove old job if rescheduling
      if (updates.publishDate && post.jobId) {
        await queueService.removeJob(post.jobId);
      }

      // Update post
      const [updated] = await db
        .update(posts)
        .set({
          content: updates.content || post.content,
          publishDate: updates.publishDate || post.publishDate,
          settings: updates.settings || post.settings,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, post.id))
        .returning();

      // Add new job if rescheduling
      if (updates.publishDate) {
        const jobId = await queueService.addJob(
          updated.id,
          updates.publishDate,
        );
        await db.update(posts).set({ jobId }).where(eq(posts.id, updated.id));
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
    const groupPosts = await db.query.posts.findMany({
      where: and(
        eq(posts.userId, userId),
        eq(posts.group, groupId),
        eq(posts.state, "QUEUE"),
        isNull(posts.deletedAt),
      ),
    });

    if (groupPosts.length === 0) {
      throw new NotFoundError(
        "No posts found in group or all posts already published",
      );
    }

    for (const post of groupPosts) {
      // Remove job from queue
      if (post.jobId) {
        await queueService.removeJob(post.jobId);
      }

      // Soft delete post
      await db
        .update(posts)
        .set({ deletedAt: new Date() })
        .where(eq(posts.id, post.id));
    }

    return { cancelled: groupPosts.length };
  }
}

// Export singleton instance
export const postService = new PostService();
