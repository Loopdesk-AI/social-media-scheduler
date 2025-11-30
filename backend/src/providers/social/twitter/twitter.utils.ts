// Twitter/X utility functions

import crypto from 'crypto';

/**
 * Validate tweet text length (max 280 characters)
 */
export function validateTweetLength(text: string): boolean {
  return text.length > 0 && text.length <= 280;
}

/**
 * Validate poll options (2-4 options, max 25 characters each)
 */
export function validatePollOptions(options: string[]): boolean {
  if (options.length < 2 || options.length > 4) return false;
  return options.every(option => option.length > 0 && option.length <= 25);
}

/**
 * Validate poll duration (5 minutes to 7 days)
 */
export function validatePollDuration(minutes: number): boolean {
  return minutes >= 5 && minutes <= 10080; // 7 days = 10080 minutes
}

/**
 * Validate media count (max 4 images or 1 video or 1 GIF)
 */
export function validateMediaCount(count: number, type: 'image' | 'video' | 'gif'): boolean {
  if (type === 'image') return count > 0 && count <= 4;
  if (type === 'video' || type === 'gif') return count === 1;
  return false;
}

/**
 * Generate PKCE code verifier
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate PKCE code challenge from verifier
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(hash).toString('base64url');
}

/**
 * Calculate engagement rate
 */
export function calculateEngagementRate(
  likes: number,
  replies: number,
  retweets: number,
  quotes: number,
  impressions: number
): number {
  if (impressions === 0) return 0;
  return ((likes + replies + retweets + quotes) / impressions) * 100;
}

/**
 * Format date for analytics (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Determine media type from file extension
 */
export function getMediaType(filename: string): 'image' | 'video' | 'gif' | 'unknown' {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const videoExtensions = ['.mp4', '.mov'];
  const gifExtensions = ['.gif'];
  
  if (imageExtensions.includes(ext)) return 'image';
  if (videoExtensions.includes(ext)) return 'video';
  if (gifExtensions.includes(ext)) return 'gif';
  return 'unknown';
}

/**
 * Split long text into thread tweets (max 280 chars each)
 */
export function splitIntoThread(text: string, maxLength: number = 280): string[] {
  if (text.length <= maxLength) return [text];
  
  const tweets: string[] = [];
  const words = text.split(' ');
  let currentTweet = '';
  
  for (const word of words) {
    if ((currentTweet + ' ' + word).trim().length <= maxLength) {
      currentTweet = (currentTweet + ' ' + word).trim();
    } else {
      if (currentTweet) tweets.push(currentTweet);
      currentTweet = word;
    }
  }
  
  if (currentTweet) tweets.push(currentTweet);
  
  return tweets;
}

/**
 * Wait for specified milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate rate limit reset time
 */
export function calculateResetTime(resetTimestamp: number): number {
  return Math.max(0, resetTimestamp * 1000 - Date.now());
}
