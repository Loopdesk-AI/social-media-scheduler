import { SocialAbstract } from '../base/social.abstract';
import {
  SocialProvider,
  AuthTokenDetails,
  PostDetails,
  PostResponse,
  AnalyticsData,
} from '../base/social.interface';
import { makeId, timer } from '../../utils/helpers';
// import { Integration } from '@prisma/client'; // Will be available after Prisma generation
type Integration = any; // Temporary type
import dayjs from 'dayjs';

/**
 * Instagram provider using Instagram Graph API (July 2024 Update)
 * 
 * Important Update (July 2024): Instagram API no longer requires Facebook Page
 * Users can connect directly with Instagram Business/Creator accounts
 * 
 * Required account type: Instagram Business or Creator account
 * No Facebook Page linking required
 * 
 * Host: graph.instagram.com (not graph.facebook.com)
 */
export class InstagramProvider extends SocialAbstract implements SocialProvider {
  identifier = 'instagram';
  name = 'Instagram\n(Business/Creator)';
  scopes = [
    'instagram_basic',
    'instagram_business_basic', // Added for business accounts
    'instagram_content_publish',
    'pages_show_list',
    'pages_read_engagement',
  ];
  override maxConcurrentJob = 10;
  editor = 'normal' as const;

  maxLength() {
    return 2200;
  }

  /**
   * Handle Instagram-specific errors
   */
  public override handleErrors(body: string):
    | { type: 'refresh-token' | 'bad-body' | 'retry'; value: string }
    | undefined {
    // Retry on unknown errors
    if (body.indexOf('An unknown error occurred') > -1) {
      return {
        type: 'retry' as const,
        value: 'An unknown error occurred, please try again later',
      };
    }

    // Token errors
    if (body.indexOf('REVOKED_ACCESS_TOKEN') > -1) {
      return {
        type: 'refresh-token' as const,
        value: 'Please re-authenticate your Instagram account',
      };
    }

    if (body.toLowerCase().indexOf('the user is not an instagram business') > -1) {
      return {
        type: 'refresh-token' as const,
        value: 'Your Instagram account must be a business account',
      };
    }

    if (body.toLowerCase().indexOf('session has been invalidated') > -1) {
      return {
        type: 'refresh-token' as const,
        value: 'Please re-authenticate your Instagram account',
      };
    }

    // API access blocked
    if (body.indexOf('API access blocked') > -1) {
      return {
        type: 'refresh-token' as const,
        value: 'Instagram API access blocked. Please re-authenticate your account and ensure it\'s a Business/Creator account.',
      };
    }

    // Daily limit
    if (body.indexOf('2207042') > -1) {
      return {
        type: 'bad-body' as const,
        value: 'You have reached the maximum of 25 posts per day',
      };
    }

    // Media errors
    if (body.indexOf('2207003') > -1) {
      return { type: 'bad-body' as const, value: 'Timeout downloading media' };
    }

    if (body.indexOf('2207009') > -1) {
      return {
        type: 'bad-body' as const,
        value: 'Aspect ratio must be between 4:5 to 1.91:1',
      };
    }

    if (body.indexOf('36001') > -1) {
      return {
        type: 'bad-body' as const,
        value: 'Invalid Instagram image resolution max: 1920x1080px',
      };
    }

    if (body.indexOf('2207001') > -1) {
      return {
        type: 'bad-body' as const,
        value: 'Instagram detected spam, try different content',
      };
    }

    if (body.indexOf('Page request limit reached') > -1) {
      return {
        type: 'bad-body' as const,
        value: 'Page posting limit reached, try again tomorrow',
      };
    }

    return undefined;
  }

