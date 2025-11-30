import { StorageProvider, StorageAuthDetails, StorageFile } from './storage.interface';
import { Readable } from 'stream';

export abstract class BaseStorageProvider implements StorageProvider {
  abstract identifier: string;
  abstract name: string;
  abstract scopes: string[];

  /**
   * Generate OAuth authorization URL
   */
  abstract generateAuthUrl(): Promise<{
    url: string;
    codeVerifier?: string;
    state: string;
  }>;

  /**
   * Authenticate with the provider using OAuth code
   */
  abstract authenticate(params: {
    code: string;
    codeVerifier?: string;
  }): Promise<StorageAuthDetails>;

  /**
   * Refresh access token using refresh token
   */
  abstract refreshToken(refreshToken: string): Promise<StorageAuthDetails>;

  /**
   * List files in a folder
   */
  abstract listFiles(
    accessToken: string,
    folderId?: string,
    pageToken?: string
  ): Promise<{
    files: StorageFile[];
    nextPageToken?: string;
  }>;

  /**
   * Get file metadata
   */
  abstract getFile(
    accessToken: string,
    fileId: string
  ): Promise<StorageFile>;

  /**
   * Download file as stream
   */
  abstract downloadFile(
    accessToken: string,
    fileId: string
  ): Promise<{
    stream: Readable;
    filename: string;
    mimeType: string;
  }>;

  /**
   * Get temporary download URL
   */
  abstract getDownloadUrl(
    accessToken: string,
    fileId: string,
    expiresIn?: number
  ): Promise<string>;

  /**
   * Validate if token is expired
   */
  protected isTokenExpired(expiresAt: Date): boolean {
    // Add 5 minute buffer to account for clock differences
    const buffer = 5 * 60 * 1000;
    return Date.now() > (expiresAt.getTime() - buffer);
  }

  /**
   * Format bytes to human readable format
   */
  protected formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Check if file is a supported media type
   */
  protected isSupportedMediaType(mimeType: string): boolean {
    const supportedTypes = [
      // Image types
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      
      // Video types
      'video/mp4',
      'video/mpeg',
      'video/ogg',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-flv',
      'video/3gpp',
      'video/3gpp2'
    ];

    return supportedTypes.includes(mimeType);
  }
}