// TikTok Provider Implementation

import axios from 'axios';
import { SocialAbstract } from '../../base/social.abstract';
import { SocialProvider, AuthTokenDetails, PostDetails, PostResponse, AnalyticsData } from '../../base/social.interface';
import { mapTikTokError } from './tiktok.errors';
import {
  TikTokVideoSettings,
  TikTokPrivacyLevel,
  TikTokInitResponse,
  TikTokPublishStatusResponse,
  TikTokUserInfo,
  TikTokTokenResponse,
  TikTokAnalyticsResponse,
} from './tiktok.types';
import {
  validateVideoDuration,
  validateVideoSize,
  validateVideoFormat,
  getFileSize,
  uploadChunkedVideo,
  pollPublishStatus,
  formatTimestamp,
  calculateEngagementRate,
  validateTitle,
} from './tiktok.utils';
import { makeId } from '../../../utils/helpers';

export class TikTokProvider extends SocialAbstract implements SocialProvider {
  identifier = 'tiktok';
  name = 'TikTok';
  scopes = ['user.info.basic', 'video.list', 'video.upload', 'video.publish'];
  override maxConcurrentJob = 3;
  dto = {} as TikTokVideoSettings; // Fix: Create an instance instead of referencing the type
  editor = 'normal' as const;

  private readonly baseUrl = 'https://open.tiktokapis.com';
  private readonly redirectUri = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/integrations/tiktok/callback`;

  maxLength(): number {
    return 2200; // TikTok caption limit
  }

  async generateAuthUrl(): Promise<{
    url: string;
    codeVerifier: string;
    state: string;
  }> {
    const state = makeId(6);
    const csrfState = makeId(10);
    
    const params = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      scope: this.scopes.join(','),
      response_type: 'code',
      redirect_uri: this.redirectUri,
      state,
    });

    return {
      url: `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`,
      codeVerifier: csrfState,
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
      const tokenResponse = await axios.post<TikTokTokenResponse>(
        `${this.baseUrl}/v2/oauth/token/`,
        new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          client_secret: process.env.TIKTOK_CLIENT_SECRET!,
          code: params.code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const tokens = tokenResponse.data;

      if (!tokens.access_token) {
        throw new Error('No access token received from TikTok');
      }

      // Fetch user profile
      const profileResponse = await axios.get<TikTokUserInfo>(
        `${this.baseUrl}/v2/user/info/`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json',
          },
          params: {
            fields: 'open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count',
          },
        }
      );

      const profile = profileResponse.data.data.user;

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in, // 24 hours
        id: profile.open_id,
        name: profile.display_name,
        picture: profile.avatar_url,
        username: profile.display_name,
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
    try {
      // Refresh access token
      const tokenResponse = await axios.post<TikTokTokenResponse>(
        `${this.baseUrl}/v2/oauth/token/`,
        new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          client_secret: process.env.TIKTOK_CLIENT_SECRET!,
          grant_type: 'refresh_token',
          refresh_token,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const tokens = tokenResponse.data;

      if (!tokens.access_token) {
        throw new Error('Failed to refresh access token');
      }

      // Fetch updated user profile
      const profileResponse = await axios.get<TikTokUserInfo>(
        `${this.baseUrl}/v2/user/info/`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json',
          },
          params: {
            fields: 'open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link',
          },
        }
      );

      const profile = profileResponse.data.data.user;

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || refresh_token,
        expiresIn: tokens.expires_in,
        id: profile.open_id,
        name: profile.display_name,
        picture: profile.avatar_url,
        username: profile.display_name,
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

  async post(
    id: string,
    accessToken: string,
    postDetails: PostDetails[],
    integration: any
  ): Promise<PostResponse[]> {
    const postDetail = postDetails[0];
    const settings = postDetail.settings as TikTokVideoSettings;

    // Validate title
    if (!validateTitle(settings.title)) {
      throw new Error('TikTok title must be between 1 and 2200 characters');
    }

    // Validate media
    if (!postDetail.media || postDetail.media.length === 0) {
      throw new Error('TikTok post must have exactly one video attachment');
    }

    if (postDetail.media.length > 1) {
      throw new Error('TikTok post can only have one video attachment');
    }

    const videoPath = postDetail.media[0].path;

    // Validate video format
    if (!validateVideoFormat(videoPath)) {
      throw new Error('Invalid video format. Supported: MP4, MOV, MPEG, AVI, FLV, WebM');
    }

    // Validate video size
    const videoSize = getFileSize(videoPath);
    if (!validateVideoSize(videoSize)) {
      throw new Error('Video size must be between 0 and 4GB');
    }

    // Validate video duration (if available in metadata)
    /*
    if (postDetail.media[0].duration) {
      if (!validateVideoDuration(postDetail.media[0].duration)) {
        throw new Error('Video duration must be between 3 seconds and 10 minutes');
      }
    }
    */

    try {
      // Step 1: Initialize video upload
      const initResponse = await axios.post<TikTokInitResponse>(
        `${this.baseUrl}/v2/post/publish/video/init/`,
        {
          post_info: {
            title: settings.title,
            privacy_level: settings.privacy_level || 'PUBLIC_TO_EVERYONE',
            disable_comment: settings.disable_comment || false,
            disable_duet: settings.disable_duet || false,
            disable_stitch: settings.disable_stitch || false,
            video_cover_timestamp_ms: settings.video_cover_timestamp_ms || 1000,
          },
          source_info: {
            source: 'FILE_UPLOAD',
            video_size: videoSize,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (initResponse.data.error) {
        throw new Error(initResponse.data.error.message);
      }

      const { publish_id, upload_url } = initResponse.data.data;

      // Step 2: Upload video in chunks
      await uploadChunkedVideo(upload_url, videoPath, (progress) => {
        console.log(`Upload progress: ${progress.toFixed(2)}%`);
      });

      // Step 3: Poll for publish status
      const publishResult = await pollPublishStatus(accessToken, publish_id);

      if (publishResult.status === 'FAILED') {
        throw new Error(`Video publishing failed: ${publishResult.failReason}`);
      }

      if (!publishResult.videoId) {
        throw new Error('No video ID returned from TikTok');
      }

      return [{
        id: postDetail.id,
        postId: publishResult.videoId,
        releaseURL: publishResult.shareUrl || `https://www.tiktok.com/@${id}/video/${publishResult.videoId}`,
        status: 'success',
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

