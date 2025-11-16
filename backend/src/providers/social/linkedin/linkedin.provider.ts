// LinkedIn Provider Implementation

import axios from 'axios';
import { SocialAbstract } from '../../base/social.abstract';
import { SocialProvider, AuthTokenDetails, PostDetails, PostResponse, AnalyticsData } from '../../base/social.interface';
import { mapLinkedInError } from './linkedin.errors';
import {
  LinkedInUGCPostSettings,
  LinkedInUGCPost,
  LinkedInMediaUploadRequest,
  LinkedInMediaUploadResponse,
  LinkedInPostResponse,
  LinkedInUserProfile,
  LinkedInOrganization,
} from './linkedin.types';
import {
  validateContentLength,
  validateMediaCount,
  getFileSize,
  validateImageSize,
  validateVideoSize,
  uploadMediaToLinkedIn,
  createPersonUrn,
  createOrganizationUrn,
  extractIdFromUrn,
  formatDate,
  calculateEngagementRate,
  getMediaType,
  extractHashtags,
  wait,
  calculateBackoffDelay,
  validateArticleUrl,
} from './linkedin.utils';
import { makeId } from '../../../utils/helpers';

export class LinkedInProvider extends SocialAbstract implements SocialProvider {
  identifier = 'linkedin';
  name = 'LinkedIn';
  scopes = ['r_liteprofile', 'r_emailaddress', 'w_member_social', 'w_organization_social'];
  override maxConcurrentJob = 5;
  dto = {} as LinkedInUGCPostSettings;
  editor = 'normal' as const;

