// YouTube Provider Implementation

import { google, youtube_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { SocialAbstract } from "../../base/social.abstract";
import {
  SocialProvider,
  AuthTokenDetails,
  PostDetails,
  PostResponse,
  AnalyticsData,
} from "../../base/social.interface";
import { mapYouTubeError } from "./youtube.errors";
import {
  YouTubeVideoSettings,
  YouTubeTokenResponse,
  YouTubeUserProfile,
  YouTubeAnalyticsRow,
} from "./youtube.types";
import {
  downloadVideo,
  createVideoStream,
  validateTitle,
  validateDescription,
  validateTags,
  formatDateRange,
  calculateExpiration,
  isTokenExpired,
} from "./youtube.utils";
import { makeId } from "../../../utils/helpers";

export class YoutubeProvider extends SocialAbstract implements SocialProvider {
  identifier = "youtube";
  name = "YouTube";
  scopes = [
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];
  override maxConcurrentJob = 1; // Strict quota limits
  dto = {} as YouTubeVideoSettings; // Fix: Create an instance instead of referencing the type
  editor = "normal" as const;

  private getOAuth2Client(): OAuth2Client {
    return new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      `${process.env.BACKEND_URL || "http://localhost:3000"}/api/integrations/youtube/callback`,
    );
  }

  maxLength(): number {
    return 5000; // YouTube description limit
  }

  async generateAuthUrl(): Promise<{
    url: string;
    codeVerifier: string;
    state: string;
  }> {
    const client = this.getOAuth2Client();
    const state = makeId(7);

    const url = client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: this.scopes,
      state,
    });

    return {
      url,
      codeVerifier: makeId(11),
      state,
    };
  }

  async authenticate(params: {
    code: string;
    codeVerifier: string;
    refresh?: string;
  }): Promise<AuthTokenDetails> {
    const client = this.getOAuth2Client();

    // Exchange code for tokens
    const { tokens } = await client.getToken(params.code);

    if (!tokens.access_token) {
      throw new Error("No access token received from YouTube");
    }

    // Verify scopes
    if (tokens.scope) {
      const grantedScopes = tokens.scope.split(" ");
      if (!this.checkScopes(this.scopes, grantedScopes)) {
        throw new Error("Required scopes not granted");
      }
    }

    // Set credentials to fetch user profile
    client.setCredentials(tokens);

    // Fetch user profile
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const { data: profile } = await oauth2.userinfo.get();

    // Get YouTube channel info
    const youtube = google.youtube({ version: "v3", auth: client });
    let channelInfo;

    try {
      const { data } = await youtube.channels.list({
        part: ["snippet"],
        mine: true,
      });

      if (!data.items || data.items.length === 0) {
        throw new Error("youtube.signup.required");
      }

      channelInfo = data.items[0];
    } catch (error: any) {
      if (
        error.message?.includes("youtube.signup.required") ||
        error.response?.data?.error?.message?.includes("channel")
      ) {
        throw new Error("youtubeSignupRequired");
      }
      throw error;
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || "",
      expiresIn: tokens.expiry_date
        ? Math.floor((tokens.expiry_date - Date.now()) / 1000)
        : 3600,
      id: channelInfo.id || profile.id || "",
      name: channelInfo.snippet?.title || profile.name || "",
      picture:
        channelInfo.snippet?.thumbnails?.default?.url || profile.picture || "",
      username: channelInfo.snippet?.customUrl || profile.email || "",
    };
  }

  async refreshToken(refresh_token: string): Promise<AuthTokenDetails> {
    const client = this.getOAuth2Client();
    client.setCredentials({ refresh_token });

    // Refresh the access token
    const { credentials } = await client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error("Failed to refresh access token");
    }

    // Fetch updated user profile
    client.setCredentials(credentials);
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const { data: profile } = await oauth2.userinfo.get();

    // Get YouTube channel info
    const youtube = google.youtube({ version: "v3", auth: client });
    const { data } = await youtube.channels.list({
      part: ["snippet"],
      mine: true,
    });

    const channelInfo = data.items?.[0];

    return {
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token || refresh_token,
      expiresIn: credentials.expiry_date
        ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
        : 3600,
      id: channelInfo?.id || profile.id || "",
      name: channelInfo?.snippet?.title || profile.name || "",
      picture:
        channelInfo?.snippet?.thumbnails?.default?.url || profile.picture || "",
      username: channelInfo?.snippet?.customUrl || profile.email || "",
    };
  }

  async post(
    id: string,
    accessToken: string,
    postDetails: PostDetails[],
    integration: any,
  ): Promise<PostResponse[]> {
    const postDetail = postDetails[0];
    const settings = postDetail.settings as YouTubeVideoSettings;

    // Validate settings
    if (!validateTitle(settings.title)) {
      throw new Error("Video title must be between 1 and 100 characters");
    }

    if (!validateDescription(settings.description)) {
      throw new Error("Video description must not exceed 5000 characters");
    }

    if (settings.tags && !validateTags(settings.tags)) {
      throw new Error(
        "Invalid tags: maximum 500 tags, 400 characters total, 30 characters per tag",
      );
    }

    // Validate media
    if (!postDetail.media || postDetail.media.length === 0) {
      throw new Error("YouTube post must have exactly one video attachment");
    }

    if (postDetail.media.length > 1) {
      throw new Error("YouTube post can only have one video attachment");
    }

    // Create OAuth2 client
    const client = this.getOAuth2Client();
    client.setCredentials({
      access_token: accessToken,
      refresh_token: integration.refreshToken,
    });

    const youtube = google.youtube({ version: "v3", auth: client });

    try {
      // Handle video path - can be URL or file path
      let videoPath = postDetail.media[0].path;

      if (videoPath.startsWith("http://") || videoPath.startsWith("https://")) {
        // If it's a full URL, download it
        videoPath = await downloadVideo(videoPath);
      } else if (!videoPath.startsWith("/")) {
        // If it's a relative path, make it absolute
        const path = require("path");
        const storagePath = process.env.STORAGE_PATH || "./uploads";
        videoPath = path.resolve(storagePath, videoPath);
      }
      // If it's already an absolute path, use it as-is

      // Upload video
      const videoResponse = await youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
          snippet: {
            title: settings.title,
            description: settings.description,
            tags: settings.tags || [],
            categoryId: settings.categoryId || "22", // Default to People & Blogs
            defaultLanguage: "en",
          },
          status: {
            privacyStatus: settings.privacyStatus || "public",
            selfDeclaredMadeForKids: settings.selfDeclaredMadeForKids || false,
            publishAt: settings.publishAt,
          },
        },
        media: {
          body: createVideoStream(videoPath),
        },
      });

      const videoId = videoResponse.data.id;
      if (!videoId) {
        throw new Error("Failed to upload video: No video ID returned");
      }

      // Upload custom thumbnail if provided
      if (settings.thumbnail) {
        try {
          await youtube.thumbnails.set({
            videoId,
            media: {
              body: createVideoStream(settings.thumbnail),
            },
          });
        } catch (thumbnailError: any) {
          // Log thumbnail error but don't fail the post
          console.warn("Thumbnail upload failed:", thumbnailError.message);

          // Check if it's a precondition error (account not verified)
          if (
            thumbnailError.message?.includes("failedPrecondition") ||
            thumbnailError.message?.includes("thumbnail")
          ) {
            console.warn("Account may not be verified for custom thumbnails");
          }
        }
      }

      return [
        {
          id: postDetail.id,
          postId: videoId,
          releaseURL: `https://www.youtube.com/watch?v=${videoId}`,
          status: "success",
        },
      ];
    } catch (error: any) {
      // Handle YouTube-specific errors
      let errorBody: string;
      try {
        // Safely extract error information without circular references
        if (error.response?.data) {
          // For axios errors, extract just the data portion
          const data = error.response.data;
          if (typeof data === "string") {
            errorBody = data;
          } else if (typeof data === "object") {
            // Create a safe copy without circular references
            errorBody = JSON.stringify({
              error: data.error,
              message: data.message || data.error?.message,
              code: data.code || error.response.status,
            });
          } else {
            errorBody = String(data);
          }
        } else {
          errorBody = error.message || "Unknown error";
        }
      } catch (stringifyError) {
        // If JSON.stringify fails due to circular references, use message
        errorBody = error.message || "Error occurred during video upload";
      }

      const mappedError = this.handleErrors(errorBody);

      if (mappedError) {
        throw new Error(mappedError.value);
      }

      // Throw a clean error without circular references
      throw new Error(errorBody);
    }
  }

  async analytics(
    id: string,
    accessToken: string,
    days: number,
  ): Promise<AnalyticsData[]> {
    const client = this.getOAuth2Client();
    client.setCredentials({ access_token: accessToken });

    const youtubeAnalytics = google.youtubeAnalytics({
      version: "v2",
      auth: client,
    });
    const youtube = google.youtube({ version: "v3", auth: client });

    try {
      // First, get the total subscriber count
      let totalSubscribers = 0;
      try {
        const channelResponse = await youtube.channels.list({
          part: ["statistics"],
          mine: true,
        });

        if (
          channelResponse.data.items &&
          channelResponse.data.items.length > 0
        ) {
          const subscriberCount =
            channelResponse.data.items[0].statistics?.subscriberCount;
          if (subscriberCount) {
            totalSubscribers = parseInt(subscriberCount.toString(), 10);
          }
        }
      } catch (channelError: any) {
        console.warn("Failed to fetch total subscriber count:", channelError);
        // Re-throw 401 authentication errors so the controller can handle token refresh
        if (
          channelError.code === 401 ||
          channelError.status === 401 ||
          channelError.response?.status === 401 ||
          channelError.message?.includes("Invalid Credentials") ||
          channelError.message?.includes("invalid_token")
        ) {
          throw channelError;
        }
      }

      // Calculate date range based on days parameter
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Format dates for YouTube API (YYYY-MM-DD)
      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];

      const response = await youtubeAnalytics.reports.query({
        ids: "channel==MINE",
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        metrics:
          "views,estimatedMinutesWatched,averageViewDuration,subscribersGained,likes,comments,shares,dislikes",
        dimensions: "day",
        sort: "day",
      });

      const rows = response.data.rows || [];

      // Transform data into analytics format
      const viewsData: Array<{ date: string; total: number }> = [];
      const watchTimeData: Array<{ date: string; total: number }> = [];
      const avgDurationData: Array<{ date: string; total: number }> = [];
      const subscribersData: Array<{ date: string; total: number }> = [];
      const likesData: Array<{ date: string; total: number }> = [];
      const commentsData: Array<{ date: string; total: number }> = [];
      const sharesData: Array<{ date: string; total: number }> = [];
      const dislikesData: Array<{ date: string; total: number }> = [];

      rows.forEach((row: any[]) => {
        const [
          day,
          views,
          watchTime,
          avgDuration,
          subscribers,
          likes,
          comments,
          shares,
          dislikes,
        ] = row;

        viewsData.push({ date: day, total: views });
        watchTimeData.push({ date: day, total: watchTime });
        avgDurationData.push({ date: day, total: avgDuration });
        subscribersData.push({ date: day, total: subscribers });
        likesData.push({ date: day, total: likes });
        commentsData.push({ date: day, total: comments });
        sharesData.push({ date: day, total: shares });
        dislikesData.push({ date: day, total: dislikes });
      });

      // Create a metric for total subscribers
      const totalSubscribersData = [
        {
          date: new Date().toISOString().split("T")[0],
          total: totalSubscribers,
        },
      ];

      return [
        { label: "Views", data: viewsData },
        { label: "Watch Time (minutes)", data: watchTimeData },
        { label: "Avg View Duration (seconds)", data: avgDurationData },
        { label: "Subscribers Gained", data: subscribersData },
        { label: "Total Subscribers", data: totalSubscribersData },
        { label: "Likes", data: likesData },
        { label: "Comments", data: commentsData },
        { label: "Shares", data: sharesData },
        { label: "Dislikes", data: dislikesData },
      ];
    } catch (error: any) {
      console.error("YouTube analytics error:", error);

      // Re-throw 401 authentication errors so the controller can handle token refresh
      if (
        error.code === 401 ||
        error.status === 401 ||
        error.response?.status === 401 ||
        error.message?.includes("Invalid Credentials") ||
        error.message?.includes("invalid_token")
      ) {
        throw error;
      }

      // Check if it's an API not enabled error
      if (
        error.code === 403 &&
        error.errors?.[0]?.reason === "accessNotConfigured"
      ) {
        console.warn(
          "YouTube Analytics API is not enabled. Please enable it in Google Cloud Console.",
        );
        // Return basic metrics that might still work
        return [
          { label: "Views", data: [] },
          { label: "Subscribers Gained", data: [] },
          { label: "Likes", data: [] },
        ];
      }

      // Return empty array on error as per requirements
      return [];
    }
  }

  public override handleErrors(
    body: string,
  ):
    | { type: "refresh-token" | "bad-body" | "retry"; value: string }
    | undefined {
    return mapYouTubeError(body);
  }
}
