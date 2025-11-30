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
  clipTitle?: string;
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

export interface LinkedInCarouselCard {
  imageUrl: string;
  title: string;
  description?: string;
  landingPageUrl?: string;
}

export interface LinkedInCarouselSettings {
  text: string;
  cards: LinkedInCarouselCard[]; // 2-10 cards
  isOrganization?: boolean;
  organizationId?: string;
}

export interface LinkedInHashtagSuggestion {
  hashtag: string;
  relevanceScore?: number;
}

// ===== Videos API Types (NEW) =====

export interface LinkedInVideoInitializeRequest {
  initializeUploadRequest: {
    owner: string; // URN
    fileSizeBytes: number;
    uploadCaptions: boolean;
    uploadThumbnail: boolean;
  };
}

export interface LinkedInVideoUploadInstruction {
  uploadUrl: string;
  firstByte: number;
  lastByte: number;
}

export interface LinkedInVideoInitializeResponse {
  value: {
    video: string; // Video URN
    uploadInstructions: LinkedInVideoUploadInstruction[];
    uploadToken?: string;
  };
}

export interface LinkedInVideoFinalizeRequest {
  finalizeUploadRequest: {
    video: string; // Video URN
    uploadToken: string;
    uploadedPartIds: string[];
  };
}

// ===== Posts API Types (NEW - /rest/posts) =====

export interface LinkedInPostRequest {
  author: string; // URN
  commentary: string;
  visibility: 'PUBLIC' | 'CONNECTIONS';
  distribution: {
    feedDistribution: 'MAIN_FEED';
    targetEntities: any[];
    thirdPartyDistributionChannels: any[];
  };
  content?: {
    media?: {
      title?: string;
      id: string; // URN
    };
    article?: {
      source: string;
      thumbnail?: string;
      title?: string;
      description?: string;
    };
  };
  lifecycleState: 'PUBLISHED' | 'DRAFT';
  isReshareDisabledByAuthor: boolean;
}
