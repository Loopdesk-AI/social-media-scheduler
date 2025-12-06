import { Integration } from "../../database/schema";

/**
 * Auth token details returned from OAuth flow
 */
export interface AuthTokenDetails {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Seconds until expiration
  id: string; // Platform user/account ID
  name: string;
  picture: string;
  username: string;
  email?: string;
}

/**
 * Media attachment for posts
 */
export interface MediaAttachment {
  path: string; // URL or file path
  type: "image" | "video";
  thumbnailTimestamp?: number; // For videos
}

/**
 * Post details for publishing
 */
export interface PostDetails {
  id: string; // Post record ID
  message: string; // Caption/description
  media?: MediaAttachment[];
  settings?: any; // Platform-specific settings
}

/**
 * Response after publishing post
 */
export interface PostResponse {
  id: string; // Post record ID
  postId: string; // Platform post ID
  releaseURL: string; // Published post URL
  status: "success" | "error";
}

/**
 * Analytics data point
 */
export interface AnalyticsDataPoint {
  total: number;
  date: string; // YYYY-MM-DD format
}

/**
 * Analytics data for a metric
 */
export interface AnalyticsData {
  label: string; // Metric name
  data: AnalyticsDataPoint[];
  average?: boolean; // If true, display as average
}

/**
 * Social media provider interface
 * All social platforms must implement this interface
 */
export interface SocialProvider {
  identifier: string; // Unique provider ID (e.g., 'instagram', 'youtube')
  name: string; // Display name
  scopes: string[]; // Required OAuth scopes
  editor: "normal" | "custom"; // Editor type
  dto?: any; // Settings DTO class
  maxConcurrentJob: number; // Max concurrent API calls

  /**
   * Get maximum content length for this platform
   */
  maxLength(): number;

  /**
   * Generate OAuth authorization URL
   */
  generateAuthUrl(): Promise<{
    url: string;
    codeVerifier: string;
    state: string;
  }>;

  /**
   * Exchange authorization code for tokens
   */
  authenticate(params: {
    code: string;
    codeVerifier: string;
    refresh?: string;
  }): Promise<AuthTokenDetails>;

  /**
   * Refresh access token using refresh token
   */
  refreshToken(refresh_token: string): Promise<AuthTokenDetails>;

  /**
   * Publish post to platform
   */
  post(
    id: string,
    accessToken: string,
    postDetails: PostDetails[],
    integration: Integration,
  ): Promise<PostResponse[]>;

  /**
   * Fetch analytics data
   */
  analytics(
    id: string,
    accessToken: string,
    date: number,
  ): Promise<AnalyticsData[]>;
}
