/**
 * Filter files by supported media types
 * @param mimeType The MIME type to check
 * @returns True if the MIME type is supported
 */
export function isSupportedMediaType(mimeType: string): boolean {
  const supportedTypes = [
    // Image types
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    
    // Video types
    'video/mp4',
    'video/mpeg',
    'video/ogg',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo'
  ];

  return supportedTypes.includes(mimeType);
}

/**
 * Filter files by supported file extensions
 * @param fileName The file name to check
 * @returns True if the file extension is supported
 */
export function isSupportedMediaFile(fileName: string): boolean {
  const supportedExtensions = [
    // Image extensions
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    
    // Video extensions
    '.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm'
  ];

  const lowerFileName = fileName.toLowerCase();
  return supportedExtensions.some(ext => lowerFileName.endsWith(ext));
}

/**
 * Format bytes to human readable format
 * @param bytes Number of bytes
 * @param decimals Number of decimal places
 * @returns Formatted string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Generate thumbnail URL for Dropbox files
 * @param fileId The Dropbox file ID
 * @param accessToken The access token
 * @returns Thumbnail URL or undefined if not available
 */
export function generateThumbnailUrl(fileId: string, accessToken: string): string | undefined {
  // For Dropbox, we would typically use the filesGetThumbnail method
  // This is a placeholder implementation
  return undefined;
}