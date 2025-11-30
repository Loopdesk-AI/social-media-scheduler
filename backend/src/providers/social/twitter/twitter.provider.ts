// Twitter/X Provider Implementation

import { TwitterApi, EUploadMimeType } from "twitter-api-v2";
import { SocialAbstract } from "../../base/social.abstract";
import {
  SocialProvider,
  AuthTokenDetails,
  PostDetails,
  PostResponse,
  AnalyticsData,
} from "../../base/social.interface";
import { mapTwitterError } from "./twitter.errors";
import {
  TwitterPostSettings,
  TwitterTweetResponse,
  TwitterUserResponse,
  TwitterThreadSettings,
  TwitterQuoteTweetSettings,
  TwitterMediaAltText,
} from "./twitter.types";
import {
  validateTweetLength,
  validatePollOptions,
  validatePollDuration,
  validateMediaCount,
  generateCodeVerifier,
  generateCodeChallenge,
  calculateEngagementRate,
  formatDate,
  getMediaType,
  splitIntoThread,
  wait,
} from "./twitter.utils";
import { makeId } from "../../../utils/helpers";
import { rateLimiterService } from "../../../services/rate-limiter.service";
import logger from "../../../utils/logger";

export class TwitterProvider extends SocialAbstract implements SocialProvider {
  identifier = "twitter";
  name = "X (Twitter)";
  scopes = ["tweet.read", "tweet.write", "users.read", "offline.access"];
  override maxConcurrentJob = 5;
  dto = {} as TwitterPostSettings;
  editor = "normal" as const;

  private readonly redirectUri = `${process.env.BACKEND_URL || "http://localhost:3000"}/api/integrations/twitter/callback`;

  maxLength(): number {
    return 280; // Twitter character limit
  }

  async generateAuthUrl(): Promise<{
    url: string;
    codeVerifier: string;
    state: string;
  }> {
    const state = makeId(6);
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.TWITTER_CLIENT_ID!,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(" "),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return {
      url: `https://twitter.com/i/oauth2/authorize?${params.toString()}`,
      codeVerifier,
      state,
    };
  }

  async authenticate(params: {
    code: string;
    codeVerifier: string;
    refresh?: string;
  }): Promise<AuthTokenDetails> {
    try {
      const client = new TwitterApi({
        clientId: process.env.TWITTER_CLIENT_ID!,
        clientSecret: process.env.TWITTER_CLIENT_SECRET,
      });

      // Exchange code for tokens with PKCE
      const {
        client: loggedClient,
        accessToken,
        refreshToken,
        expiresIn,
      } = await client.loginWithOAuth2({
        code: params.code,
        codeVerifier: params.codeVerifier,
        redirectUri: this.redirectUri,
      });

      // Fetch user profile
      const user = await loggedClient.v2.me({
        "user.fields": ["profile_image_url", "username", "name"],
      });

      return {
        accessToken: accessToken!,
        refreshToken: refreshToken || "",
        expiresIn: expiresIn || 7200,
        id: user.data.id,
        name: user.data.name,
        picture: user.data.profile_image_url || "",
        username: user.data.username,
      };
    } catch (error: any) {
      const errorBody = error.data ? JSON.stringify(error.data) : error.message;
      const mappedError = this.handleErrors(errorBody, error.code);

      if (mappedError) {
        throw new Error(mappedError.value);
      }

      throw error;
    }
  }

