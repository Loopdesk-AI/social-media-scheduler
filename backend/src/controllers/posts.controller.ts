import { Request, Response, NextFunction } from 'express';
import { PostService } from '../services/post.service';

const postService = new PostService();

export class PostsController {
  /**
   * POST /api/posts
   * Create new post
   */
  async createPost(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { integrationId, content, publishDate, settings, media } = req.body;

      const post = await postService.createPost(userId, {
        integrationId,
        content,
        publishDate: new Date(publishDate),
        settings,
        media,
      });

      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/posts
   * List posts with filters
   */
  async listPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { startDate, endDate, providerIdentifier, state, group, limit, offset } = req.query;

      const posts = await postService.listPosts(userId, {
        ...(startDate && { startDate: new Date(startDate as string) }),
        ...(endDate && { endDate: new Date(endDate as string) }),
        ...(providerIdentifier && { providerIdentifier: providerIdentifier as string }),
        ...(state && { state: state as string }),
        ...(group && { group: group as string }),
        ...(limit && { limit: parseInt(limit as string) }),
        ...(offset && { offset: parseInt(offset as string) }),
      });

      res.json(posts);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/posts/:id
   * Get single post
   */
  async getPost(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const post = await postService.getPost(id, userId);
      res.json(post);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/posts/:id
   * Update post
   */
  async updatePost(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { content, settings } = req.body;

      const post = await postService.updatePost(id, userId, {
        content,
        settings,
      });

      res.json(post);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/posts/:id/reschedule
   * Reschedule post
   */
  async reschedulePost(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { publishDate } = req.body;

      const result = await postService.reschedulePost(
        id,
        userId,
        new Date(publishDate)
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/posts/:id
   * Cancel post
   */
  async cancelPost(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const result = await postService.cancelPost(id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/posts/calendar/counts
   * Get post counts by date for calendar
   */
  async getPostsCounts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { startDate, endDate } = req.query;

      const counts = await postService.getPostsCountByDate(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json(counts);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/posts/multi-platform
   * Create multi-platform post
   */
  async createMultiPlatformPost(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id; // Fix: Use userId instead of organizationId
      const { integrationIds, content, publishDate, settings, platformSpecificContent } = req.body;

      const result = await postService.createMultiPlatformPost(userId, {
        integrationIds,
        content,
        publishDate: new Date(publishDate),
        settings,
        platformSpecificContent,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/posts/group/:groupId
   * Get all posts in a group
   */
  async getPostsByGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id; // Fix: Use userId instead of organizationId
      const { groupId } = req.params;

      const posts = await postService.getPostsByGroup(userId, groupId);

      res.json(posts);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/posts/group/:groupId
   * Update all posts in a group
   */
  async updateGroupPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id; // Fix: Use userId instead of organizationId
      const { groupId } = req.params;
      const { content, publishDate, settings } = req.body;

      const posts = await postService.updateGroupPosts(userId, groupId, {
        content,
        publishDate: publishDate ? new Date(publishDate) : undefined,
        settings,
      });

      res.json(posts);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/posts/group/:groupId
   * Cancel all posts in a group
   */
  async cancelGroupPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id; // Fix: Use userId instead of organizationId
      const { groupId } = req.params;

      const result = await postService.cancelGroupPosts(userId, groupId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