  private readonly baseUrl = 'https://api.linkedin.com/v2';
  private readonly redirectUri = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/integrations/linkedin/callback`;

  maxLength(): number {
    return 3000; // LinkedIn post limit
  }

  async generateAuthUrl(): Promise<{
    url: string;
    codeVerifier: string;
    state: string;
  }> {
    const state = makeId(6);
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      redirect_uri: this.redirectUri,
      state,
      scope: this.scopes.join(' '),
    });

    return {
      url: `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`,
      codeVerifier: makeId(10),
      state,
    };
  }

  async authenticate(params: {
    code: string;
    codeVerifier: string;
    refresh?: string;
  }): Promise<AuthTokenDetails> {
    try {
      // Exchange code for access token
      const tokenResponse = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: params.code,
          redirect_uri: this.redirectUri,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const tokens = tokenResponse.data;

      if (!tokens.access_token) {
        throw new Error('No access token received from LinkedIn');
      }

      // Fetch user profile
      const profileResponse = await axios.get<LinkedInUserProfile>(
        `${this.baseUrl}/me`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
          },
        }
      );

      const profile = profileResponse.data;

      // Fetch organizations if scope granted
      let organizations: LinkedInOrganization[] = [];
      if (this.scopes.includes('w_organization_social')) {
        try {
          const orgsResponse = await axios.get(
            `${this.baseUrl}/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName,vanityName,logoV2(original~:playableStreams))))`,
            {
              headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
              },
            }
          );
          
          organizations = orgsResponse.data.elements?.map((el: any) => el['organization~']) || [];
        } catch (error) {
          console.warn('Failed to fetch organizations:', error);
        }
      }

      // Get profile picture
      let picture = '';
      if (profile.profilePicture && profile.profilePicture['displayImage~']?.elements?.length > 0) {
        const displayImage = profile.profilePicture['displayImage~'];
        if (displayImage && displayImage.elements && displayImage.elements[0]) {
          picture = displayImage.elements[0].identifiers[0].identifier;
        }
      }

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '',
        expiresIn: tokens.expires_in || 5184000, // 60 days default
        id: profile.id,
        name: `${profile.localizedFirstName} ${profile.localizedLastName}`,
        picture,
        username: profile.vanityName || profile.id,
      } as any;
    } catch (error: any) {
      const errorBody = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      const mappedError = this.handleErrors(errorBody, error.response?.status);
      
      if (mappedError) {
        throw new Error(mappedError.value);
      }
      
      throw error;
    }
  }

  async refreshToken(refresh_token: string): Promise<AuthTokenDetails> {
    try {
      // LinkedIn tokens are long-lived (60 days), refresh if needed
      const tokenResponse = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const tokens = tokenResponse.data;

      // Fetch updated profile
      const profileResponse = await axios.get<LinkedInUserProfile>(
        `${this.baseUrl}/me`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
          },
        }
      );

      const profile = profileResponse.data;

      let picture = '';
      if (profile.profilePicture && profile.profilePicture['displayImage~']?.elements?.length > 0) {
        const displayImage = profile.profilePicture['displayImage~'];
        if (displayImage && displayImage.elements && displayImage.elements[0]) {
          picture = displayImage.elements[0].identifiers[0].identifier;
        }
      }

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || refresh_token,
        expiresIn: tokens.expires_in || 5184000,
        id: profile.id,
        name: `${profile.localizedFirstName} ${profile.localizedLastName}`,
        picture,
        username: profile.vanityName || profile.id,
      };
    } catch (error: any) {
      const errorBody = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      const mappedError = this.handleErrors(errorBody, error.response?.status);
      
      if (mappedError) {
        throw new Error(mappedError.value);
      }
      
      throw error;
    }
  }

  async post(
    id: string,
    accessToken: string,
    postDetails: PostDetails[],
    integration: any
  ): Promise<PostResponse[]> {
    const postDetail = postDetails[0];
    const settings = postDetail.settings as LinkedInUGCPostSettings;

    // Validate content length
    if (!validateContentLength(settings.text)) {
      throw new Error('LinkedIn post content must be between 1 and 3000 characters');
    }

    // Determine if posting to organization or personal
    const isOrganization = settings.isOrganization || false;
    const author = isOrganization 
      ? createOrganizationUrn(settings.organizationId || id)
      : createPersonUrn(id);

    try {
      // Upload media if present
      const mediaUrns: string[] = [];
      
      if (postDetail.media && postDetail.media.length > 0) {
        const mediaType = getMediaType(postDetail.media[0].path);
        
        if (mediaType !== 'unknown' && !validateMediaCount(postDetail.media.length, mediaType)) {
          throw new Error('LinkedIn supports max 9 images or 1 video per post');
        }

        for (const media of postDetail.media) {
          const mediaUrn = await this.uploadMedia(accessToken, author, media.path);
          mediaUrns.push(mediaUrn);
        }
      }

      // Determine share media category
      let shareMediaCategory: 'NONE' | 'IMAGE' | 'VIDEO' | 'ARTICLE' = 'NONE';
      if (settings.articleUrl) {
        shareMediaCategory = 'ARTICLE';
      } else if (mediaUrns.length > 0) {
        const firstMediaType = getMediaType(postDetail.media![0].path);
        shareMediaCategory = firstMediaType === 'video' ? 'VIDEO' : 'IMAGE';
      }

      // Create UGC post
      const ugcPost: LinkedInUGCPost = {
        author,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: settings.text,
            },
            shareMediaCategory,
            media: mediaUrns.map(urn => ({
              status: 'READY',
              media: urn,
            })),
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': settings.visibility || 'PUBLIC',
        },
      };

      // Add article if provided
      if (settings.articleUrl && validateArticleUrl(settings.articleUrl)) {
        ugcPost.specificContent['com.linkedin.ugc.ShareContent'].media = [{
          status: 'READY',
          media: settings.articleUrl,
          title: settings.articleTitle ? { text: settings.articleTitle } : undefined,
        }];
      }

      const response = await axios.post<LinkedInPostResponse>(
        `${this.baseUrl}/ugcPosts`,
        ugcPost,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      const postId = extractIdFromUrn(response.data.id);

      return [{
        id: postDetail.id,
        postId,
        releaseURL: `https://www.linkedin.com/feed/update/${response.data.id}`,
        status: 'success',
      }];
    } catch (error: any) {
      const errorBody = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      const mappedError = this.handleErrors(errorBody, error.response?.status);
      
      if (mappedError) {
        throw new Error(mappedError.value);
      }
      
      throw error;
    }
  }

  private async uploadMedia(
    accessToken: string,
    author: string,
    filePath: string
  ): Promise<string> {
    const mediaType = getMediaType(filePath);
    const fileSize = getFileSize(filePath);

    // Validate file size
    if (mediaType === 'image' && !validateImageSize(fileSize)) {
      throw new Error('Image size must not exceed 10MB');
    }
    if (mediaType === 'video' && !validateVideoSize(fileSize)) {
      throw new Error('Video size must not exceed 5GB');
    }

    // Register upload
    const recipe = mediaType === 'image' 
      ? 'urn:li:digitalmediaRecipe:feedshare-image'
      : 'urn:li:digitalmediaRecipe:feedshare-video';

    const registerRequest: LinkedInMediaUploadRequest = {
      registerUploadRequest: {
        recipes: [recipe],
        owner: author,
        serviceRelationships: [{
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        }],
      },
    };

    const registerResponse = await axios.post<LinkedInMediaUploadResponse>(
      `${this.baseUrl}/assets?action=registerUpload`,
      registerRequest,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { uploadUrl, headers } = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'];
    const assetUrn = registerResponse.data.value.asset;

    // Upload file
    await uploadMediaToLinkedIn(uploadUrl, filePath, headers);

    return assetUrn;
  }

  async analytics(
    id: string,
    accessToken: string,
    date: number
  ): Promise<AnalyticsData[]> {
    try {
      const startDate = new Date(date);
      const endDate = new Date();

      // Determine if this is organization or personal
      const isOrganization = id.includes('organization');
      
      if (isOrganization) {
        // Fetch organization analytics
        const response = await axios.get(
          `${this.baseUrl}/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${id}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        const stats = response.data.elements || [];
        
        const impressionsData: Array<{ date: string; total: number }> = [];
        const clicksData: Array<{ date: string; total: number }> = [];
        const likesData: Array<{ date: string; total: number }> = [];
        const commentsData: Array<{ date: string; total: number }> = [];
        const sharesData: Array<{ date: string; total: number }> = [];
        const engagementData: Array<{ date: string; total: number }> = [];

        stats.forEach((stat: any) => {
          const date = formatDate(new Date(stat.timeRange.start));
          const total = stat.totalShareStatistics;
          
          impressionsData.push({ date, total: total.impressionCount || 0 });
          clicksData.push({ date, total: total.clickCount || 0 });
          likesData.push({ date, total: total.likeCount || 0 });
          commentsData.push({ date, total: total.commentCount || 0 });
          sharesData.push({ date, total: total.shareCount || 0 });
          
          const engagement = calculateEngagementRate(
            total.likeCount || 0,
            total.commentCount || 0,
            total.shareCount || 0,
            total.impressionCount || 0
          );
          engagementData.push({ date, total: engagement });
        });

        return [
          { label: 'Impressions', data: impressionsData },
          { label: 'Clicks', data: clicksData },
          { label: 'Likes', data: likesData },
          { label: 'Comments', data: commentsData },
          { label: 'Shares', data: sharesData },
          { label: 'Engagement Rate (%)', data: engagementData },
        ];
      } else {
        // Fetch personal UGC analytics
        const response = await axios.get(
          `${this.baseUrl}/socialActions/${id}/statistics`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        // LinkedIn personal analytics are limited
        // Return basic metrics if available
        return [];
      }
    } catch (error: any) {
      console.error('LinkedIn analytics error:', error);
      // Return empty array on error as per requirements
      return [];
    }
  }

  public override handleErrors(body: string, statusCode?: number): 
    | { type: 'refresh-token' | 'bad-body' | 'retry'; value: string }
    | undefined {
    return mapLinkedInError(body, statusCode);
  }
}
