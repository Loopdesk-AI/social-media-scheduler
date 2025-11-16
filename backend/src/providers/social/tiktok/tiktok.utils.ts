// TikTok utility functions

import axios from 'axios';
import { createReadStream, statSync } from 'fs';
import { Readable } from 'stream';

/**
 * Validate video duration (3 seconds to 10 minutes)
 */
export function validateVideoDuration(durationSeconds: number): boolean {
  return durationSeconds >= 3 && durationSeconds <= 600;
}

/**
 * Validate video file size (max 4GB)
 */
export function validateVideoSize(sizeBytes: number): boolean {
  const maxSize = 4 * 1024 * 1024 * 1024; // 4GB
  return sizeBytes > 0 && sizeBytes <= maxSize;
}

/**
 * Validate video format
 */
export function validateVideoFormat(filename: string): boolean {
  const validExtensions = ['.mp4', '.mov', '.mpeg', '.mpg', '.avi', '.flv', '.webm'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return validExtensions.includes(ext);
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
 * Calculate chunk size for upload (recommended 5-10MB per chunk)
 */
export function calculateChunkSize(fileSize: number): number {
  const minChunkSize = 5 * 1024 * 1024; // 5MB
  const maxChunkSize = 10 * 1024 * 1024; // 10MB
  const maxChunks = 1000; // TikTok limit
  
  // Calculate optimal chunk size
  let chunkSize = Math.ceil(fileSize / maxChunks);
  
  // Ensure chunk size is within bounds
  if (chunkSize < minChunkSize) {
    chunkSize = minChunkSize;
  } else if (chunkSize > maxChunkSize) {
    chunkSize = maxChunkSize;
  }
  
  return chunkSize;
}

/**
 * Calculate total number of chunks
 */
export function calculateTotalChunks(fileSize: number, chunkSize: number): number {
  return Math.ceil(fileSize / chunkSize);
}

/**
 * Upload video in chunks to TikTok
 */
export async function uploadChunkedVideo(
  uploadUrl: string,
  filePath: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  const fileSize = getFileSize(filePath);
  const chunkSize = calculateChunkSize(fileSize);
  const totalChunks = calculateTotalChunks(fileSize, chunkSize);
  
  let uploadedBytes = 0;
  
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, fileSize);
    const chunkLength = end - start;
    
    // Create read stream for this chunk
    const stream = createReadStream(filePath, { start, end: end - 1 });
    
    // Upload chunk
    await axios.put(uploadUrl, stream, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': chunkLength.toString(),
        'Content-Range': `bytes ${start}-${end - 1}/${fileSize}`,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    
    uploadedBytes += chunkLength;
    
    // Report progress
    if (onProgress) {
      const progress = (uploadedBytes / fileSize) * 100;
      onProgress(progress);
    }
  }
}

/**
 * Download video from URL
 */
export async function downloadVideo(url: string): Promise<Buffer> {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    maxContentLength: 4 * 1024 * 1024 * 1024, // 4GB
  });
  
  return Buffer.from(response.data);
}

/**
 * Poll publish status until complete
 */
export async function pollPublishStatus(
  accessToken: string,
  publishId: string,
  maxAttempts: number = 60,
  intervalMs: number = 5000
): Promise<{ status: string; videoId?: string; shareUrl?: string; failReason?: string }> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await axios.post(
      'https://open.tiktokapis.com/v2/post/publish/status/fetch/',
      { publish_id: publishId },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const data = response.data;
    
    if (data.error) {
      throw new Error(`Status check failed: ${data.error.message}`);
    }
    
    const status = data.data.status;
    
    // Check if processing is complete
    if (status === 'PUBLISH_COMPLETE') {
      return {
        status,
        videoId: data.data.video_id,
        shareUrl: data.data.share_url,
      };
    }
    
    // Check if processing failed
    if (status === 'FAILED') {
      return {
        status,
        failReason: data.data.fail_reason || 'Unknown error',
      };
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error('Publish status polling timeout');
}

/**
 * Format timestamp for analytics
 */
export function formatTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Calculate engagement rate
 */
export function calculateEngagementRate(
  likes: number,
  comments: number,
  shares: number,
  views: number
): number {
  if (views === 0) return 0;
  return ((likes + comments + shares) / views) * 100;
}

/**
 * Validate title length (max 2200 characters)
 */
export function validateTitle(title: string): boolean {
  return title.length > 0 && title.length <= 2200;
}

/**
 * Generate code challenge for PKCE (if needed in future)
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