  async analytics(
    id: string,
    accessToken: string,
    date: number
  ): Promise<AnalyticsData[]> {
    try {
      const startDate = new Date(date);
      const endDate = new Date();
      
      // Fetch video analytics using Research API
      const response = await axios.post<TikTokAnalyticsResponse>(
        `${this.baseUrl}/v2/research/video/query/`,
        {
          query: {
            and: [
              {
                field_name: 'create_date',
                operation: 'GTE',
                field_values: [formatTimestamp(startDate).toString()],
              },
              {
                field_name: 'create_date',
                operation: 'LTE',
                field_values: [formatTimestamp(endDate).toString()],
              },
            ],
          },
          max_count: 100,
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.error) {
        console.error('TikTok analytics error:', response.data.error);
        return [];
      }

      const videos = response.data.data.videos || [];

      // Aggregate data by day
      const viewsData: Array<{ date: string; total: number }> = [];
      const likesData: Array<{ date: string; total: number }> = [];
      const commentsData: Array<{ date: string; total: number }> = [];
      const sharesData: Array<{ date: string; total: number }> = [];
      const engagementData: Array<{ date: string; total: number }> = [];

      videos.forEach((video) => {
        const date = new Date(video.create_time * 1000).toISOString().split('T')[0];
        const engagement = calculateEngagementRate(
          video.likes,
          video.comments,
          video.shares,
          video.video_views
        );

        viewsData.push({ date, total: video.video_views });
        likesData.push({ date, total: video.likes });
        commentsData.push({ date, total: video.comments });
        sharesData.push({ date, total: video.shares });
        engagementData.push({ date, total: engagement });
      });

      return [
        { label: 'Views', data: viewsData },
        { label: 'Likes', data: likesData },
        { label: 'Comments', data: commentsData },
        { label: 'Shares', data: sharesData },
        { label: 'Engagement Rate (%)', data: engagementData },
      ];
    } catch (error: any) {
      console.error('TikTok analytics error:', error);
      // Return empty array on error as per requirements
      return [];
    }
  }

  public override handleErrors(body: string): 
    | { type: 'refresh-token' | 'bad-body' | 'retry'; value: string }
    | undefined {
    return mapTikTokError(body);
  }
}
