import { db } from "../database/db";
import { media } from "../database/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { storage } from "../storage/storage.factory";
import { randomBytes } from "crypto";
import { join } from "path";
import { unlink, access, constants } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Check if ffmpeg is available on the system
 */
async function isFfmpegAvailable(): Promise<boolean> {
  try {
    await execAsync("ffmpeg -version");
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export class MediaService {
  /**
   * Upload media file
   */
  async uploadMedia(userId: string, file: Express.Multer.File): Promise<any> {
    // Validate file type
    const mimeType = file.mimetype;
    const isImage = mimeType.startsWith("image/");
    const isVideo = mimeType.startsWith("video/");

    if (!isImage && !isVideo) {
      throw new Error("File must be an image or video");
    }

    // Validate file size
    const maxImageSize = 10 * 1024 * 1024; // 10MB
    const maxVideoSize = 5 * 1024 * 1024 * 1024; // 5GB

    if (isImage && file.size > maxImageSize) {
      throw new Error("Image size must not exceed 10MB");
    }

    if (isVideo && file.size > maxVideoSize) {
      throw new Error("Video size must not exceed 5GB");
    }

    // Generate unique filename
    const ext = file.originalname.substring(file.originalname.lastIndexOf("."));
    const filename = `${randomBytes(16).toString("hex")}${ext}`;
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
        console.error("Failed to generate video thumbnail:", error);
      }
    }

    // Create media record
    const [mediaRecord] = await db
      .insert(media)
      .values({
        name: file.originalname,
        path,
        userId,
        thumbnail,
        thumbnailTimestamp: isVideo ? thumbnailTimestamp : null,
        type: isImage ? "image" : "video",
        fileSize: file.size,
      })
      .returning();

    // Clean up temporary file
    try {
      await unlink(file.path);
    } catch (error) {
      console.error("Failed to delete temporary file:", error);
    }

    // Return media with full URL
    const baseUrl =
      process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
    return {
      ...mediaRecord,
      url: `${baseUrl}/uploads/${path}`,
    };
  }

  /**
   * Generate thumbnail for video
   */
  private async generateVideoThumbnail(
    videoPath: string,
    userId: string,
  ): Promise<string> {
    // Check if ffmpeg is available
    const ffmpegAvailable = await isFfmpegAvailable();
    if (!ffmpegAvailable) {
      console.warn(
        "⚠️  ffmpeg is not installed. Video thumbnails will not be generated.",
      );
      console.warn(
        "   Install ffmpeg: brew install ffmpeg (macOS) or apt-get install ffmpeg (Linux)",
      );
      throw new Error("ffmpeg is not installed");
    }

    // Check if video file exists
    const videoExists = await fileExists(videoPath);
    if (!videoExists) {
      throw new Error(`Video file not found: ${videoPath}`);
    }

    const thumbnailFilename = `${randomBytes(16).toString("hex")}.jpg`;
    const thumbnailPath = join("/tmp", thumbnailFilename);
    const destination = join(userId, "thumbnails", thumbnailFilename);

    // Use ffmpeg to extract frame at 1 second (or 0 if video is too short)
    // -y: overwrite output file without asking
    // -ss 00:00:00.5: seek to 0.5 seconds (works better for short videos)
    // -vframes 1: extract only 1 frame
    // -q:v 2: high quality JPEG
    try {
      await execAsync(
        `ffmpeg -y -i "${videoPath}" -ss 00:00:00.5 -vframes 1 -q:v 2 "${thumbnailPath}" 2>&1`,
      );
    } catch (error: any) {
      console.error("ffmpeg error:", error.message || error);
      // Try again at the very beginning of the video
      try {
        await execAsync(
          `ffmpeg -y -i "${videoPath}" -vframes 1 -q:v 2 "${thumbnailPath}" 2>&1`,
        );
      } catch (retryError: any) {
        console.error("ffmpeg retry error:", retryError.message || retryError);
        throw new Error(
          `Failed to generate video thumbnail: ${retryError.message || "ffmpeg failed"}`,
        );
      }
    }

    // Verify thumbnail was created
    const thumbnailExists = await fileExists(thumbnailPath);
    if (!thumbnailExists) {
      throw new Error(
        `Thumbnail file was not created at ${thumbnailPath}. ffmpeg may have failed silently.`,
      );
    }

    // Upload thumbnail
    const path = await storage.upload(thumbnailPath, destination);

    // Clean up temporary thumbnail
    try {
      await unlink(thumbnailPath);
    } catch (error) {
      console.error("Failed to delete temporary thumbnail:", error);
    }

    return path;
  }

  /**
   * List media files
   */
  async listMedia(
    userId: string,
    filters?: {
      type?: "image" | "video";
      limit?: number;
      offset?: number;
    },
  ): Promise<any[]> {
    const conditions = [eq(media.userId, userId), isNull(media.deletedAt)];

    if (filters?.type) {
      conditions.push(eq(media.type, filters.type));
    }

    const results = await db.query.media.findMany({
      where: and(...conditions),
      orderBy: [desc(media.createdAt)],
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    });

    // Add public URLs
    const mediaWithUrls = await Promise.all(
      results.map(async (m) => ({
        ...m,
        url: await storage.getUrl(m.path),
        thumbnailUrl: m.thumbnail ? await storage.getUrl(m.thumbnail) : null,
      })),
    );

    return mediaWithUrls;
  }

  /**
   * Delete media file
   */
  async deleteMedia(id: string, userId: string): Promise<void> {
    // Verify media belongs to user
    const mediaRecord = await db.query.media.findFirst({
      where: and(
        eq(media.id, id),
        eq(media.userId, userId),
        isNull(media.deletedAt),
      ),
    });

    if (!mediaRecord) {
      throw new Error("Media not found");
    }

    // Soft delete media record
    await db
      .update(media)
      .set({ deletedAt: new Date() })
      .where(eq(media.id, id));

    // Optionally delete from storage
    try {
      await storage.delete(mediaRecord.path);
      if (mediaRecord.thumbnail) {
        await storage.delete(mediaRecord.thumbnail);
      }
    } catch (error) {
      console.error("Failed to delete media from storage:", error);
    }
  }

  /**
   * Get media by ID
   */
  async getMedia(id: string, userId: string): Promise<any> {
    const mediaRecord = await db.query.media.findFirst({
      where: and(
        eq(media.id, id),
        eq(media.userId, userId),
        isNull(media.deletedAt),
      ),
    });

    if (!mediaRecord) {
      throw new Error("Media not found");
    }

    return {
      ...mediaRecord,
      url: await storage.getUrl(mediaRecord.path),
      thumbnailUrl: mediaRecord.thumbnail
        ? await storage.getUrl(mediaRecord.thumbnail)
        : null,
    };
  }
}

// Export singleton instance
export const mediaService = new MediaService();
