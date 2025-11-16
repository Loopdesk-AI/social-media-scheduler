// Media controller

import { Request, Response, NextFunction } from 'express';
import { mediaService } from '../services/media.service';

export class MediaController {
  /**
   * Upload media file
   */
  uploadMedia = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id; // Fix: Use user ID instead of organizationId
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const media = await mediaService.uploadMedia(userId, file);

      res.json(media);
    } catch (error) {
      next(error);
    }
  };

  /**
   * List media files
   */
  listMedia = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id; // Fix: Use user ID instead of organizationId
      const { type, limit, offset } = req.query;

      const media = await mediaService.listMedia(userId, {
        type: type as 'image' | 'video' | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json(media);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get single media
   */
  getMedia = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id; // Fix: Use user ID instead of organizationId
      const { id } = req.params;

      const media = await mediaService.getMedia(id, userId);

      res.json(media);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete media
   */
  deleteMedia = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id; // Fix: Use user ID instead of organizationId
      const { id } = req.params;

      await mediaService.deleteMedia(id, userId);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  };
}