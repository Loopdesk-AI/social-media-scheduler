import { Request, Response } from "express";
import { StorageService } from "../services/storage.service";
import { integrationService } from "../services/integration.service";
import { decrypt } from "../services/encryption.service";

// Default user ID for simplified operation (no auth)
const DEFAULT_USER_ID = "default-user";

export class StorageController {
  private storageService: StorageService;
  private integrationService: any;

  constructor() {
    this.storageService = new StorageService();
    this.integrationService = integrationService;
  }

  /**
   * GET /api/storage/providers
   * List available storage providers
   */
  async getProviders(req: Request, res: Response) {
    try {
      const providers = this.storageService.getProviders();
      res.json(providers);
    } catch (error) {
      res.status(500).json({
        error: "Failed to retrieve storage providers",
        message: (error as Error).message,
      });
    }
  }

  /**
   * GET /api/storage/auth/:provider
   * Get OAuth URL for a storage provider
   */
  async getAuthUrl(req: Request, res: Response) {
    try {
      const { provider } = req.params;
      const userId = (req as any).user?.id;

      console.log(`🔐 Auth URL request for ${provider}, user ID: ${userId}`);

      // For backward compatibility, if no user ID, use the old method
      if (!userId) {
        console.log(
          `⚠️  No user ID found for ${provider}, using deprecated method`,
        );
        // Get the provider
        const providers = this.storageService.getProviders();
        const providerInfo = providers.find((p) => p.identifier === provider);

        if (!providerInfo) {
          return res.status(404).json({
            error: "Provider not found",
            message: `Storage provider ${provider} not found`,
          });
        }

        // Get the actual OAuth URL from the storage service
        const authData = await this.storageService.getAuthUrl(provider);

        res.json(authData);
      } else {
        console.log(
          `✅ User ID found for ${provider}: ${userId}, using state management`,
        );
        // Generate auth URL with state management
        const authData = await this.storageService.generateAuthUrl(
          provider,
          userId,
        );
        res.json(authData);
      }
    } catch (error) {
      console.error("Failed to generate auth URL:", error);
      res.status(500).json({
        error: "Failed to generate auth URL",
        message: (error as Error).message,
      });
    }
  }

  /**
   * GET /api/storage/callback/:provider
   * OAuth callback for storage provider
   */
  async handleCallback(req: Request, res: Response) {
    try {
      const { provider } = req.params;
      const { code, state } = req.query;

      if (!code || typeof code !== "string") {
        return res.status(400).json({
          error: "Invalid request",
          message: "Authorization code is required",
        });
      }

      if (!state || typeof state !== "string") {
        return res.status(400).json({
          error: "Invalid request",
          message: "State parameter is required",
        });
      }

      // Get userId from state
      const userId = await this.storageService.getUserIdFromState(state);

      if (!userId) {
        throw new Error("Invalid OAuth state: user session not found");
      }

      // Get the provider
      const storageProvider = this.storageService.getProviderById(provider);

      // Authenticate with the provider using the code
      const authDetails = await storageProvider.authenticate({
        code,
      });

      // Create or update the integration in the database
      const integration =
        await this.integrationService.createOrUpdateStorageIntegration(
          userId,
          provider,
          authDetails,
        );

      // Redirect back to the frontend with success
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(`${frontendUrl}/?connected=true&provider=${provider}`);
    } catch (error) {
      console.error("Storage callback error:", error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(
        `${frontendUrl}/?error=connection_failed&message=${encodeURIComponent((error as Error).message)}&provider=${req.params.provider}`,
      );
    }
  }

  /**
   * GET /api/storage/integrations
   * List user's connected storage integrations
   */
  async getIntegrations(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || DEFAULT_USER_ID;

      // Get storage integrations for the user
      const integrations =
        await this.integrationService.getIntegrationsByUserIdAndType(
          userId,
          "storage",
        );

      res.json(integrations);
    } catch (error) {
      res.status(500).json({
        error: "Failed to retrieve storage integrations",
        message: (error as Error).message,
      });
    }
  }

