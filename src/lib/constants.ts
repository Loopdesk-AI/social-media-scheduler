// Platform character limits for social media posts
export const PLATFORM_CHAR_LIMITS: Record<string, number> = {
  twitter: 280,
  x: 280,
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
  tiktok: 2200,
  youtube: 5000,
};

// Warning threshold (90% of limit)
export const WARNING_THRESHOLD = 0.9;

// Get character limit for a platform
export function getCharacterLimit(platform: string): number {
  return PLATFORM_CHAR_LIMITS[platform.toLowerCase()] || 280;
}

// Get character count state (normal, warning, error)
export function getCharacterCountState(
  count: number,
  limit: number
): 'normal' | 'warning' | 'error' {
  if (count > limit) return 'error';
  if (count >= limit * WARNING_THRESHOLD) return 'warning';
  return 'normal';
}

