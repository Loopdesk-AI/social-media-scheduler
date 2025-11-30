import * as crypto from 'crypto';

/**
 * Generate a cryptographically secure code verifier for PKCE
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate a code challenge from a code verifier
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if a file is a supported media type
 */
export function isSupportedMediaType(mimeType: string): boolean {
  const supportedTypes = [
    'image/',
    'video/',
    'audio/',
  ];

  return supportedTypes.some(type => mimeType.startsWith(type));
}

/**
 * Google Workspace MIME types
 */
export const GOOGLE_WORKSPACE_TYPES = {
  DOCUMENT: 'application/vnd.google-apps.document',
  SPREADSHEET: 'application/vnd.google-apps.spreadsheet',
  PRESENTATION: 'application/vnd.google-apps.presentation',
  DRAWING: 'application/vnd.google-apps.drawing',
  FORM: 'application/vnd.google-apps.form',
  FOLDER: 'application/vnd.google-apps.folder',
} as const;

/**
 * Export format mappings for Google Workspace files
 */
export const EXPORT_FORMATS: Record<string, { mimeType: string; extension: string }[]> = {
  [GOOGLE_WORKSPACE_TYPES.DOCUMENT]: [
    { mimeType: 'application/pdf', extension: 'pdf' },
    { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', extension: 'docx' },
    { mimeType: 'text/plain', extension: 'txt' },
    { mimeType: 'text/html', extension: 'html' },
  ],
  [GOOGLE_WORKSPACE_TYPES.SPREADSHEET]: [
    { mimeType: 'application/pdf', extension: 'pdf' },
    { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: 'xlsx' },
    { mimeType: 'text/csv', extension: 'csv' },
  ],
  [GOOGLE_WORKSPACE_TYPES.PRESENTATION]: [
    { mimeType: 'application/pdf', extension: 'pdf' },
    { mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', extension: 'pptx' },
  ],
  [GOOGLE_WORKSPACE_TYPES.DRAWING]: [
    { mimeType: 'application/pdf', extension: 'pdf' },
    { mimeType: 'image/png', extension: 'png' },
    { mimeType: 'image/jpeg', extension: 'jpg' },
  ],
};

/**
 * Check if a MIME type is a Google Workspace file
 */
export function isGoogleWorkspaceFile(mimeType: string): boolean {
  return mimeType.startsWith('application/vnd.google-apps.');
}

/**
 * Get available export formats for a Google Workspace file
 */
export function getExportFormats(mimeType: string): { mimeType: string; extension: string }[] {
  return EXPORT_FORMATS[mimeType as keyof typeof EXPORT_FORMATS] || [];
}

/**
 * Get default export format for a Google Workspace file
 */
export function getDefaultExportFormat(mimeType: string): { mimeType: string; extension: string } | null {
  const formats = getExportFormats(mimeType);
  return formats.length > 0 ? formats[0] : null; // Default to PDF
}

/**
 * Categorize file by type
 */
export function categorizeFile(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'folder' | 'other' {
  if (mimeType === GOOGLE_WORKSPACE_TYPES.FOLDER) return 'folder';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) return 'document';
  return 'other';
}

/**
 * Build a Google Drive API search query
 */
export function buildSearchQuery(options: {
  query?: string;
  mimeType?: string;
  folderId?: string;
  trashed?: boolean;
}): string {
  const conditions: string[] = [];

  if (options.query) {
    conditions.push(`name contains '${options.query.replace(/'/g, "\\'")}'`);
  }

  if (options.mimeType) {
    conditions.push(`mimeType='${options.mimeType}'`);
  }

  if (options.folderId) {
    conditions.push(`'${options.folderId}' in parents`);
  } else {
    conditions.push(`'root' in parents`);
  }

  conditions.push(`trashed = ${options.trashed ?? false}`);

  return conditions.join(' and ');
}

/**
 * Check if a file name has a supported media extension
 */
export function isSupportedMediaFile(filename: string): boolean {
  const supportedExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
    '.mp4', '.mov', '.avi', '.wmv', '.flv', '.mkv', '.webm',
    '.mp3', '.wav', '.ogg', '.m4a', '.flac',
  ];

  const lowerFilename = filename.toLowerCase();
  return supportedExtensions.some(ext => lowerFilename.endsWith(ext));
}