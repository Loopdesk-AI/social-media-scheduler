import { Readable } from 'stream';

export interface StorageFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  modifiedTime: string;
  thumbnailLink?: string;
  webContentLink?: string;
  isFolder: boolean;
  path?: string; // Full path for breadcrumb
}

export interface StorageFolder {
  id: string;
  name: string;
  path: string;
}

export interface StorageQuota {
  used: number;
  total: number;
  unit: 'bytes';
}

export interface StorageAuthDetails {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  id: string;
  email: string;
  name: string;
  picture?: string;
  quota?: StorageQuota;
}

export interface SearchOptions {
  query: string;
  mimeType?: string;
  pageToken?: string;
  pageSize?: number;
}

export interface SharedDrive {
  id: string;
  name: string;
}

export interface ExportFormat {
  mimeType: string;
  extension: string;
}

export interface StorageProvider {
  identifier: string;
  name: string;
  scopes: string[];

  generateAuthUrl(): Promise<{
    url: string;
    codeVerifier?: string;
    state: string;
  }>;

  authenticate(params: {
    code: string;
    codeVerifier?: string;
  }): Promise<StorageAuthDetails>;

  refreshToken(refreshToken: string): Promise<StorageAuthDetails>;

  listFiles(
    accessToken: string,
    folderId?: string,
    pageToken?: string
  ): Promise<{
    files: StorageFile[];
    nextPageToken?: string;
  }>;

  getFile(
    accessToken: string,
    fileId: string
  ): Promise<StorageFile>;

  downloadFile(
    accessToken: string,
    fileId: string
  ): Promise<{
    stream: Readable;
    filename: string;
    mimeType: string;
  }>;

  getDownloadUrl(
    accessToken: string,
    fileId: string,
    expiresIn?: number
  ): Promise<string>;

  // Optional advanced features
  searchFiles?(
    accessToken: string,
    options: SearchOptions
  ): Promise<{
    files: StorageFile[];
    nextPageToken?: string;
  }>;

  getThumbnail?(
    accessToken: string,
    fileId: string,
    size?: number
  ): Promise<string>;

  batchGetFiles?(
    accessToken: string,
    fileIds: string[]
  ): Promise<StorageFile[]>;

  listSharedDrives?(
    accessToken: string
  ): Promise<SharedDrive[]>;

  exportFile?(
    accessToken: string,
    fileId: string,
    format?: string
  ): Promise<{
    stream: Readable;
    filename: string;
    mimeType: string;
  }>;
}