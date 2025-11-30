import { google, drive_v3 } from "googleapis";
import { BaseStorageProvider } from "../../base/storage.abstract";
import {
  StorageAuthDetails,
  StorageFile,
  SearchOptions,
  SharedDrive,
} from "../../base/storage.interface";
import { Readable } from "stream";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  buildSearchQuery,
  isGoogleWorkspaceFile,
  getDefaultExportFormat,
  GOOGLE_WORKSPACE_TYPES,
} from "./google-drive.utils";
import {
  GoogleDriveError,
  GoogleDriveNotFoundError,
  GoogleDriveRateLimitError,
} from "./google-drive.errors";

export class GoogleDriveProvider extends BaseStorageProvider {
  identifier = "google-drive";
  name = "Google Drive";
  scopes = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  private oauth2Client: any;
  private _isConfigured: boolean = false;

  get isConfigured(): boolean {
    return this._isConfigured;
  }

  constructor() {
    super();
    try {
      this.initializeOAuthClient();
      this._isConfigured = true;
    } catch (error) {
      // If environment variables are not configured, mark as not configured
      // but don't throw an error to allow the application to start
      console.warn(
        "Google Drive provider not configured:",
        (error as Error).message,
      );
      this._isConfigured = false;
    }
  }

  private initializeOAuthClient(): void {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_DRIVE_REDIRECT_URI ||
      `${process.env.BACKEND_URL || "http://localhost:3000"}/api/storage/callback/google-drive`;

    console.log("Google Drive Config:", {
      clientId: !!clientId,
      clientSecret: !!clientSecret,
      redirectUri,
    });

    if (!clientId || !clientSecret) {
      throw new Error("Google Drive environment variables not configured");
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );
  }