  /**
   * Generate Instagram OAuth URL (no Facebook Page required)
   */
  async generateAuthUrl() {
    const state = makeId(6);
    const redirectUri = `${process.env.FRONTEND_URL}/integrations/social/instagram`;

    return {
      url:
        'https://www.facebook.com/v20.0/dialog/oauth' + // Use Facebook OAuth dialog
        `?client_id=${process.env.FACEBOOK_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${state}` +
        `&scope=${encodeURIComponent(this.scopes.join(','))}` +
        `&response_type=code`,
      codeVerifier: makeId(10),
      state,
    };
  }

  /**
   * Exchange authorization code for tokens (new Instagram API - no Facebook Page required)
   */
  async authenticate(params: {
    code: string;
    codeVerifier: string;
    refresh?: string;
  }) {
    const redirectUri = `${process.env.FRONTEND_URL}/integrations/social/instagram${params.refresh ? `?refresh=${params.refresh}` : ''
      }`;

    // Step 1: Exchange code for short-lived token
    const tokenResponse = await fetch(
      'https://graph.instagram.com/oauth/access_token' + // Fix: Use Instagram Graph API
      `?client_id=${process.env.FACEBOOK_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${process.env.FACEBOOK_APP_SECRET}` +
      `&code=${params.code}`
    );
    const tokenData: any = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('Failed to get access token from Instagram');
    }

    // Step 2: Exchange for long-lived token (60 days)
    const longLivedResponse = await fetch(
      'https://graph.instagram.com/access_token' + // Fix: Use Instagram Graph API
      '?grant_type=ig_exchange_token' +
      `&client_secret=${process.env.FACEBOOK_APP_SECRET}` +
      `&access_token=${tokenData.access_token}`
    );
    const longLivedData: any = await longLivedResponse.json();

    const access_token = longLivedData.access_token;

    // Step 3: Verify permissions
    const permissionsResponse = await fetch(
      `https://graph.instagram.com/v20.0/me/permissions?access_token=${access_token}` // Fix: Use Instagram Graph API
    );
    const permissionsData: any = await permissionsResponse.json();

    const permissions = permissionsData.data
      .filter((d: any) => d.status === 'granted')
      .map((p: any) => p.permission);

    this.checkScopes(this.scopes, permissions);

    // Step 4: Get user info directly from Instagram (no Facebook Page required)
    const userResponse = await fetch(
      `https://graph.instagram.com/v20.0/me?fields=id,username,account_type,media_count,profile_picture_url&access_token=${access_token}` // Fix: Use Instagram Graph API
    );
    const userData: any = await userResponse.json();

