// YouTube-specific TypeScript interfaces

export interface YouTubeVideoSnippet {
  title: string;
  description: string;
  tags?: string[];
  categoryId?: string;
  defaultLanguage?: string;
  defaultAudioLanguage?: string;
}

export interface YouTubeVideoStatus {
  privacyStatus: 'public' | 'private' | 'unlisted';
  embeddable?: boolean;
  license?: 'youtube' | 'creativeCommon';
  publicStatsViewable?: boolean;
  publishAt?: string;
  selfDeclaredMadeForKids?: boolean;
}

export interface YouTubeVideoSettings {
  title: string;
  description: string;
  tags?: string[];
  privacyStatus: 'public' | 'private' | 'unlisted';
  thumbnail?: string;
  selfDeclaredMadeForKids?: boolean;
  categoryId?: string;
  publishAt?: string;
}

export interface YouTubeTokenResponse {
  access_token: string;
  refresh_token?: string;
  expiry_date: number;
  scope: string;
  token_type: string;
}

export interface YouTubeUserProfile {
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
    thumbnails: {
      default: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
}

export interface YouTubeAnalyticsMetrics {
  views: number;
  estimatedMinutesWatched: number;
  averageViewDuration: number;
  subscribersGained: number;
  likes: number;
}

export interface YouTubeAnalyticsRow {
  day: string;
  views: number;
  estimatedMinutesWatched: number;
  averageViewDuration: number;
  subscribersGained: number;
  likes: number;
}

export interface YouTubeErrorResponse {
  error: {
    code: number;
    message: string;
    errors: Array<{
      domain: string;
      reason: string;
      message: string;
    }>;
  };
}
