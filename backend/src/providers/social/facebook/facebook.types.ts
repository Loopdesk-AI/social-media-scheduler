// Facebook-specific TypeScript interfaces

export interface FacebookPageSettings {
  message: string;
  link?: string;
  published?: boolean;
  scheduled_publish_time?: number;
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

export interface FacebookPagesResponse {
  data: FacebookPage[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

export interface FacebookPostResponse {
  id: string;
  post_id?: string;
}

export interface FacebookPhotoResponse {
  id: string;
  post_id: string;
}

export interface FacebookVideoUploadResponse {
  id: string;
  video_id?: string;
}

export interface FacebookVideoStatus {
  status: 'processing' | 'ready' | 'error';
  video: {
    id: string;
  };
}

export interface FacebookInsightsResponse {
  data: Array<{
    name: string;
    period: string;
    values: Array<{
      value: number;
      end_time: string;
    }>;
    title: string;
    description: string;
    id: string;
  }>;
  paging?: {
    previous?: string;
    next?: string;
  };
}

export interface FacebookPostInsights {
  post_impressions: number;
  post_engaged_users: number;
  post_clicks: number;
  post_reactions_like_total: number;
  post_reactions_love_total: number;
  post_reactions_wow_total: number;
  post_reactions_haha_total: number;
  post_reactions_sorry_total: number;
  post_reactions_anger_total: number;
}

export interface FacebookErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

export interface FacebookOAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface FacebookUserProfile {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

export interface FacebookMediaUploadSession {
  upload_session_id: string;
  video_id: string;
  start_offset: number;
  end_offset: number;
}

export interface FacebookStorySettings {
  mediaUrl: string;
  mediaType: 'photo' | 'video';
}

export interface FacebookCarouselCard {
  imageUrl: string;
  link: string;
  title: string;
  description?: string;
}

export interface FacebookCarouselSettings {
  message: string;
  cards: FacebookCarouselCard[]; // 2-10 cards
}

export interface FacebookReelSettings {
  videoUrl: string;
  description: string;
}

