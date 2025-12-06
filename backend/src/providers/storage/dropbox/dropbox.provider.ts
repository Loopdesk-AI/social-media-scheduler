import { Dropbox } from "dropbox";
import { BaseStorageProvider } from "../../base/storage.abstract";
import {
  StorageAuthDetails,
  StorageFile,
  SearchOptions,
} from "../../base/storage.interface";
import { Readable } from "stream";
import { DropboxError } from "./dropbox.errors";
import {
  isSupportedMediaType,
  formatBytes,
  isSupportedMediaFile,
} from "./dropbox.utils";

export class DropboxProvider extends BaseStorageProvider {
  identifier = "dropbox";
  name = "Dropbox";
  scopes = ["files.metadata.read", "files.content.read", "account_info.read"];

  private dropbox!: Dropbox;
  private clientId!: string;
  private clientSecret!: string;
  private redirectUri!: string;
  private _isConfigured: boolean = false;

  get isConfigured(): boolean {
    return this._isConfigured;
  }

  constructor() {
    super();
    try {
      this.initializeDropboxClient();
      this._isConfigured = true;
    } catch (error) {
      // If environment variables are not configured, mark as not configured
      // but don't throw an error to allow the application to start
      console.warn(
        "Dropbox provider not configured:",
        (error as Error).message,
      );
      this._isConfigured = false;
    }
  }

  private initializeDropboxClient(): void {
    const clientId = process.env.DROPBOX_CLIENT_ID;
    const clientSecret = process.env.DROPBOX_CLIENT_SECRET;
    const redirectUri =
      process.env.DROPBOX_REDIRECT_URI ||
      `${process.env.BACKEND_URL || "http://localhost:3000"}/api/storage/callback/dropbox`;

    console.log("Dropbox Config:", {
      clientId: !!clientId,
      clientSecret: !!clientSecret,
      redirectUri,
    });

    if (!clientId || !clientSecret) {
      throw new Error("Dropbox environment variables not configured");
    }

    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.dropbox = new Dropbox({
      clientId: clientId,
      clientSecret: clientSecret,
    });
  }

  async generateAuthUrl(): Promise<{
    url: string;
    codeVerifier?: string;
    state: string;
  }> {
    if (!this.isConfigured) {
      throw new DropboxError(
        "Dropbox provider not configured",
        "NOT_CONFIGURED",
      );
    }

    // Generate state parameter for CSRF protection
    const state =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // Construct the authorization URL with offline access for refresh tokens
    const authUrl =
      `https://www.dropbox.com/oauth2/authorize?` +
      `client_id=${this.clientId}&` +
      `response_type=code&` +
      `token_access_type=offline&` + // Enable refresh tokens
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `state=${state}`;

    return {
      url: authUrl,
      state: state,
    };
  }

