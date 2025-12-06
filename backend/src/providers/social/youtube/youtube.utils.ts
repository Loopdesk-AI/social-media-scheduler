// YouTube utility functions

import axios from "axios";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";

/**
 * Download video file to temporary location
 */
export async function downloadVideo(url: string): Promise<string> {
  const tempPath = join(
    tmpdir(),
    `youtube-upload-${randomBytes(16).toString("hex")}.mp4`,
  );

  try {
    const response = await axios({
      method: "GET",
      url,
      responseType: "stream",
      timeout: 300000, // 5 minute timeout for large videos
    });

    const writer = createWriteStream(tempPath);
    await pipeline(response.data, writer);

    return tempPath;
  } catch (error: any) {
    // Extract meaningful error info without circular references
    let errorMessage = "Failed to download video";

    if (error.response) {
      // HTTP error response
      const status = error.response.status;
      if (status === 404) {
        errorMessage = `Video file not found at URL: ${url}. Make sure the file exists and is accessible.`;
      } else if (status === 403) {
        errorMessage = `Access denied to video file at URL: ${url}`;
      } else {
        errorMessage = `HTTP ${status} error downloading video from: ${url}`;
      }
    } else if (error.code === "ECONNREFUSED") {
      errorMessage = `Cannot connect to server for video download: ${url}. Is the server running?`;
    } else if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
      errorMessage = `Timeout downloading video from: ${url}`;
    } else if (error.message) {
      errorMessage = `Failed to download video: ${error.message}`;
    }

    throw new Error(errorMessage);
  }
}

/**
 * Create video read stream for upload
 */
export function createVideoStream(filePath: string) {
  return createReadStream(filePath);
}

/**
 * Format video duration in seconds to ISO 8601 duration format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  let duration = "PT";
  if (hours > 0) duration += `${hours}H`;
  if (minutes > 0) duration += `${minutes}M`;
  if (secs > 0) duration += `${secs}S`;

  return duration || "PT0S";
}

/**
 * Parse ISO 8601 duration to seconds
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Validate video title length
 */
export function validateTitle(title: string): boolean {
  return title.length > 0 && title.length <= 100;
}

/**
 * Validate video description length
 */
export function validateDescription(description: string): boolean {
  return description.length <= 5000;
}

/**
 * Validate tags
 */
export function validateTags(tags: string[]): boolean {
  if (tags.length > 500) return false;

  const totalLength = tags.join("").length;
  if (totalLength > 400) return false;

  return tags.every((tag) => tag.length <= 30);
}

/**
 * Format analytics date range
 */
export function formatDateRange(
  startDate: Date,
  endDate: Date,
): { startDate: string; endDate: string } {
  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}

/**
 * Calculate token expiration timestamp
 */
export function calculateExpiration(expiryDate: number): Date {
  return new Date(expiryDate);
}

/**
 * Check if token is expired or expiring soon (within 5 minutes)
 */
export function isTokenExpired(expiryDate: number): boolean {
  const now = Date.now();
  const expiresAt = expiryDate;
  const fiveMinutes = 5 * 60 * 1000;

  return expiresAt - now < fiveMinutes;
}
