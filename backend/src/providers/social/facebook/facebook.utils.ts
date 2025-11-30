// Facebook utility functions

import axios from 'axios';
import { createReadStream, statSync } from 'fs';

/**
 * Validate content length (max 63,206 characters)
 */
export function validateContentLength(content: string): boolean {
  return content.length > 0 && content.length <= 63206;
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
 * Validate video file size (max 10GB)
 */
export function validateVideoSize(sizeBytes: number): boolean {
  const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
  return sizeBytes > 0 && sizeBytes <= maxSize;
}

/**
 * Validate image file size (max 4MB)
 */
export function validateImageSize(sizeBytes: number): boolean {
  const maxSize = 4 * 1024 * 1024; // 4MB
  return sizeBytes > 0 && sizeBytes <= maxSize;
}

/**
 * Determine media type from file extension
 */
export function getMediaType(filename: string): 'image' | 'video' | 'unknown' {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm', '.mkv'];
  
  if (imageExtensions.includes(ext)) return 'image';
  if (videoExtensions.includes(ext)) return 'video';
  return 'unknown';
}

/**
 * Upload video in chunks using resumable upload
 */
export async function uploadVideoResumable(
  pageId: string,
  accessToken: string,
  filePath: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const fileSize = getFileSize(filePath);
  const chunkSize = 1024 * 1024 * 5; // 5MB chunks
  
  // Start upload session
  const startResponse = await axios.post(
    `https://graph.facebook.com/v20.0/${pageId}/videos`,
    {
      upload_phase: 'start',
      file_size: fileSize,
    },
    {
      params: {
        access_token: accessToken,
      },
    }
  );
  
  const uploadSessionId = startResponse.data.upload_session_id;
  const videoId = startResponse.data.video_id;
  
  // Upload chunks
  let startOffset = 0;
  while (startOffset < fileSize) {
    const endOffset = Math.min(startOffset + chunkSize, fileSize);
    const chunk = createReadStream(filePath, { start: startOffset, end: endOffset - 1 });
    
    await axios.post(
      `https://graph.facebook.com/v20.0/${pageId}/videos`,
      chunk,
      {
        params: {
          access_token: accessToken,
          upload_phase: 'transfer',
          upload_session_id: uploadSessionId,
          start_offset: startOffset,
        },
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      }
    );
    
    startOffset = endOffset;
    
    if (onProgress) {
      const progress = (startOffset / fileSize) * 100;
      onProgress(progress);
    }
  }
  
  // Finish upload
  await axios.post(
    `https://graph.facebook.com/v20.0/${pageId}/videos`,
    {
      upload_phase: 'finish',
      upload_session_id: uploadSessionId,
    },
    {
      params: {
        access_token: accessToken,
      },
    }
  );
  
  return videoId;
}

/**
 * Poll video processing status
 */
export async function pollVideoStatus(
  videoId: string,
  accessToken: string,
  maxAttempts: number = 60,
  intervalMs: number = 5000
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await axios.get(
      `https://graph.facebook.com/v20.0/${videoId}`,
      {
        params: {
          access_token: accessToken,
          fields: 'status',
        },
      }
    );
    
    const status = response.data.status?.video_status;
    
    if (status === 'ready') {
      return true;
    }
    
    if (status === 'error') {
      throw new Error('Video processing failed');
    }
    
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error('Video processing timeout');
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
  engaged: number,
  impressions: number
): number {
  if (impressions === 0) return 0;
  return (engaged / impressions) * 100;
}

/**
 * Extract Open Graph metadata from URL
 */
export async function extractOGMetadata(url: string): Promise<{
  title?: string;
  description?: string;
  image?: string;
}> {
  try {
    const response = await axios.get(url);
    const html = response.data;
    
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    
    return {
      title: titleMatch ? titleMatch[1] : undefined,
      description: descMatch ? descMatch[1] : undefined,
      image: imageMatch ? imageMatch[1] : undefined,
    };
  } catch (error) {
    return {};
  }
}

/**
 * Wait for specified milliseconds
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