  async authenticate(params: {
    code: string;
    codeVerifier?: string;
  }): Promise<StorageAuthDetails> {
    if (!this.isConfigured) {
      throw new DropboxError(
        "Dropbox provider not configured",
        "NOT_CONFIGURED",
      );
    }

    const { code } = params;

    try {
      // Exchange code for tokens using manual HTTP request
      const tokenUrl = "https://api.dropboxapi.com/oauth2/token";
      const credentials = Buffer.from(
        `${this.clientId}:${this.clientSecret}`,
      ).toString("base64");

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `code=${code}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(this.redirectUri)}`,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const tokenData: any = await response.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        throw new DropboxError(
          "Failed to retrieve access token",
          "TOKEN_ERROR",
        );
      }

      // Create new Dropbox client with access token
      const dropboxWithToken = new Dropbox({ accessToken });

      // Get user account information
      const accountInfo = await dropboxWithToken.usersGetCurrentAccount();
      const account = accountInfo.result;

      // Get space usage information
      const spaceUsage = await dropboxWithToken.usersGetSpaceUsage();
      const usage = spaceUsage.result;

      const quota =
        usage.allocation && "allocated" in usage.allocation
          ? {
              used: usage.used,
              total: usage.allocation.allocated,
              unit: "bytes" as const,
            }
          : undefined;

      return {
        accessToken: accessToken,
        refreshToken: tokenData.refresh_token || "", // Dropbox may provide refresh tokens
        expiresIn: tokenData.expires_in || 14400, // 4 hours for Dropbox tokens
        id: account.account_id,
        email: account.email,
        name: `${account.name.given_name} ${account.name.surname}`,
        picture: account.profile_photo_url || undefined,
        quota,
      };
    } catch (error: any) {
      throw new DropboxError(
        `Authentication failed: ${error.message}`,
        "AUTHENTICATION_ERROR",
        error,
      );
    }
  }

  async refreshToken(refreshToken: string): Promise<StorageAuthDetails> {
    if (!this.isConfigured) {
      throw new DropboxError(
        "Dropbox provider not configured",
        "NOT_CONFIGURED",
      );
    }

    if (!refreshToken) {
      throw new DropboxError(
        "No refresh token provided",
        "MISSING_REFRESH_TOKEN",
      );
    }

    try {
      // Use Dropbox OAuth 2.0 refresh token flow
      const tokenUrl = "https://api.dropboxapi.com/oauth2/token";
      const credentials = Buffer.from(
        `${this.clientId}:${this.clientSecret}`,
      ).toString("base64");

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const tokenData: any = await response.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        throw new DropboxError(
          "Failed to retrieve access token",
          "TOKEN_ERROR",
        );
      }

      // Create new Dropbox client with access token
      const dropboxWithToken = new Dropbox({ accessToken });

      // Get user account information
      const accountInfo = await dropboxWithToken.usersGetCurrentAccount();
      const account = accountInfo.result;

      // Get space usage information
      const spaceUsage = await dropboxWithToken.usersGetSpaceUsage();
      const usage = spaceUsage.result;

      const quota =
        usage.allocation && "allocated" in usage.allocation
          ? {
              used: usage.used,
              total: usage.allocation.allocated,
              unit: "bytes" as const,
            }
          : undefined;

      return {
        accessToken: accessToken,
        refreshToken: tokenData.refresh_token || refreshToken, // Use new refresh token if provided, otherwise keep old one
        expiresIn: tokenData.expires_in || 14400, // 4 hours for Dropbox tokens
        id: account.account_id,
        email: account.email,
        name: `${account.name.given_name} ${account.name.surname}`,
        picture: account.profile_photo_url || undefined,
        quota,
      };
    } catch (error: any) {
      throw new DropboxError(
        `Token refresh failed: ${error.message}`,
        "TOKEN_REFRESH_ERROR",
        error,
      );
    }
  }

  async listFiles(
    accessToken: string,
    folderId: string = "",
    pageToken?: string,
  ): Promise<{
    files: StorageFile[];
    nextPageToken?: string;
  }> {
    if (!this.isConfigured) {
      throw new DropboxError(
        "Dropbox provider not configured",
        "NOT_CONFIGURED",
      );
    }

    try {
      const dropboxWithToken = new Dropbox({ accessToken });

      // Normalize folder path
      const path = folderId === "" ? "" : folderId;

      const listResponse = await dropboxWithToken.filesListFolder({
        path: path,
        limit: 50,
        include_media_info: true,
      });

      const entries = listResponse.result.entries;

      const files: StorageFile[] = entries
        .filter(
          (entry) => entry[".tag"] === "file" || entry[".tag"] === "folder",
        )
        .map((entry) => {
          if (entry[".tag"] === "file") {
            // Filter for supported media files only
            if (!isSupportedMediaFile(entry.name)) {
              return null; // Filter out unsupported files
            }

            return {
              id: entry.id || "",
              name: entry.name,
              mimeType: entry["content_hash"]
                ? "application/octet-stream"
                : "application/octet-stream",
              size: entry.size || 0,
              modifiedTime: entry.server_modified || new Date().toISOString(),
              isFolder: false,
              path: entry.path_display || "",
              thumbnailLink: undefined, // Dropbox doesn't provide thumbnails in this API
              webContentLink: undefined, // Dropbox uses a different method for file access
            };
          } else {
            // Folder
            return {
              id: entry.id || "",
              name: entry.name,
              mimeType: "application/vnd.dropbox.folder",
              size: 0,
              modifiedTime: new Date().toISOString(),
              isFolder: true,
              path: entry.path_display || "",
              thumbnailLink: undefined,
              webContentLink: undefined,
            };
          }
        })
        .filter((file) => file && file.id) as StorageFile[]; // Filter out null values and files without IDs

      return {
        files,
        nextPageToken: listResponse.result.has_more
          ? listResponse.result.cursor
          : undefined,
      };
    } catch (error: any) {
      throw new DropboxError(
        `Failed to list files: ${error.message}`,
        "LIST_FILES_ERROR",
        error,
      );
    }
  }

  async getFile(accessToken: string, fileId: string): Promise<StorageFile> {
    if (!this.isConfigured) {
      throw new DropboxError(
        "Dropbox provider not configured",
        "NOT_CONFIGURED",
      );
    }

    try {
      const dropboxWithToken = new Dropbox({ accessToken });

      // Get file metadata
      const metadataResponse = await dropboxWithToken.filesGetMetadata({
        path: fileId,
      });

      const entry = metadataResponse.result;

      if (entry[".tag"] === "file") {
        return {
          id: entry.id || "",
          name: entry.name,
          mimeType: entry["content_hash"]
            ? "application/octet-stream"
            : "application/octet-stream",
          size: entry.size || 0,
          modifiedTime: entry.server_modified || new Date().toISOString(),
          isFolder: false,
          path: entry.path_display || "",
        };
      } else if (entry[".tag"] === "folder") {
        return {
          id: entry.id || "",
          name: entry.name,
          mimeType: "application/vnd.dropbox.folder",
          size: 0,
          modifiedTime: new Date().toISOString(),
          isFolder: true,
          path: entry.path_display || "",
        };
      } else {
        throw new DropboxError("File not found", "FILE_NOT_FOUND");
      }
    } catch (error: any) {
      if (
        error.error &&
        error.error.error_summary &&
        error.error.error_summary.includes("not_found")
      ) {
        throw new DropboxError("File not found", "FILE_NOT_FOUND", error);
      }
      throw new DropboxError(
        `Failed to get file: ${error.message}`,
        "GET_FILE_ERROR",
        error,
      );
    }
  }

  async downloadFile(
    accessToken: string,
    fileId: string,
  ): Promise<{
    stream: Readable;
    filename: string;
    mimeType: string;
  }> {
    if (!this.isConfigured) {
      throw new DropboxError(
        "Dropbox provider not configured",
        "NOT_CONFIGURED",
      );
    }

    try {
      const dropboxWithToken = new Dropbox({ accessToken });

      // Get file metadata first
      const metadataResponse = await dropboxWithToken.filesGetMetadata({
        path: fileId,
      });

      const entry = metadataResponse.result;

      if (entry[".tag"] !== "file") {
        throw new DropboxError("Path is not a file", "INVALID_FILE_TYPE");
      }

      // Download file content
      const downloadResponse = await dropboxWithToken.filesDownload({
        path: fileId,
      });

      // @ts-ignore - Dropbox SDK types are not perfect
      const fileBlob = downloadResponse.result.fileBinary;
      const filename = downloadResponse.result.name;
      const mimeType = entry["content_hash"]
        ? "application/octet-stream"
        : "application/octet-stream";

      // Convert Blob to Readable stream
      const stream = new Readable();
      stream.push(fileBlob);
      stream.push(null);

      return {
        stream,
        filename,
        mimeType,
      };
    } catch (error: any) {
      if (
        error.error &&
        error.error.error_summary &&
        error.error.error_summary.includes("not_found")
      ) {
        throw new DropboxError("File not found", "FILE_NOT_FOUND", error);
      }
      throw new DropboxError(
        `Failed to download file: ${error.message}`,
        "DOWNLOAD_FILE_ERROR",
        error,
      );
    }
  }

  async getDownloadUrl(
    accessToken: string,
    fileId: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    if (!this.isConfigured) {
      throw new DropboxError(
        "Dropbox provider not configured",
        "NOT_CONFIGURED",
      );
    }

    try {
      const dropboxWithToken = new Dropbox({ accessToken });

      // Get temporary link for file
      const linkResponse = await dropboxWithToken.filesGetTemporaryLink({
        path: fileId,
      });

      return linkResponse.result.link;
    } catch (error: any) {
      if (
        error.error &&
        error.error.error_summary &&
        error.error.error_summary.includes("not_found")
      ) {
        throw new DropboxError("File not found", "FILE_NOT_FOUND", error);
      }
      throw new DropboxError(
        `Failed to get download URL: ${error.message}`,
        "GET_DOWNLOAD_URL_ERROR",
        error,
      );
    }
  }

  /**
   * Create or get a PUBLIC shared link for a file
   * These links are permanent and don't require authentication
   * Perfect for Instagram, LinkedIn, YouTube, etc.
   */
  async createSharedLink(accessToken: string, fileId: string): Promise<string> {
    if (!this.isConfigured) {
      throw new DropboxError(
        "Dropbox provider not configured",
        "NOT_CONFIGURED",
      );
    }

    try {
      const dropboxWithToken = new Dropbox({ accessToken });

      // Try to get existing shared link first
      try {
        const existingLinks = await dropboxWithToken.sharingListSharedLinks({
          path: fileId,
          direct_only: true,
        });

        if (
          existingLinks.result.links &&
          existingLinks.result.links.length > 0
        ) {
          // Return existing shared link, convert to direct download link
          const sharedLink = existingLinks.result.links[0].url;
          // Convert www.dropbox.com to dl.dropboxusercontent.com for direct access
          return sharedLink
            .replace("www.dropbox.com", "dl.dropboxusercontent.com")
            .replace("?dl=0", "?dl=1");
        }
      } catch (error) {
        // No existing link, create a new one
        console.log("No existing link, creating new one");
      }

      // Create new shared link WITHOUT settings (default = public, works for all account types)
      // The strict settings (requested_visibility, audience, access) require Dropbox Team features
      const createLinkResponse =
        await dropboxWithToken.sharingCreateSharedLinkWithSettings({
          path: fileId,
          // No settings = uses defaults which work for all Dropbox accounts
        });

      // Convert to direct download URL
      const sharedLink = createLinkResponse.result.url;
      return sharedLink
        .replace("www.dropbox.com", "dl.dropboxusercontent.com")
        .replace("?dl=0", "?dl=1");
    } catch (error: any) {
      if (
        error.error &&
        error.error.error_summary &&
        error.error.error_summary.includes("not_found")
      ) {
        throw new DropboxError("File not found", "FILE_NOT_FOUND", error);
      }
      throw new DropboxError(
        `Failed to create shared link: ${error.message}`,
        "CREATE_SHARED_LINK_ERROR",
        error,
      );
    }
  }

  /**
   * Search for files in Dropbox
   */
  /**
   * Search for files in Dropbox
   */
  async searchFiles(
    accessToken: string,
    options: SearchOptions,
  ): Promise<{
    files: StorageFile[];
    nextPageToken?: string;
  }> {
    if (!this.isConfigured) {
      throw new DropboxError(
        "Dropbox provider not configured",
        "NOT_CONFIGURED",
      );
    }

    try {
      const dropboxWithToken = new Dropbox({ accessToken });

      // The SDK types for search v2 are a bit complex/incomplete
      // We'll cast to any to avoid type errors
      const searchResponse = (await dropboxWithToken.filesSearchV2({
        query: options.query,
        options: {
          max_results: options.pageSize || 50,
          file_status: { ".tag": "active" },
          filename_only: false,
        },
      })) as any;

      const files: StorageFile[] = searchResponse.result.matches
        // The SDK types might be missing 'metadata' property on the result items
        // so we cast to any to access it
        .filter(
          (match: any) =>
            (match.metadata as any).metadata[".tag"] === "metadata",
        )
        .map((match: any) => {
          const metadata = (match.metadata as any).metadata;
          if (metadata[".tag"] !== "metadata") return null;

          const entry = metadata;

          if (entry[".tag"] === "file") {
            return {
              id: entry.id || "",
              name: entry.name,
              mimeType: "application/octet-stream",
              size: entry.size || 0,
              modifiedTime: entry.server_modified || new Date().toISOString(),
              isFolder: false,
              path: entry.path_display || "",
              thumbnailLink: undefined,
              webContentLink: undefined,
            };
          } else if (entry[".tag"] === "folder") {
            return {
              id: entry.id || "",
              name: entry.name,
              mimeType: "application/vnd.dropbox.folder",
              size: 0,
              modifiedTime: new Date().toISOString(),
              isFolder: true,
              path: entry.path_display || "",
              thumbnailLink: undefined,
              webContentLink: undefined,
            };
          }
          return null;
        })
        .filter(
          (file: StorageFile | null): file is StorageFile => file !== null,
        );

      return {
        files,
        nextPageToken: searchResponse.result.has_more
          ? searchResponse.result.cursor
          : undefined,
      };
    } catch (error: any) {
      throw new DropboxError(
        `Failed to search files: ${error.message}`,
        "SEARCH_FILES_ERROR",
        error,
      );
    }
  }

  /**
   * Get thumbnail URL for a file
   */
  async getThumbnail(
    accessToken: string,
    fileId: string,
    size: number = 256,
  ): Promise<string> {
    if (!this.isConfigured) {
      throw new DropboxError(
        "Dropbox provider not configured",
        "NOT_CONFIGURED",
      );
    }

    try {
      const dropboxWithToken = new Dropbox({ accessToken });

      // Dropbox uses path-based thumbnail generation
      // Get file metadata first to get the path
      const metadataResponse = await dropboxWithToken.filesGetMetadata({
        path: fileId,
      });

      const entry = metadataResponse.result;
      if (entry[".tag"] !== "file") {
        throw new DropboxError("Path is not a file", "INVALID_FILE_TYPE");
      }

      // Determine thumbnail size format
      let sizeFormat: any = "w256h256";
      if (size <= 32) sizeFormat = "w32h32";
      else if (size <= 64) sizeFormat = "w64h64";
      else if (size <= 128) sizeFormat = "w128h128";
      else if (size <= 256) sizeFormat = "w256h256";
      else if (size <= 480) sizeFormat = "w480h320";
      else if (size <= 640) sizeFormat = "w640h480";
      else if (size <= 960) sizeFormat = "w960h640";
      else if (size <= 1024) sizeFormat = "w1024h768";
      else sizeFormat = "w2048h1536";

      const thumbnailResponse = await dropboxWithToken.filesGetThumbnailV2({
        resource: {
          ".tag": "path",
          path: entry.path_display || fileId,
        },
        format: "jpeg" as any,
        size: sizeFormat,
      });

      // Dropbox returns thumbnail as binary data, we need to convert to base64 data URL
      // @ts-ignore - Dropbox SDK types are not perfect
      const thumbnailBlob = thumbnailResponse.result.fileBinary;
      const base64 = Buffer.from(thumbnailBlob).toString("base64");
      return `data:image/jpeg;base64,${base64}`;
    } catch (error: any) {
      if (
        error.error &&
        error.error.error_summary &&
        error.error.error_summary.includes("not_found")
      ) {
        throw new DropboxError("File not found", "FILE_NOT_FOUND", error);
      }
      throw new DropboxError(
        `Failed to get thumbnail: ${error.message}`,
        "GET_THUMBNAIL_ERROR",
        error,
      );
    }
  }

  /**
   * Batch get file metadata
   */
  async batchGetFiles(
    accessToken: string,
    fileIds: string[],
  ): Promise<StorageFile[]> {
    if (!this.isConfigured) {
      throw new DropboxError(
        "Dropbox provider not configured",
        "NOT_CONFIGURED",
      );
    }

    try {
      // Implement batch get by calling getFile in parallel since batch endpoint might be tricky with types
      const filePromises = fileIds.map(async (id) => {
        try {
          return await this.getFile(accessToken, id);
        } catch (error) {
          console.warn(`Failed to get file ${id} in batch:`, error);
          return null;
        }
      });

      const results = await Promise.all(filePromises);
      return results.filter((file): file is StorageFile => file !== null);
    } catch (error: any) {
      throw new DropboxError(
        `Failed to batch get files: ${error.message}`,
        "BATCH_GET_FILES_ERROR",
        error,
      );
    }
  }
}