  async refreshToken(refresh_token: string): Promise<AuthTokenDetails> {
    try {
      const client = new TwitterApi({
        clientId: process.env.TWITTER_CLIENT_ID!,
        clientSecret: process.env.TWITTER_CLIENT_SECRET,
      });

      // Refresh access token
      const {
        client: refreshedClient,
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn,
      } = await client.refreshOAuth2Token(refresh_token);

      // Fetch updated user profile
      const user = await refreshedClient.v2.me({
        "user.fields": ["profile_image_url", "username", "name"],
      });

      return {
        accessToken: accessToken!,
        refreshToken: newRefreshToken || refresh_token,
        expiresIn: expiresIn || 7200,
        id: user.data.id,
        name: user.data.name,
        picture: user.data.profile_image_url || "",
        username: user.data.username,
      };
    } catch (error: any) {
      const errorBody = error.data ? JSON.stringify(error.data) : error.message;
      const mappedError = this.handleErrors(errorBody, error.code);

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
    const settings = postDetail.settings as TwitterPostSettings;

    // Validate tweet length
    if (!validateTweetLength(settings.text)) {
      throw new Error("Tweet text must be between 1 and 280 characters");
    }

    // Validate poll if present
    if (settings.poll) {
      if (!validatePollOptions(settings.poll.options)) {
        throw new Error("Poll must have 2-4 options, each max 25 characters");
      }
      if (!validatePollDuration(settings.poll.duration_minutes)) {
        throw new Error("Poll duration must be between 5 minutes and 7 days");
      }
    }

    try {
      // Check rate limit
      await rateLimiterService.waitForRateLimit("twitter", id, "tweets");
      logger.info("Posting tweet to Twitter", {
        id,
        textLength: settings.text.length,
        hasMedia: (postDetail.media?.length || 0) > 0,
      });

      const client = new TwitterApi(accessToken);

      // Upload media if present
      const mediaIds: string[] = [];

      if (postDetail.media && postDetail.media.length > 0) {
        const mediaType = getMediaType(postDetail.media[0].path);

        if (
          mediaType !== "unknown" &&
          !validateMediaCount(postDetail.media.length, mediaType)
        ) {
          throw new Error(
            "Twitter supports max 4 images or 1 video/GIF per tweet",
          );
        }

        for (const media of postDetail.media) {
          const actualMediaType = mediaType === "unknown" ? "image" : mediaType;
          const mediaId = await this.uploadMedia(
            client,
            media.path,
            actualMediaType,
          );
          mediaIds.push(mediaId);
        }
      }

      // Create tweet
      const tweetData: any = {
        text: settings.text,
      };

      if (mediaIds.length > 0) {
        tweetData.media = { media_ids: mediaIds };
      }

      if (settings.poll) {
        tweetData.poll = {
          options: settings.poll.options,
          duration_minutes: settings.poll.duration_minutes,
        };
      }

      if (settings.reply_settings) {
        tweetData.reply_settings = settings.reply_settings;
      }

      if (settings.quote_tweet_id) {
        tweetData.quote_tweet_id = settings.quote_tweet_id;
      }

      if (settings.for_super_followers_only) {
        tweetData.for_super_followers_only = true;
      }

      const tweet = await client.v2.tweet(tweetData);

      return [
        {
          id: postDetail.id,
          postId: tweet.data.id,
          releaseURL: `https://twitter.com/${id}/status/${tweet.data.id}`,
          status: "success",
        },
      ];
    } catch (error: any) {
      const errorBody = error.data ? JSON.stringify(error.data) : error.message;
      const mappedError = this.handleErrors(errorBody, error.code);

      if (mappedError) {
        throw new Error(mappedError.value);
      }

      throw error;
    }
  }

  private async uploadMedia(
    client: TwitterApi,
    filePath: string,
    mediaType: "image" | "video" | "gif",
  ): Promise<string> {
    let mimeType: EUploadMimeType;

    if (mediaType === "image") {
      mimeType = EUploadMimeType.Jpeg;
    } else if (mediaType === "video") {
      mimeType = EUploadMimeType.Mp4;
    } else {
      mimeType = EUploadMimeType.Gif;
    }

    const mediaId = await client.v1.uploadMedia(filePath, { mimeType });
    return mediaId;
  }

  async analytics(
    id: string,
    accessToken: string,
    date: number,
  ): Promise<AnalyticsData[]> {
    try {
      const client = new TwitterApi(accessToken);

      const startDate = new Date(date);
      const endDate = new Date();

      // Fetch user timeline with metrics
      const timeline = await client.v2.userTimeline(id, {
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        "tweet.fields": ["public_metrics", "created_at"],
        max_results: 100,
      });

      const impressionsData: Array<{ date: string; total: number }> = [];
      const likesData: Array<{ date: string; total: number }> = [];
      const repliesData: Array<{ date: string; total: number }> = [];
      const retweetsData: Array<{ date: string; total: number }> = [];
      const quotesData: Array<{ date: string; total: number }> = [];
      const engagementData: Array<{ date: string; total: number }> = [];

      for (const tweet of timeline.data.data || []) {
        const date = formatDate(new Date(tweet.created_at!));
        const metrics = tweet.public_metrics!;

        impressionsData.push({ date, total: metrics.impression_count || 0 });
        likesData.push({ date, total: metrics.like_count });
        repliesData.push({ date, total: metrics.reply_count });
        retweetsData.push({ date, total: metrics.retweet_count });
        quotesData.push({ date, total: metrics.quote_count || 0 });

        const engagement = calculateEngagementRate(
          metrics.like_count,
          metrics.reply_count,
          metrics.retweet_count,
          metrics.quote_count || 0,
          metrics.impression_count || 1,
        );
        engagementData.push({ date, total: engagement });
      }

      return [
        { label: "Impressions", data: impressionsData },
        { label: "Likes", data: likesData },
        { label: "Replies", data: repliesData },
        { label: "Retweets", data: retweetsData },
        { label: "Quotes", data: quotesData },
        { label: "Engagement Rate (%)", data: engagementData },
      ];
    } catch (error: any) {
      console.error("Twitter analytics error:", error);
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
    return mapTwitterError(body, statusCode);
  }

  /**
   * Post a thread (multiple related tweets)
   * Uses the existing splitIntoThread utility to intelligently split long text
   */
  async postThread(
    id: string,
    accessToken: string,
    settings: TwitterThreadSettings,
  ): Promise<string[]> {
    await rateLimiterService.waitForRateLimit("twitter", id, "tweets");
    logger.info("Posting thread to Twitter", {
      id,
      tweetCount: settings.tweets.length,
    });

    const client = new TwitterApi(accessToken);
    const tweetIds: string[] = [];
    let previousTweetId: string | undefined;

    // Post tweets in sequence, each replying to the previous
    for (let i = 0; i < settings.tweets.length; i++) {
      const tweetData = settings.tweets[i];

      const postData: any = {
        text: tweetData.text,
      };

      if (tweetData.mediaIds && tweetData.mediaIds.length > 0) {
        postData.media = { media_ids: tweetData.mediaIds };
      }

      if (previousTweetId) {
        postData.reply = {
          in_reply_to_tweet_id: previousTweetId,
        };
      }

      if (settings.reply_settings && i === 0) {
        postData.reply_settings = settings.reply_settings;
      }

      const tweet = await client.v2.tweet(postData);
      tweetIds.push(tweet.data.id);
      previousTweetId = tweet.data.id;

      // Add small delay between tweets to avoid rate limiting
      if (i < settings.tweets.length - 1) {
        await wait(1000);
      }
    }

    logger.info("Thread posted successfully", { id, tweetIds });
    return tweetIds;
  }

  /**
   * Quote tweet - tweet with a link to another tweet
   * Allows commenting on or sharing another tweet with added context
   */
  async quoteTweet(
    id: string,
    accessToken: string,
    settings: TwitterQuoteTweetSettings,
  ): Promise<string> {
    await rateLimiterService.waitForRateLimit("twitter", id, "tweets");
    logger.info("Posting quote tweet to Twitter", {
      id,
      quotedTweetId: settings.quotedTweetId,
    });

    const client = new TwitterApi(accessToken);

    const tweetData: any = {
      text: settings.text,
      quote_tweet_id: settings.quotedTweetId,
    };

    if (settings.mediaIds && settings.mediaIds.length > 0) {
      tweetData.media = { media_ids: settings.mediaIds };
    }

    const tweet = await client.v2.tweet(tweetData);

    logger.info("Quote tweet posted successfully", {
      id,
      tweetId: tweet.data.id,
    });
    return tweet.data.id;
  }

  /**
   * Add alt text to media for accessibility
   * Should be called after uploading media but before posting
   */
  async addMediaAltText(
    accessToken: string,
    altTextData: TwitterMediaAltText[],
  ): Promise<void> {
    logger.info("Adding alt text to media", { mediaCount: altTextData.length });

    const client = new TwitterApi(accessToken);

    for (const { mediaId, altText } of altTextData) {
      await client.v1.createMediaMetadata(mediaId, {
        alt_text: { text: altText },
      });
    }

    logger.info("Alt text added successfully");
  }
}
