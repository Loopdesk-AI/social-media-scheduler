// LinkedIn utility functions

import axios from 'axios';
import { createReadStream, statSync } from 'fs';

/**
 * Validate content length (max 3000 characters)
 */
export function validateContentLength(content: string): boolean {
  return content.length > 0 && content.length <= 3000;
}

/**
 * Validate media count (max 9 images or 1 video)
 */
export function validateMediaCount(mediaCount: number, mediaType: 'image' | 'video'): boolean {
  if (mediaType === 'video') {
    return mediaCount === 1;
  }
  return mediaCount > 0 && mediaCount <= 9;
}

/**
 * Get file size in bytes
 */
export function getFileSize(filePath: string): number {
  try {
    const stats = statSync(filePath);
    return stats.size;
  } catch (error) {
    throw new Error(`Failed to get file size: ${error}`);
  }
}

/**
 * Validate image file size (max 10MB)
 */
export function validateImageSize(sizeBytes: number): boolean {
  const maxSize = 10 * 1024 * 1024; // 10MB
  return sizeBytes > 0 && sizeBytes <= maxSize;
}

/**
 * Validate video file size (max 5GB)
 */
export function validateVideoSize(sizeBytes: number): boolean {
  const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
  return sizeBytes > 0 && sizeBytes <= maxSize;
}

/**
 * Upload media to LinkedIn
 */
export async function uploadMediaToLinkedIn(
  uploadUrl: string,
  filePath: string,
  headers: Record<string, string>
): Promise<void> {
  const fileSize = getFileSize(filePath);
  const fileStream = createReadStream(filePath);

  await axios.put(uploadUrl, fileStream, {
    headers: {
      ...headers,
      'Content-Length': fileSize.toString(),
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
}

/**
 * Create LinkedIn URN for person
 */
export function createPersonUrn(personId: string): string {
  return `urn:li:person:${personId}`;
}

/**
 * Create LinkedIn URN for organization
 */
export function createOrganizationUrn(organizationId: string): string {
  return `urn:li:organization:${organizationId}`;
}

/**
 * Extract ID from LinkedIn URN
 */
export function extractIdFromUrn(urn: string): string {
  const parts = urn.split(':');
  return parts[parts.length - 1];
}

/**
 * Format date for analytics (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate engagement rate
 */
export function calculateEngagementRate(
  likes: number,
  comments: number,
  shares: number,
  impressions: number
): number {
  if (impressions === 0) return 0;
  return ((likes + comments + shares) / impressions) * 100;
}

/**
 * Determine media type from file extension
 */
export function getMediaType(filename: string): 'image' | 'video' | 'unknown' {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm'];
  
  if (imageExtensions.includes(ext)) return 'image';
  if (videoExtensions.includes(ext)) return 'video';
  return 'unknown';
}

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.substring(1)) : [];
}

/**
 * Wait for specified milliseconds (for retry delays)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exponential backoff delay calculation
 */
export function calculateBackoffDelay(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
}

/**
 * Validate article URL
 */
export function validateArticleUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
