// Twitter/X-specific TypeScript interfaces

export interface TwitterPostSettings {
  text: string;
  poll?: {
    options: string[];
    duration_minutes: number;
  };
  reply_settings?: 'everyone' | 'mentionedUsers' | 'following';
  quote_tweet_id?: string;
  for_super_followers_only?: boolean;
}

export interface TwitterMediaUpload {
  media_id: string;
  media_id_string: string;
  size: number;
  expires_after_secs: number;
  image?: {
    image_type: string;
    w: number;
    h: number;
  };
  video?: {
    video_type: string;
  };
}

export interface TwitterTweetResponse {
  data: {
    id: string;
    text: string;
    edit_history_tweet_ids: string[];
  };
}

export interface TwitterUserResponse {
  data: {
    id: string;
    name: string;
    username: string;
    profile_image_url?: string;
  };
}

export interface TwitterMetrics {
  impression_count: number;
  like_count: number;
  reply_count: number;
  retweet_count: number;
  quote_count: number;
  bookmark_count?: number;
  url_link_clicks?: number;
  user_profile_clicks?: number;
}

export interface TwitterTweetMetrics {
  data: {
    public_metrics: TwitterMetrics;
    non_public_metrics?: {
      impression_count: number;
      url_link_clicks: number;
      user_profile_clicks: number;
    };
    organic_metrics?: TwitterMetrics;
    promoted_metrics?: TwitterMetrics;
  };
}

export interface TwitterErrorResponse {
  errors: Array<{
    message: string;
    type: string;
    title?: string;
    detail?: string;
    value?: string;
  }>;
  title?: string;
  detail?: string;
  type?: string;
}

export interface TwitterOAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface TwitterPollOptions {
  options: string[];
  duration_minutes: number;
}

export interface TwitterThreadSettings {
  tweets: Array<{
    text: string;
    mediaIds?: string[];
  }>;
  reply_settings?: 'everyone' | 'mentionedUsers' | 'following';
}

export interface TwitterQuoteTweetSettings {
  text: string;
  quotedTweetId: string;
  mediaIds?: string[];
}

export interface TwitterMediaAltText {
  mediaId: string;
  altText: string;
}

