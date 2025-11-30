// Media Service - Handle file uploads and media management

import { prisma } from '../database/prisma.client';
import { storage } from '../storage/storage.factory';
import sharp from 'sharp';
import { randomBytes } from 'crypto';
import { join } from 'path';
import { stat, unlink } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class MediaService {
  /**
   * Upload media file
   */
  async uploadMedia(
    userId: string,
    file: Express.Multer.File
  ): Promise<any> {
    // Validate file type
    const mimeType = file.mimetype;
    const isImage = mimeType.startsWith('image/');
    const isVideo = mimeType.startsWith('video/');

    if (!isImage && !isVideo) {
      throw new Error('File must be an image or video');
    }

    // Validate file size
    const maxImageSize = 10 * 1024 * 1024; // 10MB
    const maxVideoSize = 5 * 1024 * 1024 * 1024; // 5GB

    if (isImage && file.size > maxImageSize) {
      throw new Error('Image size must not exceed 10MB');
    }

    if (isVideo && file.size > maxVideoSize) {
      throw new Error('Video size must not exceed 5GB');
    }

    // Generate unique filename
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.'));
    const filename = `${randomBytes(16).toString('hex')}${ext}`;
    const destination = join(userId, filename);

    // Upload to storage
    const path = await storage.upload(file.path, destination);

    // Generate thumbnail for videos
    let thumbnail: string | null = null;
    let thumbnailTimestamp = 0;

    if (isVideo) {
      try {
        thumbnail = await this.generateVideoThumbnail(file.path, userId);
        thumbnailTimestamp = 1000; // 1 second into video
      } catch (error) {
        console.error('Failed to generate video thumbnail:', error);
      }
    }

    // Create media record
    const media = await prisma.media.create({
      data: {
        name: file.originalname,
        path,
        userId,
        thumbnail,
        thumbnailTimestamp: isVideo ? thumbnailTimestamp : null,
        type: isImage ? 'image' : 'video',
        fileSize: file.size,
      },
    });

    // Clean up temporary file
    try {
      await unlink(file.path);
    } catch (error) {
      console.error('Failed to delete temporary file:', error);
    }

    // Return media with full URL
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
    return {
      ...media,
      url: `${baseUrl}/uploads/${path}`,
    };
  }

  /**
   * Generate thumbnail for video
   */
  private async generateVideoThumbnail(
    videoPath: string,
    userId: string
  ): Promise<string> {
    const thumbnailFilename = `${randomBytes(16).toString('hex')}.jpg`;
    const thumbnailPath = join('/tmp', thumbnailFilename);
    const destination = join(userId, 'thumbnails', thumbnailFilename);

    // Use ffmpeg to extract frame at 1 second
    try {
      await execAsync(
        `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 -q:v 2 "${thumbnailPath}"`
      );
    } catch (error) {
      // If ffmpeg fails, try using sharp with first frame
      // This is a fallback and may not work for all video formats
      throw new Error('Failed to generate video thumbnail');
    }

    // Upload thumbnail
    const path = await storage.upload(thumbnailPath, destination);

    // Clean up temporary thumbnail
    try {
      await unlink(thumbnailPath);
    } catch (error) {
      console.error('Failed to delete temporary thumbnail:', error);
    }

    return path;
  }

  /**
   * List media files
   */
  async listMedia(
    userId: string,
    filters?: {
      type?: 'image' | 'video';
      limit?: number;
      offset?: number;
    }
  ): Promise<any[]> {
    const where: any = {
      userId,
      deletedAt: null,
    };

    if (filters?.type) {
      where.type = filters.type;
    }

    const media = await prisma.media.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });

    // Add public URLs
    const mediaWithUrls = await Promise.all(
      media.map(async (m: any) => ({
        ...m,
        url: await storage.getUrl(m.path),
        thumbnailUrl: m.thumbnail ? await storage.getUrl(m.thumbnail) : null,
      }))
    );

    return mediaWithUrls;
  }

  /**
   * Delete media file
   */
  async deleteMedia(id: string, userId: string): Promise<void> {
    // Verify media belongs to user
    const media = await prisma.media.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!media) {
      throw new Error('Media not found');
    }

    // Check if media is used in scheduled posts
    const postsUsingMedia = await prisma.post.count({
      where: {
        userId,
        state: 'QUEUE',
        deletedAt: null,
        settings: {
          array_contains: media.id,
        },
      },
    });

    if (postsUsingMedia > 0) {
      throw new Error('Media is used in scheduled posts and cannot be deleted');
    }

    // Soft delete media record
    await prisma.media.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    // Optionally delete from storage
    try {
      await storage.delete(media.path);
      if (media.thumbnail) {
        await storage.delete(media.thumbnail);
      }
    } catch (error) {
      console.error('Failed to delete media from storage:', error);
    }
  }

  /**
   * Get media by ID
   */
  async getMedia(id: string, userId: string): Promise<any> {
    const media = await prisma.media.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!media) {
      throw new Error('Media not found');
    }

    return {
      ...media,
      url: await storage.getUrl(media.path),
      thumbnailUrl: media.thumbnail ? await storage.getUrl(media.thumbnail) : null,
    };
  }
}

// Export singleton instance
export const mediaService = new MediaService();