    return {
      id: userData.id,
      name: userData.username || `Instagram User ${userData.id}`,
      accessToken: access_token,
      refreshToken: access_token, // Instagram uses same token
      expiresIn: dayjs().add(59, 'days').unix() - dayjs().unix(),
      picture: userData.profile_picture_url || '',
      username: userData.username || '',
    };
  }

  /**
   * Refresh token (Instagram long-lived tokens don't need refresh)
   */
  async refreshToken(refresh_token: string): Promise<AuthTokenDetails> {
    // Instagram long-lived tokens last 60 days, so we just return the same token
    // In a real implementation, you might want to exchange for a new token
    return {
      refreshToken: refresh_token,
      expiresIn: dayjs().add(59, 'days').unix() - dayjs().unix(),
      accessToken: refresh_token,
      id: '',
      name: '',
      picture: '',
      username: '',
    };
  }

  /**
   * Get Instagram account information (new API - no Facebook Pages)
   */
  async getInstagramAccount(accessToken: string) {
    const response = await fetch(
      `https://graph.instagram.com/v20.0/me?fields=id,username,account_type,media_count,profile_picture_url&access_token=${accessToken}` // Fix: Use Instagram Graph API
    );
    const data: any = await response.json();

    if (!data.id) {
      return [];
    }

    // Return the Instagram account directly (no Facebook Page selection needed)
    return [{
      id: data.id,
      name: data.username || `Instagram User ${data.id}`,
      username: data.username || '',
      picture: data.profile_picture_url || '',
      accountType: data.account_type || 'Business',
    }];
  }

  /**
   * Get Instagram account information using a direct token
   */
  async getAccountInfoWithToken(accessToken: string) {
    try {
      // Get user info directly from Instagram
      const userResponse = await fetch(
        `https://graph.instagram.com/v20.0/me?fields=id,username,account_type,media_count,profile_picture_url&access_token=${accessToken}`
      );
      const userData: any = await userResponse.json();

      if (!userData.id) {
        throw new Error('Invalid token or unable to fetch user data');
      }

      return {
        id: userData.id,
        name: userData.username || `Instagram User ${userData.id}`,
        accessToken: accessToken,
        refreshToken: accessToken, // Instagram uses same token
        expiresIn: dayjs().add(60, 'days').unix() - dayjs().unix(), // Assume 60 days
        picture: userData.profile_picture_url || '',
        username: userData.username || '',
      };
    } catch (error) {
      console.error('Error fetching Instagram account info with token:', error);
      throw new Error('Failed to fetch Instagram account information');
    }
  }

  /**
   * Publish post to Instagram
   */
  async post(
    id: string,
    accessToken: string,
    postDetails: PostDetails[],
    integration: Integration
  ): Promise<PostResponse[]> {
    const [firstPost, ...theRest] = postDetails;
    const results: PostResponse[] = [];

    console.log(`Publishing to Instagram account: ${id}`);
    console.log(`Post details:`, JSON.stringify(firstPost, null, 2));

    // Check if it's a story
    const settings = firstPost.settings || {};
    const isStory = settings.post_type === 'story';

    // Upload media containers
    const mediaIds = await Promise.all(
      (firstPost.media || []).map(async (m) => {
        const caption =
          firstPost.media?.length === 1
            ? `&caption=${encodeURIComponent(firstPost.message)}`
            : '';
        const isCarousel = (firstPost.media?.length || 0) > 1 ? '&is_carousel_item=true' : '';

        // Use the media URL directly - it should be a publicly accessible URL
        let mediaUrl = m.path;

        // Only construct full URL if it's NOT already a URL
        if (!mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://')) {
          const baseUrl = process.env.STORAGE_LOCAL_URL || 'http://localhost:3001';

          // Check if it's a full file path (starts with / or contains /uploads/)
          if (mediaUrl.startsWith('/') || mediaUrl.includes('/uploads/')) {
            // Extract just the filename from the full path
            const filename = mediaUrl.split('/').pop();
            mediaUrl = `${baseUrl}/uploads/${filename}`;
          } else {
            // It's just a filename, use it directly
            mediaUrl = `${baseUrl}/uploads/${mediaUrl}`;
          }
        }

        // Determine media type based on URL extension or type field
        const isVideo = m.type === 'video' ||
          mediaUrl.match(/\.(mp4|mov|avi|wmv|flv|webm)$/i);

        const mediaType = isVideo
          ? isStory
            ? `video_url=${encodeURIComponent(mediaUrl)}&media_type=STORIES`
            : firstPost.media?.length === 1
              ? `video_url=${encodeURIComponent(mediaUrl)}&media_type=REELS&thumb_offset=${m.thumbnailTimestamp || 0}`
              : `video_url=${encodeURIComponent(mediaUrl)}&media_type=VIDEO&thumb_offset=${m.thumbnailTimestamp || 0}`
          : isStory
            ? `image_url=${encodeURIComponent(mediaUrl)}&media_type=STORIES`
            : `image_url=${encodeURIComponent(mediaUrl)}`;

        console.log(`📸 Creating Instagram media container`);
        console.log(`   URL: ${mediaUrl}`);
        console.log(`   Type: ${isVideo ? 'video' : 'image'}`);
        console.log(`   Carousel: ${isCarousel ? 'yes' : 'no'}`);

        // Create media container
        const containerResponse = await fetch(
          `https://graph.instagram.com/v20.0/${id}/media?${mediaType}${isCarousel}&access_token=${accessToken}${caption}`,
          { method: 'POST' }
        );
        const containerData: any = await containerResponse.json();

        // Check for errors
        if (containerData.error) {
          console.error(`❌ Instagram API error:`, containerData.error);
          throw new Error(`Instagram API error: ${containerData.error.message || JSON.stringify(containerData.error)}`);
        }

        console.log(`✅ Container created: ${containerData.id}`);

        // Poll container status
        let status = 'IN_PROGRESS';
        let attempts = 0;
        const maxAttempts = 20;

        while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
          await timer(30000); // Wait 30 seconds

          const statusResponse = await fetch(
            `https://graph.instagram.com/v20.0/${containerData.id}?access_token=${accessToken}&fields=status_code`
          );
          const statusData: any = await statusResponse.json();

          status = statusData.status_code;
          attempts++;

          console.log(`⏳ Container status: ${status} (attempt ${attempts}/${maxAttempts})`);
        }

        if (status !== 'FINISHED') {
          throw new Error(`Media processing failed with status: ${status} after ${attempts} attempts`);
        }

        return containerData.id;
      })
    );

    console.log(`Media IDs:`, mediaIds);

    // Publish post
    let publishedId: string;
    let permalink: string;

    if (mediaIds.length === 0) {
      // No media - cannot publish to Instagram
      throw new Error('Instagram requires media to be attached to posts. Please provide a media URL.');
    } else if (mediaIds.length === 1) {
      // Single media post
      console.log(`Publishing single media post with creation ID: ${mediaIds[0]}`);
      const publishResponse = await fetch(
        `https://graph.instagram.com/v20.0/${id}/media_publish?creation_id=${mediaIds[0]}&access_token=${accessToken}`,
        { method: 'POST' }
      );
      const publishData: any = await publishResponse.json();
      console.log(`Publish response:`, JSON.stringify(publishData, null, 2));
      publishedId = publishData.id;

      // Get permalink
      const permalinkResponse = await fetch(
        `https://graph.instagram.com/v20.0/${publishedId}?fields=permalink&access_token=${accessToken}`
      );
      const permalinkData: any = await permalinkResponse.json();
      permalink = permalinkData.permalink;
    } else {
      // Carousel post
      console.log(`Publishing carousel post with children:`, mediaIds);
      const carouselResponse = await fetch(
        `https://graph.instagram.com/v20.0/${id}/media?caption=${encodeURIComponent(
          firstPost.message
        )}&media_type=CAROUSEL&children=${encodeURIComponent(
          mediaIds.join(',')
        )}&access_token=${accessToken}`,
        { method: 'POST' }
      );
      const carouselData: any = await carouselResponse.json();
      console.log(`Carousel response:`, JSON.stringify(carouselData, null, 2));

      // Check if the response contains an error
      if (carouselData.error) {
        throw new Error(`Instagram API error: ${carouselData.error.message || JSON.stringify(carouselData.error)}`);
      }

      // Poll carousel status
      let status = 'IN_PROGRESS';
      let attempts = 0;
      while (status === 'IN_PROGRESS' && attempts < 20) {
        await timer(30000);
        const statusResponse = await fetch(
          `https://graph.instagram.com/v20.0/${carouselData.id}?fields=status_code&access_token=${accessToken}`
        );
        const statusData: any = await statusResponse.json();
        status = statusData.status_code;
        attempts++;
      }

      if (status !== 'FINISHED') {
        throw new Error(`Carousel processing failed with status: ${status}`);
      }

      // Publish carousel
      const publishResponse = await fetch(
        `https://graph.instagram.com/v20.0/${id}/media_publish?creation_id=${carouselData.id}&access_token=${accessToken}`,
        { method: 'POST' }
      );
      const publishData: any = await publishResponse.json();
      publishedId = publishData.id;

      // Get permalink
      const permalinkResponse = await fetch(
        `https://graph.instagram.com/v20.0/${publishedId}?fields=permalink&access_token=${accessToken}`
      );
      const permalinkData: any = await permalinkResponse.json();
      permalink = permalinkData.permalink;
    }

    results.push({
      id: firstPost.id,
      postId: publishedId,
      releaseURL: permalink,
      status: 'success',
    });

    // Handle comments for multi-post groups
    for (const post of theRest) {
      const commentResponse = await fetch(
        `https://graph.instagram.com/v20.0/${publishedId}/comments?message=${encodeURIComponent(
          post.message
        )}&access_token=${accessToken}`,
        { method: 'POST' }
      );
      const commentData: any = await commentResponse.json();

      results.push({
        id: post.id,
        postId: commentData.id,
        releaseURL: permalink,
        status: 'success',
      });
    }

    return results;
  }

  /**
   * Fetch Instagram analytics
   */
  async analytics(
    id: string,
    accessToken: string,
    days: number // Changed from date to days
  ): Promise<AnalyticsData[]> {
    try {
      // Instagram API expects dates in YYYY-MM-DD format
      const untilDate = dayjs().format('YYYY-MM-DD');
      const sinceDate = dayjs().subtract(days, 'day').format('YYYY-MM-DD');

      // Use only valid metrics according to Instagram API
      const response = await fetch(
        `https://graph.instagram.com/v20.0/${id}/insights?metric=follower_count,reach,profile_views&access_token=${accessToken}&period=day&since=${sinceDate}&until=${untilDate}`
      );
      const data: any = await response.json();

      // Check if we got an error response
      if (data.error) {
        console.error('Instagram API error:', data.error);

        // Handle API access blocked error
        if (data.error.code === 200 && data.error.message === 'API access blocked.') {
          console.warn('Instagram API access is blocked. This could be due to:');
          console.warn('1. Invalid or expired access token');
          console.warn('2. Instagram account not set up as business/creator account');
          console.warn('3. Issues with Facebook app configuration');
          console.warn('4. Rate limiting or temporary blocking');
          // Return empty array but don't fail completely
          return [];
        }

        // Handle date format errors
        if (data.error.code === 100 && data.error.message === 'Param since is an invalid datetime.') {
          console.warn('Instagram API date format error. Using alternative date format.');
          // Try with a simpler approach without date parameters
          const simpleResponse = await fetch(
            `https://graph.instagram.com/v20.0/${id}/insights?metric=follower_count,reach,profile_views&access_token=${accessToken}&period=day`
          );
          const simpleData: any = await simpleResponse.json();

          if (simpleData.error) {
            return [];
          }

          const analytics: AnalyticsData[] = [];
          if (simpleData.data) {
            for (const metric of simpleData.data) {
              analytics.push({
                label: this.formatMetricLabel(metric.name),
                data: metric.values.map((v: any) => ({
                  total: v.value,
                  date: dayjs(v.end_time).format('YYYY-MM-DD'),
                })),
              });
            }
          }
          return analytics;
        }

        // Return empty array on other errors
        return [];
      }

      const analytics: AnalyticsData[] = [];

      if (data.data) {
        for (const metric of data.data) {
          analytics.push({
            label: this.formatMetricLabel(metric.name),
            data: metric.values.map((v: any) => ({
              total: v.value,
              date: dayjs(v.end_time).format('YYYY-MM-DD'),
            })),
          });
        }
      }

      return analytics;
    } catch (error) {
      console.error('Failed to fetch Instagram analytics:', error);
      return [];
    }
  }

  private formatMetricLabel(name: string): string {
    const labels: Record<string, string> = {
      likes: 'Likes',
      followers: 'Followers',
      reach: 'Reach',
      follower_count: 'Follower Count',
      views: 'Views',
      comments: 'Comments',
      shares: 'Shares',
      saves: 'Saves',
      replies: 'Replies',
      profile_views: 'Profile Views',
    };
    return labels[name] || name;
  }
}
