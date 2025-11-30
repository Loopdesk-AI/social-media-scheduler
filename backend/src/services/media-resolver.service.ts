import { db } from "../database/db";
import { integrations } from "../database/schema";
import { eq, and, isNull } from "drizzle-orm";
import { StorageService } from "./storage.service";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

export class MediaResolverService {
  private storageService: StorageService;
  private uploadsDir: string;

  constructor() {
    this.storageService = new StorageService();
    // Ensure uploads directory exists
    this.uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Resolve media items, downloading storage files if necessary
   * Returns updated media array and a cleanup function
   */
  async resolveMedia(
    media: any[],
    userId: string,
  ): Promise<{ resolvedMedia: any[]; cleanup: () => Promise<void> }> {
    const resolvedMedia = [...media];
    const tempFiles: string[] = [];

    try {
      for (let i = 0; i < resolvedMedia.length; i++) {
        const item = resolvedMedia[i];

        // Check if path is a storage path: /storage/:integrationId/files/:fileId
        const storageMatch = item.path.match(
          /^\/storage\/([^\/]+)\/files\/([^\/]+)$/,
        );

        if (storageMatch) {
          const [, integrationId, fileId] = storageMatch;
          console.log(
            `⬇️  Resolving storage file: ${fileId} from integration: ${integrationId}`,
          );

          // Get integration using Drizzle
          const integration = await db.query.integrations.findFirst({
            where: and(
              eq(integrations.id, integrationId),
              eq(integrations.userId, userId),
              isNull(integrations.deletedAt),
            ),
          });

          if (!integration) {
            throw new Error(`Storage integration not found: ${integrationId}`);
          }

          // **NEW APPROACH: Generate PUBLIC shared link instead of downloading!**
          // This works for Instagram & LinkedIn which can fetch from URLs
          // YouTube still requires file upload, so we'll handle both cases

          try {
            // Try to get public shared link (works for Dropbox, Google Drive)
            const publicUrl = await this.storageService.getPublicUrl(
              integration,
              fileId,
            );

            if (publicUrl) {
              console.log(`🔗 Using public URL: ${publicUrl}`);
              item.path = publicUrl;
              item.isPublicUrl = true; // Flag so provider knows it's a URL, not a file
              continue; // Skip download
            }
          } catch (error) {
            console.warn(
              `⚠️  Failed to get public URL, falling back to download: ${error}`,
            );
          }

          // **FALLBACK: Download for YouTube or if public URL fails**
          console.log(`📥 Downloading file for local access...`);
          const {
            path: tempPath,
            filename,
            mimeType,
          } = await this.storageService.downloadFileToTemp(integration, fileId);

          // Move to uploads directory to make it publicly accessible (needed for Instagram)
          // We use a unique name to avoid collisions
          const uniqueFilename = `${uuidv4()}-${filename}`;
          const publicPath = path.join(this.uploadsDir, uniqueFilename);

          await fs.promises.copyFile(tempPath, publicPath);

          // Clean up the original temp file immediately
          try {
            await fs.promises.unlink(tempPath);
          } catch (e) {
            console.warn("Failed to delete temp file:", tempPath);
          }

          // Track for cleanup
          tempFiles.push(publicPath);

          // IMPORTANT: Return FULL PATH, not just filename!
          // LinkedIn needs the full path to find the file
          item.path = publicPath;

          // Update type if not set
          if (!item.type) {
            item.type = mimeType.startsWith("video/") ? "video" : "image";
          }

          console.log(`✅ Resolved to local file: ${publicPath}`);
        }
      }

      return {
        resolvedMedia,
        cleanup: async () => {
          console.log(`🧹 Cleaning up ${tempFiles.length} temp files...`);
          for (const file of tempFiles) {
            try {
              if (fs.existsSync(file)) {
                await fs.promises.unlink(file);
              }
            } catch (error) {
              console.error(`Failed to delete temp file ${file}:`, error);
            }
          }
        },
      };
    } catch (error) {
      // If resolution fails, clean up any files already downloaded
      for (const file of tempFiles) {
        try {
          if (fs.existsSync(file)) {
            await fs.promises.unlink(file);
          }
        } catch (e) {
          // Ignore
        }
      }
      throw error;
    }
  }
}

export const mediaResolverService = new MediaResolverService();
