import { db } from "../database/db";
import { integrations, Integration } from "../database/schema";
import { eq } from "drizzle-orm";
import { GoogleDriveProvider } from "../providers/storage/google-drive/google-drive.provider";
import { DropboxProvider } from "../providers/storage/dropbox/dropbox.provider";
import {
  StorageProvider,
  StorageFile,
  StorageAuthDetails,
} from "../providers/base/storage.interface";
import { encryptionService } from "./encryption.service";
import { redisService } from "./redis.service";
import { Readable } from "stream";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export class StorageService {
  private providers: Map<string, StorageProvider>;
  private encryptionService: any;
  private readonly STATE_TTL = 600; // 10 minutes in seconds

  constructor() {
    this.encryptionService = encryptionService;
    this.providers = new Map([
      ["google-drive", new GoogleDriveProvider() as StorageProvider],
      ["dropbox", new DropboxProvider() as StorageProvider],
    ]);
  }

  /**
   * Generate OAuth authorization URL with state management
   */
  async generateAuthUrl(
    providerIdentifier: string,
    userId: string,
  ): Promise<{ url: string; state: string }> {
    try {
      console.log(
        `🔐 Generating auth URL for ${providerIdentifier} with userId: ${userId}`,
      );

      // Get the provider
      const provider = this.getProvider(providerIdentifier);

      // Generate auth URL
      const authData = await provider.generateAuthUrl();

      // Store state with userId in Redis for callback verification
      const stateKey = `oauth:storage:state:${authData.state}`;
      await redisService.setex(stateKey, this.STATE_TTL, userId);

      console.log(
        `🔐 Storage OAuth state stored in Redis: ${authData.state} → userId: ${userId}`,
      );
      console.log(`⏰ State will expire in ${this.STATE_TTL} seconds`);

      return {
        url: authData.url,
        state: authData.state,
      };
    } catch (error) {
      console.error(
        `Failed to generate auth URL for ${providerIdentifier}:`,
        error,
      );
      throw new Error(
        `Failed to generate auth URL for ${providerIdentifier}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Get userId from OAuth state (Redis-based)
   */
  async getUserIdFromState(state: string): Promise<string | null> {
    console.log(`🔍 Looking up storage state in Redis: ${state}`);

    const stateKey = `oauth:storage:state:${state}`;
    const userId = await redisService.get(stateKey);

    if (!userId) {
      console.log(`❌ Storage state not found in Redis: ${state}`);
      return null;
    }

    console.log(
      `✅ Storage state found in Redis: ${state} → userId: ${userId}`,
    );

    // Delete state after use (one-time use)
    await redisService.delete(stateKey);
    return userId;
  }

  /**
   * Get list of available storage providers
   */
  getProviders(): { identifier: string; name: string }[] {
    const providers: { identifier: string; name: string }[] = [];

    this.providers.forEach((provider, identifier) => {
      providers.push({
        identifier,
        name: provider.name,
      });
    });

    return providers;
  }

  /**
   * Get OAuth URL for a storage provider (deprecated - use generateAuthUrl instead)
   */
  async getAuthUrl(
    providerIdentifier: string,
  ): Promise<{ url: string; state: string }> {
    try {
      console.log(
        `⚠️  Using deprecated getAuthUrl method for ${providerIdentifier}`,
      );
      // Get the provider
      const provider = this.getProvider(providerIdentifier);

      // Generate auth URL
      const authData = await provider.generateAuthUrl();

      return {
        url: authData.url,
        state: authData.state,
      };
    } catch (error) {
      console.error(
        `Failed to generate auth URL for ${providerIdentifier}:`,
        error,
      );
      throw new Error(
        `Failed to generate auth URL for ${providerIdentifier}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Get a storage provider by identifier
   */
  private getProvider(identifier: string): StorageProvider {
    const provider = this.providers.get(identifier);
    if (!provider) {
      throw new Error(`Storage provider ${identifier} not found`);
    }
    return provider;
  }

  /**
   * Get a storage provider by identifier (public method)
   */
  public getProviderById(identifier: string): StorageProvider {
    return this.getProvider(identifier);
  }

  /**
   * List files from a storage provider
   */
  async listFiles(
    integration: Integration,
    folderId?: string,
    pageToken?: string,
  ): Promise<{ files: StorageFile[]; nextPageToken?: string }> {
    try {
      console.log(
        `🔄 StorageService.listFiles called - Provider: ${integration.providerIdentifier}, Folder: ${folderId || "root"}`,
      );

      // Ensure we have a valid token
      const accessToken = await this.ensureValidToken(integration);
      console.log(`✅ Valid access token obtained`);

      // Get the provider
      const provider = this.getProvider(integration.providerIdentifier);
      console.log(`✅ Provider instance obtained: ${provider.identifier}`);

      // List files
      console.log(`🔄 Calling provider.listFiles...`);
      const result = await provider.listFiles(accessToken, folderId, pageToken);
      console.log(
        `✅ Provider.listFiles completed - Files found: ${result.files.length}`,
      );

      return result;
    } catch (error) {
      console.error(
        `❌ Failed to list files from ${integration.providerIdentifier}:`,
        error,
      );
      throw new Error(
        `Failed to list files from ${integration.providerIdentifier}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Get a specific file from a storage provider
   */
  async getFile(
    integration: Integration,
    fileId: string,
  ): Promise<StorageFile> {
    try {
      // Ensure we have a valid token
      const accessToken = await this.ensureValidToken(integration);

      // Get the provider
      const provider = this.getProvider(integration.providerIdentifier);

      // Get file
      return await provider.getFile(accessToken, fileId);
    } catch (error) {
      throw new Error(
        `Failed to get file from ${integration.providerIdentifier}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Get a download URL for a file
   */
  async getDownloadUrl(
    integration: Integration,
    fileId: string,
  ): Promise<string> {
    try {
      // Ensure we have a valid token
      const accessToken = await this.ensureValidToken(integration);

      // Get the provider
      const provider = this.getProvider(integration.providerIdentifier);

      // Get download URL
      return await provider.getDownloadUrl(accessToken, fileId);
    } catch (error) {
      throw new Error(
        `Failed to get download URL from ${integration.providerIdentifier}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Download a file to temporary storage
   */
  async downloadFileToTemp(
    integration: Integration,
    fileId: string,
  ): Promise<{ path: string; filename: string; mimeType: string }> {
    try {
      // Ensure we have a valid token
      const accessToken = await this.ensureValidToken(integration);

      // Get the provider
      const provider = this.getProvider(integration.providerIdentifier);

      // Download file
      const { stream, filename, mimeType } = await provider.downloadFile(
        accessToken,
        fileId,
      );

      // Create temporary file path
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(
        tempDir,
        `storage-${Date.now()}-${filename}`,
      );

      // Write stream to file
      const writeStream = fs.createWriteStream(tempFilePath);
      stream.pipe(writeStream);

      // Wait for stream to finish
      await new Promise((resolve, reject) => {
        writeStream.on("finish", () => resolve(undefined));
        writeStream.on("error", reject);
      });

      return {
        path: tempFilePath,
        filename,
        mimeType,
      };
    } catch (error) {
      throw new Error(
        `Failed to download file from ${integration.providerIdentifier}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Get a PUBLIC shared link for a file (works for Dropbox & Google Drive)
   * These links are permanent and publicly accessible - perfect for Instagram, LinkedIn!
   */
  async getPublicUrl(
    integration: Integration,
    fileId: string,
  ): Promise<string> {
    try {
      // Ensure we have a valid token
      const accessToken = await this.ensureValidToken(integration);

      // Get the provider
      const provider = this.getProvider(integration.providerIdentifier);

      // Check if provider supports creating shared links
      // Dropbox: use createSharedLink
      // Google Drive: can also create public links
      if (integration.providerIdentifier === "dropbox") {
        // Cast to DropboxProvider to access createSharedLink
        const dropboxProvider = provider as any;
        if (dropboxProvider.createSharedLink) {
          return await dropboxProvider.createSharedLink(accessToken, fileId);
        }
      }

      // For other providers or if createSharedLink not available, throw error
      throw new Error(
        `Public URL generation not supported for ${integration.providerIdentifier}`,
      );
    } catch (error) {
      throw new Error(
        `Failed to get public URL from ${integration.providerIdentifier}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Update integration tokens after refresh
   */
  private async updateIntegrationTokens(
    integrationId: string,
    authDetails: StorageAuthDetails,
  ): Promise<void> {
    // Encrypt tokens
    const encryptedToken = this.encryptionService.encrypt(
      authDetails.accessToken,
    );
    const encryptedRefreshToken = authDetails.refreshToken
      ? this.encryptionService.encrypt(authDetails.refreshToken)
      : null;

    // Calculate expiration
    const tokenExpiration = authDetails.expiresIn
      ? new Date(Date.now() + authDetails.expiresIn * 1000)
      : null;

    // Update integration with new tokens
    try {
      await db
        .update(integrations)
        .set({
          token: encryptedToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiration,
          updatedAt: new Date(),
        })
        .where(eq(integrations.id, integrationId));
      console.log(
        `✅ Integration tokens updated for integration ${integrationId}`,
      );
    } catch (error) {
      console.error(
        `❌ Failed to update integration tokens for integration ${integrationId}:`,
        error,
      );
      throw new Error(
        `Failed to update integration tokens: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Ensure we have a valid access token, refreshing if necessary
   */
  private async ensureValidToken(integration: Integration): Promise<string> {
    console.log(
      `🔍 Checking token validity for integration ${integration.id} (${integration.providerIdentifier})`,
    );

    // Decrypt tokens
    const decryptedToken = this.encryptionService.decrypt(integration.token);
    const decryptedRefreshToken = integration.refreshToken
      ? this.encryptionService.decrypt(integration.refreshToken)
      : "";

    console.log(`📅 Token expiration: ${integration.tokenExpiration}`);
    console.log(`⏰ Current time: ${new Date()}`);
    console.log(
      `🔄 Refresh token: ${decryptedRefreshToken ? "Present" : "Missing"}`,
    );

    // Check if token is expired
    if (
      integration.tokenExpiration &&
      integration.tokenExpiration < new Date()
    ) {
      console.log(`🔄 Token is expired, attempting to refresh...`);

      // Check if we have a refresh token
      if (!decryptedRefreshToken || decryptedRefreshToken === "") {
        console.log(
          `❌ No refresh token available, cannot refresh expired token`,
        );
        throw new Error(
          `No refresh token available for ${integration.providerIdentifier}. Please disconnect and reconnect your account to fix this issue.`,
        );
      }

      // Token is expired, refresh it
      const provider = this.getProvider(integration.providerIdentifier);

      try {
        const authDetails: StorageAuthDetails = await provider.refreshToken(
          decryptedRefreshToken,
        );
        console.log(`✅ Token refreshed successfully`);

        // Update integration with new tokens
        await this.updateIntegrationTokens(integration.id, authDetails);

        return authDetails.accessToken;
      } catch (error) {
        console.error(
          `❌ Failed to refresh token for ${integration.providerIdentifier}:`,
          error,
        );
        // If refresh fails, rethrow the error
        throw new Error(
          `Failed to refresh token for ${integration.providerIdentifier}: ${(error as Error).message}`,
        );
      }
    }

    console.log(`✅ Token is still valid`);
    // Token is still valid
    return decryptedToken;
  }

  /**
   * Search for files in a storage provider
   */
  async searchFiles(
    integration: Integration,
    query: string,
    options?: { mimeType?: string; pageSize?: number; pageToken?: string },
  ): Promise<{ files: StorageFile[]; nextPageToken?: string }> {
    try {
      const accessToken = await this.ensureValidToken(integration);
      const provider = this.getProvider(integration.providerIdentifier);

      if (!provider.searchFiles) {
        throw new Error(
          `Search not supported for ${integration.providerIdentifier}`,
        );
      }

      return await provider.searchFiles(accessToken, {
        query,
        mimeType: options?.mimeType,
        pageSize: options?.pageSize,
        pageToken: options?.pageToken,
      });
    } catch (error) {
      throw new Error(`Failed to search files: ${(error as Error).message}`);
    }
  }

  /**
   * Get thumbnail URL for a file
   */
  async getThumbnail(
    integration: Integration,
    fileId: string,
    size?: number,
  ): Promise<string> {
    try {
      const accessToken = await this.ensureValidToken(integration);
      const provider = this.getProvider(integration.providerIdentifier);

      if (!provider.getThumbnail) {
        throw new Error(
          `Thumbnails not supported for ${integration.providerIdentifier}`,
        );
      }

      return await provider.getThumbnail(accessToken, fileId, size);
    } catch (error) {
      throw new Error(`Failed to get thumbnail: ${(error as Error).message}`);
    }
  }

  /**
   * Batch get file metadata
   */
  async batchGetFiles(
    integration: Integration,
    fileIds: string[],
  ): Promise<StorageFile[]> {
    try {
      const accessToken = await this.ensureValidToken(integration);
      const provider = this.getProvider(integration.providerIdentifier);

      if (!provider.batchGetFiles) {
        throw new Error(
          `Batch operations not supported for ${integration.providerIdentifier}`,
        );
      }

      return await provider.batchGetFiles(accessToken, fileIds);
    } catch (error) {
      throw new Error(`Failed to batch get files: ${(error as Error).message}`);
    }
  }

  /**
   * List shared drives (Google Drive only)
   */
  async listSharedDrives(
    integration: Integration,
  ): Promise<Array<{ id: string; name: string }>> {
    try {
      const accessToken = await this.ensureValidToken(integration);
      const provider = this.getProvider(integration.providerIdentifier);

      if (!provider.listSharedDrives) {
        throw new Error(
          `Shared drives not supported for ${integration.providerIdentifier}`,
        );
      }

      return await provider.listSharedDrives(accessToken);
    } catch (error) {
      throw new Error(
        `Failed to list shared drives: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Export a file (Google Workspace files only)
   */
  async exportFile(
    integration: Integration,
    fileId: string,
    format?: string,
  ): Promise<{ stream: Readable; filename: string; mimeType: string }> {
    try {
      const accessToken = await this.ensureValidToken(integration);
      const provider = this.getProvider(integration.providerIdentifier);

      if (!provider.exportFile) {
        throw new Error(
          `File export not supported for ${integration.providerIdentifier}`,
        );
      }

      return await provider.exportFile(accessToken, fileId, format);
    } catch (error) {
      throw new Error(`Failed to export file: ${(error as Error).message}`);
    }
  }
}
