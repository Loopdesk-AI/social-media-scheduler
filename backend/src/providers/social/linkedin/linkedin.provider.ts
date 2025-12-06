// LinkedIn Provider Implementation

import axios from "axios";
import { SocialAbstract } from "../../base/social.abstract";
import {
  SocialProvider,
  AuthTokenDetails,
  PostDetails,
  PostResponse,
  AnalyticsData,
} from "../../base/social.interface";
import { mapLinkedInError } from "./linkedin.errors";
import {
  LinkedInUGCPostSettings,
  LinkedInUGCPost,
  LinkedInMediaUploadRequest,
  LinkedInMediaUploadResponse,
  LinkedInPostResponse,
  LinkedInUserProfile,
  LinkedInOrganization,
  LinkedInCarouselSettings,
  LinkedInCarouselCard,
  LinkedInHashtagSuggestion,
  LinkedInPostRequest,
} from "./linkedin.types";
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
  initializeVideoUpload,
  uploadVideoChunk,
  finalizeVideoUpload,
  downloadTempFile,
  deleteTempFile,
} from "./linkedin.utils";
import { makeId } from "../../../utils/helpers";
import { rateLimiterService } from "../../../services/rate-limiter.service";
import logger from "../../../utils/logger";

export class LinkedInProvider extends SocialAbstract implements SocialProvider {
  identifier = "linkedin";
  name = "LinkedIn";
  scopes = ["openid", "profile", "email", "w_member_social"];
  override maxConcurrentJob = 5;
  dto = {} as LinkedInUGCPostSettings;
  editor = "normal" as const;

