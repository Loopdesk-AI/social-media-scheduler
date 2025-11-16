// LinkedIn-specific TypeScript interfaces

export interface LinkedInUserProfile {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  vanityName?: string;
  profilePicture?: {
    displayImage: string;
    'displayImage~': {
      elements: Array<{
        identifiers: Array<{ identifier: string }>;
      }>;
    };
  };
}

export interface LinkedInOrganization {
  id: string;
  localizedName: string;
  vanityName?: string;
  logoV2?: {
    original: string;
  };
}

export interface LinkedInUGCPostSettings {
  text: string;
  mediaUrns?: string[];
  articleUrl?: string;
  articleTitle?: string;
  visibility?: 'PUBLIC' | 'CONNECTIONS';
  isOrganization?: boolean;
  organizationId?: string;
}

export interface LinkedInShareContent {
  shareCommentary: {
    text: string;
  };
  shareMediaCategory: 'NONE' | 'IMAGE' | 'VIDEO' | 'ARTICLE';
  media?: Array<{
    status: 'READY';
    description?: {
      text: string;
    };
    media: string; // URN
    title?: {
      text: string;
    };
  }>;
  shareFeatures?: {
    hashtags?: Array<{ text: string }>;
  };
}

export interface LinkedInUGCPost {
  author: string; // URN
  lifecycleState: 'PUBLISHED' | 'DRAFT';
  specificContent: {
    'com.linkedin.ugc.ShareContent': LinkedInShareContent;
  };
  visibility: {
    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' | 'CONNECTIONS';
  };
}

export interface LinkedInMediaUploadRequest {
  registerUploadRequest: {
    recipes: string[];
    owner: string; // URN
    serviceRelationships: Array<{
      relationshipType: 'OWNER';
      identifier: 'urn:li:userGeneratedContent';
    }>;
  };
}

export interface LinkedInMediaUploadResponse {
  value: {
    uploadMechanism: {
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
        uploadUrl: string;
        headers: Record<string, string>;
      };
    };
    asset: string; // URN
    mediaArtifact: string;
  };
}

export interface LinkedInPostResponse {
  id: string;
  activity: string;
}

export interface LinkedInOrganizationShareStatistics {
  totalShareStatistics: {
    shareCount: number;
    likeCount: number;
    commentCount: number;
    clickCount: number;
    impressionCount: number;
    engagement: number;
  };
  timeRange: {
    start: number;
    end: number;
  };
}

export interface LinkedInUGCShareStatistics {
  totalShareStatistics: {
    shareCount: number;
    likeCount: number;
    commentCount: number;
    clickCount: number;
    impressionCount: number;
    engagement: number;
  };
}

export interface LinkedInAnalyticsMetrics {
  impressions: number;
  clicks: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

export interface LinkedInErrorResponse {
  status: number;
  message: string;
  serviceErrorCode?: number;
}

export type LinkedInPostType = 'personal' | 'organization';

export interface LinkedInMediaAsset {
  urn: string;
  uploadUrl: string;
  headers: Record<string, string>;
}
