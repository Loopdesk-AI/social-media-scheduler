// TikTok-specific TypeScript interfaces

export type TikTokPrivacyLevel = 
  | 'PUBLIC_TO_EVERYONE'
  | 'MUTUAL_FOLLOW_FRIENDS'
  | 'SELF_ONLY'
  | 'FOLLOWER_OF_CREATOR';

export interface TikTokVideoSettings {
  title: string;
  privacy_level?: TikTokPrivacyLevel;
  disable_comment?: boolean;
  disable_duet?: boolean;
  disable_stitch?: boolean;
  video_cover_timestamp_ms?: number;
  brand_content_toggle?: boolean;
  brand_organic_toggle?: boolean;
}

export interface TikTokPostInfo {
  title: string;
  privacy_level: TikTokPrivacyLevel;
  disable_comment: boolean;
  disable_duet: boolean;
  disable_stitch: boolean;
  video_cover_timestamp_ms?: number;
}

export interface TikTokSourceInfo {
  source: 'FILE_UPLOAD' | 'PULL_FROM_URL';
  video_size?: number;
  chunk_size?: number;
  total_chunk_count?: number;
  video_url?: string;
}

export interface TikTokInitResponse {
  data: {
    publish_id: string;
    upload_url: string;
  };
  error?: {
    code: string;
    message: string;
    log_id: string;
  };
}

export interface TikTokPublishStatusResponse {
  data: {
    status: 'PROCESSING_UPLOAD' | 'SEND_TO_USER_INBOX' | 'PUBLISH_COMPLETE' | 'FAILED';
    video_id?: string;
    share_url?: string;
    fail_reason?: string;
  };
  error?: {
    code: string;
    message: string;
    log_id: string;
  };
}

export interface TikTokUserInfo {
  data: {
    user: {
      open_id: string;
      union_id: string;
      avatar_url: string;
      avatar_url_100: string;
      avatar_large_url: string;
      display_name: string;
      bio_description: string;
      profile_deep_link: string;
      is_verified: boolean;
      follower_count: number;
      following_count: number;
      likes_count: number;
      video_count: number;
    };
  };
  error?: {
    code: string;
    message: string;
    log_id: string;
  };
}

export interface TikTokTokenResponse {
  access_token: string;
  expires_in: number;
  open_id: string;
  refresh_expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

export interface TikTokVideoQuery {
  and?: Array<{
    field_name: string;
    operation: 'EQ' | 'IN' | 'GT' | 'GTE' | 'LT' | 'LTE';
    field_values: string[];
  }>;
  or?: Array<{
    field_name: string;
    operation: 'EQ' | 'IN' | 'GT' | 'GTE' | 'LT' | 'LTE';
    field_values: string[];
  }>;
}

export interface TikTokVideoMetrics {
  video_id: string;
  create_time: number;
  video_description: string;
  video_views: number;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  total_time_watched: number;
  average_time_watched: number;
  full_video_watched_rate: number;
}

export interface TikTokAnalyticsResponse {
  data: {
    videos: TikTokVideoMetrics[];
    cursor: number;
    has_more: boolean;
  };
  error?: {
    code: string;
    message: string;
    log_id: string;
  };
}

export interface TikTokErrorResponse {
  error: {
    code: string;
    message: string;
    log_id: string;
  };
}