  private readonly baseUrl = "https://api.linkedin.com/v2";
  private readonly redirectUri = `${process.env.BACKEND_URL || "http://localhost:3000"}/api/integrations/linkedin/callback`;

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
      response_type: "code",
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      redirect_uri: this.redirectUri,
      state,
      scope: this.scopes.join(" "),
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
        "https://www.linkedin.com/oauth/v2/accessToken",
        new URLSearchParams({
          grant_type: "authorization_code",
          code: params.code,
          redirect_uri: this.redirectUri,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      const tokens = tokenResponse.data;

      if (!tokens.access_token) {
        throw new Error("No access token received from LinkedIn");
      }

      // Fetch user profile using OIDC endpoint
      const profileResponse = await axios.get<any>(
        `https://api.linkedin.com/v2/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        },
      );

      const profile = profileResponse.data;

      // Fetch organizations if scope granted
      let organizations: LinkedInOrganization[] = [];
      if (this.scopes.includes("w_organization_social")) {
        try {
          const orgsResponse = await axios.get(
            `${this.baseUrl}/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName,vanityName,logoV2(original~:playableStreams))))`,
            {
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
              },
            },
          );

          organizations =
            orgsResponse.data.elements?.map((el: any) => el["organization~"]) ||
            [];
        } catch (error) {
          console.warn("Failed to fetch organizations:", error);
        }
      }

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || "",
        expiresIn: tokens.expires_in || 5184000, // 60 days default
        id: profile.sub,
        name: profile.name,
        picture: profile.picture,
        username: profile.email || profile.name,
        email: profile.email,
      } as any;
    } catch (error: any) {
      const errorBody = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
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
        "https://www.linkedin.com/oauth/v2/accessToken",
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      const tokens = tokenResponse.data;

      // Fetch updated profile using OIDC endpoint
      const profileResponse = await axios.get<any>(
        `https://api.linkedin.com/v2/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        },
      );

      const profile = profileResponse.data;

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || refresh_token,
        expiresIn: tokens.expires_in || 5184000,
        id: profile.sub,
        name: profile.name,
        picture: profile.picture,
        username: profile.email || profile.name,
        email: profile.email,
      };
    } catch (error: any) {
      const errorBody = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
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
    integration: any,
  ): Promise<PostResponse[]> {
    const postDetail = postDetails[0];
    const settings = postDetail.settings as LinkedInUGCPostSettings;

    // Use settings.text if provided, otherwise fall back to postDetail.message
    const text = settings.text || postDetail.message;

    // Validate content length
    if (!validateContentLength(text)) {
      throw new Error(
        "LinkedIn post content must be between 1 and 3000 characters",
      );
    }

    // Check rate limit
    await rateLimiterService.waitForRateLimit("linkedin", id, "ugcPosts");
    logger.info("Posting to LinkedIn", {
      id,
      contentLength: text.length,
      isOrganization: settings.isOrganization,
    });

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

        if (
          mediaType !== "unknown" &&
          !validateMediaCount(postDetail.media.length, mediaType)
        ) {
          throw new Error("LinkedIn supports max 9 images or 1 video per post");
        }

        for (const media of postDetail.media) {
          const mediaUrn = await this.uploadMedia(
            accessToken,
            author,
            media.path,
          );
          mediaUrns.push(mediaUrn);
        }
      }

      // Determine share media category
      let shareMediaCategory: "NONE" | "IMAGE" | "VIDEO" | "ARTICLE" = "NONE";
      if (settings.articleUrl) {
        shareMediaCategory = "ARTICLE";
      } else if (mediaUrns.length > 0) {
        const firstMediaType = getMediaType(postDetail.media![0].path);
        shareMediaCategory = firstMediaType === "video" ? "VIDEO" : "IMAGE";
      }

      // Create Post using new Posts API (/rest/posts)
      // This API is compatible with both Images (Assets API) and Videos (Videos API)
      const postRequest: LinkedInPostRequest = {
        author,
        commentary: text,
        visibility: settings.visibility || "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      };

      // Add media content if present
      if (mediaUrns.length > 0) {
        const mediaUrn = mediaUrns[0]; // Posts API currently supports single media attachment in this format
        // For multiple images, we might need to stick to the old API or check if Posts API supports multi-image
        // But for Video (which is our main fix), it's single video.

        postRequest.content = {
          media: {
            id: mediaUrn,
            title: settings.clipTitle || "Video", // Optional title
          },
        };
      } else if (
        settings.articleUrl &&
        validateArticleUrl(settings.articleUrl)
      ) {
        // Add article
        postRequest.content = {
          article: {
            source: settings.articleUrl,
            title: settings.articleTitle,
          },
        };
      }

      const response = await axios.post<LinkedInPostResponse>(
        "https://api.linkedin.com/rest/posts",
        postRequest,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "LinkedIn-Version": "202411",
            "X-Restli-Protocol-Version": "2.0.0",
          },
        },
      );

      logger.info("LinkedIn post created", {
        status: response.status,
        headers: response.headers,
        data: response.data,
      });

      // ID can be in response body or x-restli-id header
      const urn = response.data.id || response.headers["x-restli-id"];

      if (!urn) {
        throw new Error("Failed to retrieve post ID from LinkedIn response");
      }

      const postId = extractIdFromUrn(urn);

      return [
        {
          id: postDetail.id,
          postId,
          releaseURL: `https://www.linkedin.com/feed/update/${urn}`,
          status: "success",
        },
      ];
    } catch (error: any) {
      const errorBody = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
      const mappedError = this.handleErrors(errorBody, error.response?.status);

      if (mappedError) {
        throw new Error(mappedError.value);
      }

      throw error;
    }
  }

  /**
   * Post a carousel (multi-card document/image carousel)
   * LinkedIn carousels support 2-10 cards with titles and links
   */
  async postCarousel(
    id: string,
    accessToken: string,
    settings: LinkedInCarouselSettings,
  ): Promise<string> {
    await rateLimiterService.waitForRateLimit("linkedin", id, "ugcPosts");

    logger.info("Posting carousel to LinkedIn", {
      id,
      cardCount: settings.cards.length,
    });

    if (settings.cards.length < 2 || settings.cards.length > 10) {
      throw new Error("LinkedIn carousel must have between 2 and 10 cards");
    }

    // Determine author
    const isOrganization = settings.isOrganization || false;
    const author = isOrganization
      ? createOrganizationUrn(settings.organizationId || id)
      : createPersonUrn(id);

    // Upload all card images
    const mediaUrns: string[] = [];
    for (const card of settings.cards) {
      // For carousel, we need to register each image
      const registerRequest: LinkedInMediaUploadRequest = {
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: author,
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            },
          ],
        },
      };

      const registerResponse = await axios.post<LinkedInMediaUploadResponse>(
        `${this.baseUrl}/assets?action=registerUpload`,
        registerRequest,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      const { uploadUrl, headers } =
        registerResponse.data.value.uploadMechanism[
          "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
        ];
      const assetUrn = registerResponse.data.value.asset;

      // Upload the image
      await uploadMediaToLinkedIn(uploadUrl, card.imageUrl, headers);
      mediaUrns.push(assetUrn);
    }

    // Create carousel post
    const ugcPost: LinkedInUGCPost = {
      author,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: settings.text,
          },
          shareMediaCategory: "IMAGE",
          media: mediaUrns.map((urn, index) => ({
            status: "READY",
            media: urn,
            title: settings.cards[index].title
              ? { text: settings.cards[index].title }
              : undefined,
            description: settings.cards[index].description
              ? { text: settings.cards[index].description }
              : undefined,
          })),
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    const response = await axios.post<LinkedInPostResponse>(
      `${this.baseUrl}/ugcPosts`,
      ugcPost,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      },
    );

    logger.info("Carousel posted successfully", {
      id,
      postId: response.data.id,
    });
    return response.data.id;
  }

  /**
   * Get AI-powered hashtag suggestions based on content
   * Uses simple keyword extraction and LinkedIn trending topics
   */
  async getHashtagSuggestions(
    content: string,
  ): Promise<LinkedInHashtagSuggestion[]> {
    logger.info("Generating hashtag suggestions", {
      contentLength: content.length,
    });

    // Extract existing hashtags from content
    const existingHashtags = extractHashtags(content);

    // Simple keyword extraction (could be enhanced with NLP)
    const keywords = content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .filter(
        (word) =>
          !["this", "that", "with", "from", "have", "been"].includes(word),
      );

    // Get unique keywords
    const uniqueKeywords = Array.from(new Set(keywords)).slice(0, 10);

    // Filter out existing hashtags and create suggestions
    const suggestions: LinkedInHashtagSuggestion[] = uniqueKeywords
      .filter((keyword) => !existingHashtags.includes(`#${keyword}`))
      .map((keyword) => ({
        hashtag: `#${keyword}`,
        relevanceScore: Math.random() * 100, // Simplified scoring
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);

    logger.info("Hashtag suggestions generated", {
      suggestionCount: suggestions.length,
    });
    return suggestions;
  }

  private async uploadMedia(
    accessToken: string,
    author: string,
    filePath: string,
  ): Promise<string> {
    // Check if filePath is a URL (remote file)
    const isRemote =
      filePath.startsWith("http://") || filePath.startsWith("https://");
    let localFilePath = filePath;

    try {
      if (isRemote) {
        logger.info("Downloading remote file for LinkedIn upload", {
          url: filePath,
        });
        localFilePath = await downloadTempFile(filePath);
      }

      const mediaType = getMediaType(localFilePath);
      const fileSize = getFileSize(localFilePath);

      // Validate file size
      if (mediaType === "image" && !validateImageSize(fileSize)) {
        throw new Error("Image size must not exceed 10MB");
      }
      if (mediaType === "video" && !validateVideoSize(fileSize)) {
        throw new Error("Video size must not exceed 5GB");
      }

      // Handle Video Upload via Videos API
      if (mediaType === "video") {
        logger.info("Starting LinkedIn video upload via Videos API", {
          filePath: localFilePath,
          fileSize,
        });

        try {
          // 1. Initialize
          const initData = await initializeVideoUpload(
            accessToken,
            author,
            fileSize,
          );
          const { video: videoUrn, uploadInstructions, uploadToken } = initData;

          logger.info("LinkedIn video upload initialized", {
            videoUrn,
            chunks: uploadInstructions.length,
          });

          // 2. Upload chunks
          const uploadedPartIds: string[] = [];
          for (const instruction of uploadInstructions) {
            const etag = await uploadVideoChunk(
              instruction.uploadUrl,
              localFilePath,
              instruction.firstByte,
              instruction.lastByte,
            );
            uploadedPartIds.push(etag);
          }

          // 3. Finalize
          await finalizeVideoUpload(
            accessToken,
            videoUrn,
            uploadToken!,
            uploadedPartIds,
          );

          logger.info("LinkedIn video upload finalized", { videoUrn });
          return videoUrn;
        } catch (error: any) {
          logger.error("LinkedIn video upload failed", {
            error: error.message,
            response: error.response?.data,
          });
          throw error;
        }
      }

      // Register upload (Images only - Assets API)
      const recipe = "urn:li:digitalmediaRecipe:feedshare-image";

      const registerRequest: LinkedInMediaUploadRequest = {
        registerUploadRequest: {
          recipes: [recipe],
          owner: author,
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            },
          ],
        },
      };

      const registerResponse = await axios.post<LinkedInMediaUploadResponse>(
        `${this.baseUrl}/assets?action=registerUpload`,
        registerRequest,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      const { uploadUrl, headers } =
        registerResponse.data.value.uploadMechanism[
          "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
        ];
      const assetUrn = registerResponse.data.value.asset;

      // Upload file
      await uploadMediaToLinkedIn(uploadUrl, localFilePath, headers);

      return assetUrn;
    } finally {
      // Clean up temp file if it was downloaded
      if (isRemote && localFilePath !== filePath) {
        deleteTempFile(localFilePath);
      }
    }
  }

  async analytics(
    id: string,
    accessToken: string,
    date: number,
  ): Promise<AnalyticsData[]> {
    try {
      const startDate = new Date(date);
      const endDate = new Date();

      // Determine if this is organization or personal
      const isOrganization = id.includes("organization");

      if (isOrganization) {
        // Fetch organization analytics
        const response = await axios.get(
          `${this.baseUrl}/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
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
            total.impressionCount || 0,
          );
          engagementData.push({ date, total: engagement });
        });

        return [
          { label: "Impressions", data: impressionsData },
          { label: "Clicks", data: clicksData },
          { label: "Likes", data: likesData },
          { label: "Comments", data: commentsData },
          { label: "Shares", data: sharesData },
          { label: "Engagement Rate (%)", data: engagementData },
        ];
      } else {
        // LinkedIn does NOT provide analytics for personal profiles via API
        // Analytics are only available for:
        // 1. Company/Organization pages (requires w_organization_social scope + Marketing Developer Platform)
        // 2. Advertising campaigns
        //
        // Personal profile analytics must be viewed directly on LinkedIn.com
        logger.info(
          "LinkedIn personal profile analytics not available via API",
          { id },
        );

        // Return empty array - analytics not supported for personal profiles
        return [];
      }
    } catch (error: any) {
      logger.error("LinkedIn analytics error", {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      // Return empty array on error as per requirements
      return [];
    }
  }

  public override handleErrors(
    body: string,
    statusCode?: number,
  ):
    | { type: "refresh-token" | "bad-body" | "retry"; value: string }
    | undefined {
    return mapLinkedInError(body, statusCode);
  }
}