  async generateAuthUrl(): Promise<{
    url: string;
    codeVerifier?: string;
    state: string;
  }> {
    if (!this.isConfigured) {
      throw new GoogleDriveError(
        "Google Drive provider not configured",
        "NOT_CONFIGURED",
      );
    }

    // Generate state parameter for CSRF protection
    const state =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent", // Force consent screen to always get refresh token
      scope: this.scopes,
      state: state,
    });

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
      throw new GoogleDriveError(
        "Google Drive provider not configured",
        "NOT_CONFIGURED",
      );
    }

    const { code } = params;

    try {
      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);

      console.log(`✅ Google OAuth tokens received:`, {
        accessToken: tokens.access_token ? "Present" : "Missing",
        refreshToken: tokens.refresh_token ? "Present" : "Missing",
        expiryDate: tokens.expiry_date,
      });

      // Set credentials for future requests
      this.oauth2Client.setCredentials(tokens);

      // Get user profile information
      const oauth2 = google.oauth2({ version: "v2", auth: this.oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      if (!userInfo.data) {
        throw new GoogleDriveError(
          "Failed to retrieve user information",
          "USER_INFO_ERROR",
        );
      }

      // Get storage quota information
      const drive = google.drive({ version: "v3", auth: this.oauth2Client });
      const about = await drive.about.get({ fields: "user,storageQuota" });

      const quota = about.data.storageQuota
        ? {
            used: parseInt(about.data.storageQuota.usage || "0"),
            total: parseInt(about.data.storageQuota.limit || "0"),
            unit: "bytes" as const,
          }
        : undefined;

      return {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || "", // Handle case where refresh token is not provided
        expiresIn: tokens.expiry_date
          ? Math.floor((tokens.expiry_date - Date.now()) / 1000)
          : 3600,
        id: userInfo.data.id || "",
        email: userInfo.data.email || "",
        name: userInfo.data.name || "",
        picture: userInfo.data.picture || undefined,
        quota,
      };
    } catch (error: any) {
      console.error(`❌ Google Drive authentication failed:`, error);
      throw new GoogleDriveError(
        `Authentication failed: ${error.message}`,
        "AUTHENTICATION_ERROR",
        error,
      );
    }
  }

  async refreshToken(refreshToken: string): Promise<StorageAuthDetails> {
    console.log(
      `🔄 GoogleDriveProvider.refreshToken called with refresh token: ${refreshToken ? "Present" : "Missing"}`,
    );

    if (!this.isConfigured) {
      console.log(`❌ Google Drive provider not configured`);
      throw new GoogleDriveError(
        "Google Drive provider not configured",
        "NOT_CONFIGURED",
      );
    }

    if (!refreshToken) {
      console.log(`❌ No refresh token provided`);
      throw new GoogleDriveError(
        "No refresh token provided",
        "MISSING_REFRESH_TOKEN",
      );
    }

    // If refresh token is empty string, we can't refresh
    if (refreshToken === "") {
      console.log(`❌ Empty refresh token provided, cannot refresh`);
      throw new GoogleDriveError(
        "No refresh token available for this integration. Please reconnect your Google Drive account.",
        "MISSING_REFRESH_TOKEN",
      );
    }

    try {
      console.log(`🔄 Setting credentials with refresh token`);
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      console.log(`✅ Access token refreshed successfully`);

      // Get user profile information with new access token
      this.oauth2Client.setCredentials(credentials);
      const oauth2 = google.oauth2({ version: "v2", auth: this.oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      console.log(`✅ User info retrieved:`, userInfo.data);

      if (!userInfo.data) {
        console.log(
          `❌ Failed to retrieve user information after token refresh`,
        );
        throw new GoogleDriveError(
          "Failed to retrieve user information after token refresh",
          "USER_INFO_ERROR",
        );
      }

      // Get storage quota information
      const drive = google.drive({ version: "v3", auth: this.oauth2Client });
      const about = await drive.about.get({ fields: "user,storageQuota" });
      console.log(`✅ Storage quota retrieved:`, about.data.storageQuota);

      const quota = about.data.storageQuota
        ? {
            used: parseInt(about.data.storageQuota.usage || "0"),
            total: parseInt(about.data.storageQuota.limit || "0"),
            unit: "bytes" as const,
          }
        : undefined;

      const authDetails = {
        accessToken: credentials.access_token!,
        refreshToken: credentials.refresh_token || refreshToken,
        expiresIn: credentials.expiry_date
          ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
          : 3600,
        id: userInfo.data.id || "",
        email: userInfo.data.email || "",
        name: userInfo.data.name || "",
        picture: userInfo.data.picture || undefined,
        quota,
      };

      console.log(`✅ Refresh token result:`, {
        accessToken: authDetails.accessToken ? "Present" : "Missing",
        refreshToken: authDetails.refreshToken ? "Present" : "Missing",
        expiresIn: authDetails.expiresIn,
        email: authDetails.email,
      });

      return authDetails;
    } catch (error: any) {
      console.error(`❌ Token refresh failed:`, error);
      throw new GoogleDriveError(
        `Token refresh failed: ${error.message}`,
        "TOKEN_REFRESH_ERROR",
        error,
      );
    }
  }

  async listFiles(
    accessToken: string,
    folderId?: string,
    pageToken?: string,
  ): Promise<{
    files: StorageFile[];
    nextPageToken?: string;
  }> {
    if (!this.isConfigured) {
      throw new GoogleDriveError(
        "Google Drive provider not configured",
        "NOT_CONFIGURED",
      );
    }

    try {
      console.log(
        `🔍 GoogleDriveProvider.listFiles called - Folder: ${folderId || "root"}, PageToken: ${pageToken || "none"}`,
      );

      this.oauth2Client.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: "v3", auth: this.oauth2Client });

      const query = folderId
        ? `'${folderId}' in parents and trashed = false`
        : `'root' in parents and trashed = false`;

      console.log(`🔍 Google Drive query: ${query}`);

      const response = await drive.files.list({
        q: query,
        fields:
          "nextPageToken, files(id, name, mimeType, size, modifiedTime, thumbnailLink, webContentLink)",
        pageSize: 100,
        pageToken: pageToken,
        orderBy: "folder,name,modifiedTime desc",
      });

      console.log(
        `✅ Google Drive API response - Total files in response: ${response.data.files?.length || 0}`,
      );

      const files: StorageFile[] = (response.data.files || [])
        .filter((file) => {
          const isValid = file.id && file.name;
          if (!isValid) {
            console.log(
              `⚠️  Filtering out file due to missing properties:`,
              file,
            );
          }
          return isValid;
        })
        .map((file) => {
          const mappedFile = {
            id: file.id!,
            name: file.name!,
            mimeType: file.mimeType || "application/octet-stream",
            size: file.size ? parseInt(file.size) : 0,
            modifiedTime: file.modifiedTime || new Date().toISOString(),
            thumbnailLink: file.thumbnailLink || undefined,
            webContentLink: file.webContentLink || undefined,
            isFolder: file.mimeType === "application/vnd.google-apps.folder",
            path: `/${file.name}`,
          };

          console.log(
            `📁 Mapped file: ${mappedFile.name} (${mappedFile.mimeType}) - IsFolder: ${mappedFile.isFolder}`,
          );
          return mappedFile;
        });

      console.log(
        `✅ Transformed files for folder ${folderId || "root"}: ${files.length}`,
      );

      return {
        files,
        nextPageToken: response.data.nextPageToken || undefined,
      };
    } catch (error: any) {
      console.error(`❌ Google Drive listFiles error:`, error);
      throw new GoogleDriveError(
        `Failed to list files: ${error.message}`,
        "LIST_FILES_ERROR",
        error,
      );
    }
  }

  async getFile(accessToken: string, fileId: string): Promise<StorageFile> {
    if (!this.isConfigured) {
      throw new GoogleDriveError(
        "Google Drive provider not configured",
        "NOT_CONFIGURED",
      );
    }

    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: "v3", auth: this.oauth2Client });

      const response = await drive.files.get({
        fileId: fileId,
        fields:
          "id, name, mimeType, size, modifiedTime, thumbnailLink, webContentLink",
      });

      const file = response.data;

      if (!file.id || !file.name) {
        throw new GoogleDriveError(
          "File not found or missing required properties",
          "FILE_NOT_FOUND",
        );
      }

      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType || "application/octet-stream",
        size: file.size ? parseInt(file.size) : 0,
        modifiedTime: file.modifiedTime || new Date().toISOString(),
        thumbnailLink: file.thumbnailLink || undefined,
        webContentLink: file.webContentLink || undefined,
        isFolder: file.mimeType === "application/vnd.google-apps.folder",
      };
    } catch (error: any) {
      if (error.code === 404) {
        throw new GoogleDriveError("File not found", "FILE_NOT_FOUND", error);
      }
      throw new GoogleDriveError(
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
      throw new GoogleDriveError(
        "Google Drive provider not configured",
        "NOT_CONFIGURED",
      );
    }

    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: "v3", auth: this.oauth2Client });

      // Get file metadata first
      const metadata = await drive.files.get({
        fileId: fileId,
        fields: "name, mimeType",
      });

      // Download file content
      const response = await drive.files.get(
        {
          fileId: fileId,
          alt: "media",
        },
        { responseType: "stream" },
      );

      return {
        stream: response.data,
        filename: metadata.data.name || "unnamed-file",
        mimeType: metadata.data.mimeType || "application/octet-stream",
      };
    } catch (error: any) {
      if (error.code === 404) {
        throw new GoogleDriveError("File not found", "FILE_NOT_FOUND", error);
      }
      throw new GoogleDriveError(
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
      throw new GoogleDriveError(
        "Google Drive provider not configured",
        "NOT_CONFIGURED",
      );
    }

    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: "v3", auth: this.oauth2Client });

      // Generate a temporary access URL
      const response = await drive.files.get({
        fileId: fileId,
        fields: "webContentLink",
      });

      const url = response.data.webContentLink;

      if (!url) {
        throw new GoogleDriveError(
          "Unable to generate download URL",
          "DOWNLOAD_URL_ERROR",
        );
      }

      return url;
    } catch (error: any) {
      if (error.code === 404) {
        throw new GoogleDriveNotFoundError("File not found", error);
      }
      throw new GoogleDriveError(
        `Failed to get download URL: ${error.message}`,
        "GET_DOWNLOAD_URL_ERROR",
        error,
      );
    }
  }

  /**
   * Search for files in Google Drive
   */
  async searchFiles(
    accessToken: string,
    options: SearchOptions,
  ): Promise<{
    files: StorageFile[];
    nextPageToken?: string;
  }> {
    if (!this.isConfigured) {
      throw new GoogleDriveError(
        "Google Drive provider not configured",
        "NOT_CONFIGURED",
      );
    }

    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: "v3", auth: this.oauth2Client });

      const query = buildSearchQuery({
        query: options.query,
        mimeType: options.mimeType,
        trashed: false,
      });

      console.log(`🔍 Google Drive search query: ${query}`);

      const response = await drive.files.list({
        q: query,
        fields:
          "nextPageToken, files(id, name, mimeType, size, modifiedTime, thumbnailLink, webContentLink)",
        pageSize: options.pageSize || 50,
        pageToken: options.pageToken,
        orderBy: "modifiedTime desc",
      });

      const files: StorageFile[] = (response.data.files || [])
        .filter((file) => file.id && file.name)
        .map((file) => ({
          id: file.id!,
          name: file.name!,
          mimeType: file.mimeType || "application/octet-stream",
          size: file.size ? parseInt(file.size) : 0,
          modifiedTime: file.modifiedTime || new Date().toISOString(),
          thumbnailLink: file.thumbnailLink || undefined,
          webContentLink: file.webContentLink || undefined,
          isFolder: file.mimeType === GOOGLE_WORKSPACE_TYPES.FOLDER,
          path: `/${file.name}`,
        }));

      return {
        files,
        nextPageToken: response.data.nextPageToken || undefined,
      };
    } catch (error: any) {
      if (error.code === 403 && error.message?.includes("rate")) {
        throw new GoogleDriveRateLimitError("Rate limit exceeded", error);
      }
      throw new GoogleDriveError(
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
      throw new GoogleDriveError(
        "Google Drive provider not configured",
        "NOT_CONFIGURED",
      );
    }

    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: "v3", auth: this.oauth2Client });

      const response = await drive.files.get({
        fileId: fileId,
        fields: "thumbnailLink",
      });

      let thumbnailUrl = response.data.thumbnailLink;

      if (!thumbnailUrl) {
        throw new GoogleDriveError(
          "No thumbnail available for this file",
          "NO_THUMBNAIL",
        );
      }

      // Modify thumbnail size parameter
      thumbnailUrl = thumbnailUrl.replace(/=s\d+/, `=s${size}`);

      return thumbnailUrl;
    } catch (error: any) {
      if (error.code === 404) {
        throw new GoogleDriveNotFoundError("File not found", error);
      }
      throw new GoogleDriveError(
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
      throw new GoogleDriveError(
        "Google Drive provider not configured",
        "NOT_CONFIGURED",
      );
    }

    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: "v3", auth: this.oauth2Client });

      // Google Drive API doesn't have a native batch get, so we'll use Promise.all
      const filePromises = fileIds.map(async (fileId) => {
        try {
          const response = await drive.files.get({
            fileId: fileId,
            fields:
              "id, name, mimeType, size, modifiedTime, thumbnailLink, webContentLink",
          });

          const file = response.data;
          const storageFile: StorageFile = {
            id: file.id!,
            name: file.name!,
            mimeType: file.mimeType || "application/octet-stream",
            size: file.size ? parseInt(file.size) : 0,
            modifiedTime: file.modifiedTime || new Date().toISOString(),
            thumbnailLink: file.thumbnailLink ?? undefined,
            webContentLink: file.webContentLink ?? undefined,
            isFolder: file.mimeType === GOOGLE_WORKSPACE_TYPES.FOLDER,
          };
          return storageFile;
        } catch (error) {
          console.error(`Failed to get file ${fileId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(filePromises);
      return results.filter((file): file is StorageFile => file !== null);
    } catch (error: any) {
      throw new GoogleDriveError(
        `Failed to batch get files: ${error.message}`,
        "BATCH_GET_FILES_ERROR",
        error,
      );
    }
  }

  /**
   * List shared drives (Team Drives)
   */
  async listSharedDrives(accessToken: string): Promise<SharedDrive[]> {
    if (!this.isConfigured) {
      throw new GoogleDriveError(
        "Google Drive provider not configured",
        "NOT_CONFIGURED",
      );
    }

    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: "v3", auth: this.oauth2Client });

      const response = await drive.drives.list({
        pageSize: 100,
      });

      const drives: SharedDrive[] = (response.data.drives || [])
        .filter((drive) => drive.id && drive.name)
        .map((drive) => ({
          id: drive.id!,
          name: drive.name!,
        }));

      return drives;
    } catch (error: any) {
      throw new GoogleDriveError(
        `Failed to list shared drives: ${error.message}`,
        "LIST_SHARED_DRIVES_ERROR",
        error,
      );
    }
  }

  /**
   * Export Google Workspace file to a specific format
   */
  async exportFile(
    accessToken: string,
    fileId: string,
    format?: string,
  ): Promise<{
    stream: Readable;
    filename: string;
    mimeType: string;
  }> {
    if (!this.isConfigured) {
      throw new GoogleDriveError(
        "Google Drive provider not configured",
        "NOT_CONFIGURED",
      );
    }

    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: "v3", auth: this.oauth2Client });

      // Get file metadata first
      const metadata = await drive.files.get({
        fileId: fileId,
        fields: "name, mimeType",
      });

      const originalMimeType = metadata.data.mimeType || "";
      const originalName = metadata.data.name || "export";

      // Check if it's a Google Workspace file
      if (!isGoogleWorkspaceFile(originalMimeType)) {
        throw new GoogleDriveError(
          "File is not a Google Workspace file and cannot be exported",
          "INVALID_FILE_TYPE",
        );
      }

      // Get export format
      const exportFormat = format
        ? { mimeType: format, extension: format.split("/")[1] || "pdf" }
        : getDefaultExportFormat(originalMimeType);

      if (!exportFormat) {
        throw new GoogleDriveError(
          "No export format available for this file type",
          "NO_EXPORT_FORMAT",
        );
      }

      // Export the file
      const response = await drive.files.export(
        {
          fileId: fileId,
          mimeType: exportFormat.mimeType,
        },
        { responseType: "stream" },
      );

      // Generate filename with appropriate extension
      const baseFilename = originalName.replace(/\.[^/.]+$/, "");
      const filename = `${baseFilename}.${exportFormat.extension}`;

      return {
        stream: response.data,
        filename,
        mimeType: exportFormat.mimeType,
      };
    } catch (error: any) {
      if (error.code === 404) {
        throw new GoogleDriveNotFoundError("File not found", error);
      }
      throw new GoogleDriveError(
        `Failed to export file: ${error.message}`,
        "EXPORT_FILE_ERROR",
        error,
      );
    }
  }
}