  /**
   * DELETE /api/storage/integrations/:id
   * Disconnect a storage integration
   */
  async deleteIntegration(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || DEFAULT_USER_ID;

      // Get the integration to verify ownership
      const integration = await this.integrationService.getIntegrationById(id);

      if (!integration) {
        return res.status(404).json({
          error: "Integration not found",
          message: "Storage integration not found",
        });
      }

      if (integration.userId !== userId) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You do not have permission to delete this integration",
        });
      }

      // Delete the integration
      await this.integrationService.deleteIntegration(id);

      res.json({
        success: true,
        message: "Storage integration disconnected successfully",
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to disconnect storage integration",
        message: (error as Error).message,
      });
    }
  }

  /**
   * GET /api/storage/:integrationId/files
   * List files in a storage integration
   */
  async listFiles(req: Request, res: Response) {
    try {
      const { integrationId } = req.params;
      const { folderId, pageToken } = req.query;
      const userId = (req as any).user?.id || DEFAULT_USER_ID;

      console.log(
        `🔍 File listing request - Integration: ${integrationId}, User: ${userId}, Folder: ${folderId || "root"}`,
      );

      // Get the integration to verify ownership
      const integration =
        await this.integrationService.getIntegrationById(integrationId);

      if (!integration) {
        console.log(`❌ Integration not found: ${integrationId}`);
        return res.status(404).json({
          error: "Integration not found",
          message: "Storage integration not found",
        });
      }

      console.log(
        `✅ Integration found: ${integration.name} (${integration.providerIdentifier})`,
      );
      console.log(`🔄 Integration details:`, {
        id: integration.id,
        refreshToken: integration.refreshToken ? "Present" : "Missing",
        tokenExpiration: integration.tokenExpiration,
        refreshNeeded: integration.refreshNeeded,
      });

      if (integration.userId !== userId) {
        console.log(
          `❌ User mismatch - Integration user: ${integration.userId}, Request user: ${userId}`,
        );
        return res.status(403).json({
          error: "Forbidden",
          message: "You do not have permission to access this integration",
        });
      }

      // List files
      console.log(`🔄 Calling storage service to list files...`);
      const result = await this.storageService.listFiles(
        integration,
        folderId as string | undefined,
        pageToken as string | undefined,
      );

      console.log(`🔍 Storage service listFiles result:`, {
        fileCount: result.files.length,
        nextPageToken: result.nextPageToken,
        sampleFiles: result.files.slice(0, 3),
      });

      // Transform backend StorageFile objects to match frontend expectations
      const transformedFiles = result.files.map((file) => {
        // Format file size
        const formatFileSize = (bytes: number): string => {
          if (bytes === 0) return "0 Bytes";
          const k = 1024;
          const sizes = ["Bytes", "KB", "MB", "GB"];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return (
            parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
          );
        };

        const transformedFile = {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size,
          sizeFormatted: formatFileSize(file.size),
          modifiedTime: file.modifiedTime,
          thumbnailUrl: file.thumbnailLink,
          isFolder: file.isFolder,
          path: file.path || `/${file.name}`,
          canSelect: !file.isFolder, // Folders can't be selected, only files can
        };

        return transformedFile;
      });

      console.log(`✅ Transformed files for API response:`, {
        fileCount: transformedFiles.length,
        sampleFiles: transformedFiles.slice(0, 3),
      });

      res.json({
        files: transformedFiles,
        nextPageToken: result.nextPageToken,
      });
    } catch (error) {
      console.error("❌ Storage file listing error:", error);

      // Provide a more user-friendly error message
      let errorMessage = (error as Error).message;
      if (errorMessage.includes("No refresh token available")) {
        errorMessage +=
          " Please disconnect and reconnect your Google Drive account to fix this issue.";
      }

      res.status(500).json({
        error: "Failed to list files",
        message: errorMessage,
      });
    }
  }

  /**
   * GET /api/storage/:integrationId/download/:fileId
   * Get download URL for a file
   */
  async getDownloadUrl(req: Request, res: Response) {
    try {
      const { integrationId, fileId } = req.params;
      const userId = (req as any).user?.id || DEFAULT_USER_ID;

      // Get the integration to verify ownership
      const integration =
        await this.integrationService.getIntegrationById(integrationId);

      if (!integration) {
        return res.status(404).json({
          error: "Integration not found",
          message: "Storage integration not found",
        });
      }

      if (integration.userId !== userId) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You do not have permission to access this integration",
        });
      }

      // Get download URL
      const url = await this.storageService.getDownloadUrl(integration, fileId);

      res.json({ url });
    } catch (error) {
      res.status(500).json({
        error: "Failed to get download URL",
        message: (error as Error).message,
      });
    }
  }

  /**
   * POST /api/storage/:integrationId/import/:fileId
   * Import a file to temporary storage
   */
  async importFile(req: Request, res: Response) {
    try {
      const { integrationId, fileId } = req.params;
      const userId = (req as any).user?.id || DEFAULT_USER_ID;

      // Get the integration to verify ownership
      const integration =
        await this.integrationService.getIntegrationById(integrationId);

      if (!integration) {
        return res.status(404).json({
          error: "Integration not found",
          message: "Storage integration not found",
        });
      }

      if (integration.userId !== userId) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You do not have permission to access this integration",
        });
      }

      // Import file
      const result = await this.storageService.downloadFileToTemp(
        integration,
        fileId,
      );

      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: "Failed to import file",
        message: (error as Error).message,
      });
    }
  }

  /**
   * POST /api/storage/:integrationId/search
   * Search for files
   */
  async searchFiles(req: Request, res: Response) {
    try {
      const { integrationId } = req.params;
      const { query, mimeType, pageSize, pageToken } = req.body;
      const userId = (req as any).user?.id || DEFAULT_USER_ID;

      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const integration =
        await this.integrationService.getIntegrationById(integrationId);

      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      if (integration.userId !== userId) {
        return res
          .status(403)
          .json({ error: "Unauthorized access to integration" });
      }

      const result = await this.storageService.searchFiles(integration, query, {
        mimeType,
        pageSize,
        pageToken,
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: "Failed to search files",
        message: (error as Error).message,
      });
    }
  }

  /**
   * GET /api/storage/:integrationId/thumbnail/:fileId
   * Get thumbnail URL
   */
  async getThumbnail(req: Request, res: Response) {
    try {
      const { integrationId, fileId } = req.params;
      const size = req.query.size
        ? parseInt(req.query.size as string)
        : undefined;
      const userId = (req as any).user?.id || DEFAULT_USER_ID;

      const integration =
        await this.integrationService.getIntegrationById(integrationId);

      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      if (integration.userId !== userId) {
        return res
          .status(403)
          .json({ error: "Unauthorized access to integration" });
      }

      const thumbnailUrl = await this.storageService.getThumbnail(
        integration,
        fileId,
        size,
      );

      res.json({ url: thumbnailUrl });
    } catch (error) {
      res.status(500).json({
        error: "Failed to get thumbnail",
        message: (error as Error).message,
      });
    }
  }

  /**
   * POST /api/storage/:integrationId/batch-import
   * Batch import files
   */
  async batchImport(req: Request, res: Response) {
    try {
      const { integrationId } = req.params;
      const { fileIds } = req.body;
      const userId = (req as any).user?.id || DEFAULT_USER_ID;

      if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        return res.status(400).json({ error: "fileIds array is required" });
      }

      const integration =
        await this.integrationService.getIntegrationById(integrationId);

      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      if (integration.userId !== userId) {
        return res
          .status(403)
          .json({ error: "Unauthorized access to integration" });
      }

      // For now, we'll just import them sequentially or in parallel
      // In a real production system, this might offload to a background job
      const results = await Promise.all(
        fileIds.map(async (fileId) => {
          try {
            const result = await this.storageService.downloadFileToTemp(
              integration,
              fileId,
            );
            return { fileId, success: true, result };
          } catch (error) {
            return { fileId, success: false, error: (error as Error).message };
          }
        }),
      );

      res.json({ results });
    } catch (error) {
      res.status(500).json({
        error: "Failed to batch import files",
        message: (error as Error).message,
      });
    }
  }

  /**
   * GET /api/storage/:integrationId/shared-drives
   * List shared drives (Google Drive only)
   */
  async listSharedDrives(req: Request, res: Response) {
    try {
      const { integrationId } = req.params;
      const userId = (req as any).user?.id || DEFAULT_USER_ID;

      const integration =
        await this.integrationService.getIntegrationById(integrationId);

      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      if (integration.userId !== userId) {
        return res
          .status(403)
          .json({ error: "Unauthorized access to integration" });
      }

      const drives = await this.storageService.listSharedDrives(integration);

      res.json({ drives });
    } catch (error) {
      res.status(500).json({
        error: "Failed to list shared drives",
        message: (error as Error).message,
      });
    }
  }

  /**
   * POST /api/storage/:integrationId/export/:fileId
   * Export Google Workspace file
   */
  async exportFile(req: Request, res: Response) {
    try {
      const { integrationId, fileId } = req.params;
      const { format } = req.body;
      const userId = (req as any).user?.id || DEFAULT_USER_ID;

      const integration =
        await this.integrationService.getIntegrationById(integrationId);

      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      if (integration.userId !== userId) {
        return res
          .status(403)
          .json({ error: "Unauthorized access to integration" });
      }

      const { stream, filename, mimeType } =
        await this.storageService.exportFile(integration, fileId, format);

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      res.setHeader("Content-Type", mimeType);

      stream.pipe(res);
    } catch (error) {
      res.status(500).json({
        error: "Failed to export file",
        message: (error as Error).message,
      });
    }
  }
}
