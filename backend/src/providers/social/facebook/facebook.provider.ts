// Facebook Page Provider Implementation

import axios from 'axios';
import { SocialAbstract } from '../../base/social.abstract';
import { SocialProvider, AuthTokenDetails, PostDetails, PostResponse, AnalyticsData } from '../../base/social.interface';
import { mapFacebookError } from './facebook.errors';
import {
  FacebookPageSettings,
  FacebookPage,
  FacebookPagesResponse,
  FacebookPostResponse,
  FacebookOAuthTokenResponse,
  FacebookUserProfile,
} from './facebook.types';
import {
  validateContentLength,
  getFileSize,
  validateVideoSize,
  validateImageSize,
  getMediaType,
  uploadVideoResumable,
  pollVideoStatus,
  formatDate,
  calculateEngagementRate,
  wait,
  calculateBackoffDelay,
} from './facebook.utils';
import { makeId } from '../../../utils/helpers';

export class FacebookProvider extends SocialAbstract implements SocialProvider {
  identifier = 'facebook';
  name = 'Facebook Page';
  scopes = ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'pages_manage_metadata'];
  override maxConcurrentJob = 10;
  dto = {} as FacebookPageSettings; // Fix: Create an instance instead of referencing the type
  editor = 'normal' as const;

  private readonly baseUrl = 'https://graph.facebook.com/v20.0';
  private readonly redirectUri = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/integrations/facebook/callback`;

  maxLength(): number {
    return 63206; // Facebook post limit
  }

  async generateAuthUrl(): Promise<{
    url: string;
    codeVerifier: string;
    state: string;
  }> {
    const state = makeId(6);
    
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID!,
      redirect_uri: this.redirectUri,
      state,
      scope: this.scopes.join(','),
    });

    return {
      url: `https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`,
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
      // Exchange code for user access token
      const tokenResponse = await axios.get<FacebookOAuthTokenResponse>(
        `${this.baseUrl}/oauth/access_token`,
        {
          params: {
            client_id: process.env.FACEBOOK_APP_ID!,
            client_secret: process.env.FACEBOOK_APP_SECRET!,
            redirect_uri: this.redirectUri,
            code: params.code,
          },
        }
      );

      const userAccessToken = tokenResponse.data.access_token;

      // Get user profile
      const profileResponse = await axios.get<FacebookUserProfile>(
        `${this.baseUrl}/me`,
        {
          params: {
            access_token: userAccessToken,
            fields: 'id,name,email,picture',
          },
        }
      );

      const profile = profileResponse.data;

      // Get user's pages
      const pagesResponse = await axios.get<FacebookPagesResponse>(
        `${this.baseUrl}/me/accounts`,
        {
          params: {
            access_token: userAccessToken,
            fields: 'id,name,access_token,category,picture',
          },
        }
      );

      const pages = pagesResponse.data.data;

      if (!pages || pages.length === 0) {
        throw new Error('No Facebook Pages found. Please create a Facebook Page first.');
      }

      // Return first page (or let user select in UI)
      const selectedPage = pages[0];

      return {
        accessToken: selectedPage.access_token,
        refreshToken: '', // Facebook page tokens don't expire
        expiresIn: 0, // Never expires
        id: selectedPage.id,
        name: selectedPage.name,
        picture: selectedPage.picture?.data?.url || '',
        username: selectedPage.name,
        // Store all pages for later selection in a different way if needed
      };
    } catch (error: any) {
      const errorBody = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      const mappedError = this.handleErrors(errorBody);
      
      if (mappedError) {
        throw new Error(mappedError.value);
      }
      
      throw error;
    }
  }

  async refreshToken(refresh_token: string): Promise<AuthTokenDetails> {
    // Facebook page tokens don't expire, but we can re-fetch if needed
    throw new Error('Facebook page tokens do not require refresh');
  }

  async post(
    id: string,
    accessToken: string,
    postDetails: PostDetails[],
    integration: any
  ): Promise<PostResponse[]> {
    const postDetail = postDetails[0];
    const settings = postDetail.settings as FacebookPageSettings;

    // Validate content length
    if (!validateContentLength(settings.message)) {
      throw new Error('Facebook post content must be between 1 and 63,206 characters');
    }

    try {
      let postId: string;

      // Handle different post types
      if (postDetail.media && postDetail.media.length > 0) {
        const mediaType = getMediaType(postDetail.media[0].path);

        if (mediaType === 'video') {
          // Video post
          postId = await this.postVideo(id, accessToken, postDetail, settings);
        } else if (postDetail.media.length === 1) {
          // Single photo post
          postId = await this.postPhoto(id, accessToken, postDetail, settings);
        } else {
          // Multiple photos post
          postId = await this.postMultiplePhotos(id, accessToken, postDetail, settings);
        }
      } else if (settings.link) {
        // Link post
        postId = await this.postLink(id, accessToken, settings);
      } else {
        // Text-only post
        postId = await this.postText(id, accessToken, settings);
      }

      return [{
        id: postDetail.id,
        postId,
        releaseURL: `https://www.facebook.com/${postId}`,
        status: 'success', // Fix: Use allowed status value instead of 'published'
      }];
    } catch (error: any) {
      const errorBody = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      const mappedError = this.handleErrors(errorBody);
      
      if (mappedError) {
        throw new Error(mappedError.value);
      }
      
      throw error;
    }
  }

  private async postText(
    pageId: string,
    accessToken: string,
    settings: FacebookPageSettings
  ): Promise<string> {
    const response = await axios.post<FacebookPostResponse>(
      `${this.baseUrl}/${pageId}/feed`,
      {
        message: settings.message,
        published: settings.published !== false,
      },
      {
        params: {
          access_token: accessToken,
        },
      }
    );

    return response.data.id;
  }

  private async postLink(
    pageId: string,
    accessToken: string,
    settings: FacebookPageSettings
  ): Promise<string> {
    const response = await axios.post<FacebookPostResponse>(
      `${this.baseUrl}/${pageId}/feed`,
      {
        message: settings.message,
        link: settings.link,
        published: settings.published !== false,
      },
      {
        params: {
          access_token: accessToken,
        },
      }
    );

    return response.data.id;
  }

  private async postPhoto(
    pageId: string,
    accessToken: string,
    postDetail: PostDetails,
    settings: FacebookPageSettings
  ): Promise<string> {
    const response = await axios.post<FacebookPostResponse>(
      `${this.baseUrl}/${pageId}/photos`,
      {
        message: settings.message,
        url: postDetail.media![0].path,
        published: settings.published !== false,
      },
      {
        params: {
          access_token: accessToken,
        },
      }
    );

    return response.data.post_id || response.data.id;
  }

  private async postMultiplePhotos(
    pageId: string,
    accessToken: string,
    postDetail: PostDetails,
    settings: FacebookPageSettings
  ): Promise<string> {
    // Upload photos first
    const photoIds: string[] = [];
    
    for (const media of postDetail.media!) {
      const response = await axios.post(
        `${this.baseUrl}/${pageId}/photos`,
        {
          url: media.path,
          published: false,
        },
        {
          params: {
            access_token: accessToken,
          },
        }
      );
      
      photoIds.push(response.data.id);
    }

    // Create album post with photos
    const response = await axios.post<FacebookPostResponse>(
      `${this.baseUrl}/${pageId}/feed`,
      {
        message: settings.message,
        attached_media: photoIds.map(id => ({ media_fbid: id })),
        published: settings.published !== false,
      },
      {
        params: {
          access_token: accessToken,
        },
      }
    );

    return response.data.id;
  }

  private async postVideo(
    pageId: string,
    accessToken: string,
    postDetail: PostDetails,
    settings: FacebookPageSettings
  ): Promise<string> {
    const videoPath = postDetail.media![0].path;
    const fileSize = getFileSize(videoPath);

    if (!validateVideoSize(fileSize)) {
      throw new Error('Video size must not exceed 10GB');
    }

    // Upload video with resumable upload
    const videoId = await uploadVideoResumable(pageId, accessToken, videoPath, (progress) => {
      console.log(`Video upload progress: ${progress.toFixed(2)}%`);
    });

    // Poll for video processing
    await pollVideoStatus(videoId, accessToken);

    // Update video with description
    await axios.post(
      `${this.baseUrl}/${videoId}`,
      {
        description: settings.message,
      },
      {
        params: {
          access_token: accessToken,
        },
      }
    );

    return videoId;
  }

  async analytics(
    id: string,
    accessToken: string,
    date: number
  ): Promise<AnalyticsData[]> {
    try {
      const startDate = new Date(date);
      const endDate = new Date();
      const since = Math.floor(startDate.getTime() / 1000);
      const until = Math.floor(endDate.getTime() / 1000);

      // Fetch page insights
      const response = await axios.get(
        `${this.baseUrl}/${id}/insights`,
        {
          params: {
            access_token: accessToken,
            metric: 'page_impressions,page_engaged_users,page_post_engagements,page_fans',
            period: 'day',
            since,
            until,
          },
        }
      );

      const insights = response.data.data || [];
      
      const impressionsData: Array<{ date: string; total: number }> = [];
      const engagedUsersData: Array<{ date: string; total: number }> = [];
      const engagementsData: Array<{ date: string; total: number }> = [];
      const fansData: Array<{ date: string; total: number }> = [];

      insights.forEach((insight: any) => {
        insight.values.forEach((value: any) => {
          const date = formatDate(new Date(value.end_time));
          
          if (insight.name === 'page_impressions') {
            impressionsData.push({ date, total: value.value });
          } else if (insight.name === 'page_engaged_users') {
            engagedUsersData.push({ date, total: value.value });
          } else if (insight.name === 'page_post_engagements') {
            engagementsData.push({ date, total: value.value });
          } else if (insight.name === 'page_fans') {
            fansData.push({ date, total: value.value });
          }
        });
      });

      return [
        { label: 'Impressions', data: impressionsData },
        { label: 'Engaged Users', data: engagedUsersData },
        { label: 'Post Engagements', data: engagementsData },
        { label: 'Page Fans', data: fansData },
      ];
    } catch (error: any) {
      console.error('Facebook analytics error:', error);
      return [];
    }
  }

  public override handleErrors(body: string): 
    | { type: 'refresh-token' | 'bad-body' | 'retry'; value: string }
    | undefined {
    return mapFacebookError(body);
  }
}
