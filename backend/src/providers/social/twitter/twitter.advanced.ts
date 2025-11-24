import { TwitterApi } from 'twitter-api-v2';

/**
 * Twitter Thread Helper
 */
export class TwitterThreadHelper {
    /**
     * Post a thread of tweets
     */
    async postThread(
        client: TwitterApi,
        tweets: Array<{
            text: string;
            mediaIds?: string[];
            poll?: {
                options: string[];
                durationMinutes: number;
            };
        }>
    ): Promise<Array<{ id: string; text: string }>> {
        const postedTweets: Array<{ id: string; text: string }> = [];
        let previousTweetId: string | undefined;

        for (const tweet of tweets) {
            const tweetData: any = {
                text: tweet.text,
            };

            // Add reply to previous tweet
            if (previousTweetId) {
                tweetData.reply = {
                    in_reply_to_tweet_id: previousTweetId,
                };
            }

            // Add media
            if (tweet.mediaIds && tweet.mediaIds.length > 0) {
                tweetData.media = {
                    media_ids: tweet.mediaIds,
                };
            }

            // Add poll
            if (tweet.poll) {
                tweetData.poll = {
                    options: tweet.poll.options,
                    duration_minutes: tweet.poll.durationMinutes,
                };
            }

            const response = await client.v2.tweet(tweetData);

            postedTweets.push({
                id: response.data.id,
                text: response.data.text,
            });

            previousTweetId = response.data.id;
        }

        return postedTweets;
    }

    /**
     * Delete a thread
     */
    async deleteThread(
        client: TwitterApi,
        tweetIds: string[]
    ): Promise<void> {
        for (const tweetId of tweetIds.reverse()) {
            await client.v2.deleteTweet(tweetId);
        }
    }
}

/**
 * Twitter Quote Tweet Helper
 */
export class TwitterQuoteTweetHelper {
    /**
     * Quote tweet another tweet
     */
    async quoteTweet(
        client: TwitterApi,
        quotedTweetId: string,
        text: string,
        options?: {
            mediaIds?: string[];
        }
    ): Promise<{ id: string; text: string; url: string }> {
        const tweetData: any = {
            text,
            quote_tweet_id: quotedTweetId,
        };

        if (options?.mediaIds && options.mediaIds.length > 0) {
            tweetData.media = {
                media_ids: options.mediaIds,
            };
        }

        const response = await client.v2.tweet(tweetData);

        return {
            id: response.data.id,
            text: response.data.text,
            url: `https://twitter.com/i/web/status/${response.data.id}`,
        };
    }
}

/**
 * Twitter Media Helper
 */
export class TwitterMediaHelper {
    /**
     * Upload media with alt text
     */
    async uploadMediaWithAltText(
        client: TwitterApi,
        mediaPath: string,
        altText: string
    ): Promise<string> {
        // Upload media
        const mediaId = await client.v1.uploadMedia(mediaPath);

        // Add alt text
        await client.v1.createMediaMetadata(mediaId, {
            alt_text: { text: altText },
        });

        return mediaId;
    }

    /**
     * Upload multiple media files
     */
    async uploadMultipleMedia(
        client: TwitterApi,
        mediaPaths: Array<{ path: string; altText?: string }>
    ): Promise<string[]> {
        const mediaIds: string[] = [];

        for (const media of mediaPaths) {
            const mediaId = await client.v1.uploadMedia(media.path);

            if (media.altText) {
                await client.v1.createMediaMetadata(mediaId, {
                    alt_text: { text: media.altText },
                });
            }

            mediaIds.push(mediaId);
        }

        return mediaIds;
    }

    /**
     * Tag users in media
     */
    async tagUsersInMedia(
        client: TwitterApi,
        mediaId: string,
        tags: Array<{
            userId: string;
            x: number; // 0-100 percentage
            y: number; // 0-100 percentage
        }>
    ): Promise<void> {
        await client.v1.createMediaMetadata(mediaId, {
            // additional_owners is not supported in the current type definition
            // additional_owners: tags.map(tag => tag.userId),
        });
    }
}

/**
 * Twitter Poll Helper
 */
export class TwitterPollHelper {
    /**
     * Create a poll tweet
     */
    async createPoll(
        client: TwitterApi,
        text: string,
        options: string[],
        durationMinutes: number
    ): Promise<{ id: string; text: string }> {
        if (options.length < 2 || options.length > 4) {
            throw new Error('Poll must have 2-4 options');
        }

        if (durationMinutes < 5 || durationMinutes > 10080) {
            throw new Error('Poll duration must be between 5 minutes and 7 days');
        }

        const response = await client.v2.tweet({
            text,
            poll: {
                options,
                duration_minutes: durationMinutes,
            },
        });

        return {
            id: response.data.id,
            text: response.data.text,
        };
    }

    /**
     * Get poll results
     */
    async getPollResults(
        client: TwitterApi,
        tweetId: string
    ): Promise<{
        options: Array<{
            position: number;
            label: string;
            votes: number;
        }>;
        votingStatus: string;
        endDatetime: string;
        durationMinutes: number;
    } | null> {
        const tweet = await client.v2.singleTweet(tweetId, {
            'tweet.fields': ['attachments'],
            expansions: ['attachments.poll_ids'],
            'poll.fields': ['options', 'voting_status', 'end_datetime', 'duration_minutes'],
        });

        const poll = tweet.includes?.polls?.[0];

        if (!poll) {
            return null;
        }

        return {
            options: poll.options,
            votingStatus: poll.voting_status || 'closed',
            endDatetime: poll.end_datetime || '',
            durationMinutes: poll.duration_minutes || 0,
        };
    }
}

/**
 * Twitter Lists Helper
 */
export class TwitterListsHelper {
    /**
     * Create a Twitter list
     */
    async createList(
        client: TwitterApi,
        name: string,
        description?: string,
        isPrivate: boolean = false
    ): Promise<{ id: string; name: string }> {
        const response = await client.v2.createList({
            name,
            description,
            private: isPrivate,
        });

        return {
            id: response.data.id,
            name: response.data.name,
        };
    }

    /**
     * Add member to list
     */
    async addMemberToList(
        client: TwitterApi,
        listId: string,
        userId: string
    ): Promise<boolean> {
        const response = await client.v2.addListMember(listId, userId);
        return response.data.is_member;
    }

    /**
     * Remove member from list
     */
    async removeMemberFromList(
        client: TwitterApi,
        listId: string,
        userId: string
    ): Promise<boolean> {
        await client.v2.removeListMember(listId, userId);
        return true;
    }

    /**
     * Get list members
     */
    async getListMembers(
        client: TwitterApi,
        listId: string
    ): Promise<Array<{
        id: string;
        name: string;
        username: string;
    }>> {
        const members = await client.v2.listMembers(listId, {
            'user.fields': ['name', 'username'],
        });

        return members.data.data.map(user => ({
            id: user.id,
            name: user.name,
            username: user.username,
        }));
    }

    /**
     * Delete list
     */
    async deleteList(
        client: TwitterApi,
        listId: string
    ): Promise<boolean> {
        const response = await client.v2.removeList(listId);
        return response.data.deleted;
    }
}

/**
 * Twitter Spaces Helper
 */
export class TwitterSpacesHelper {
    /**
     * Get Space details
     */
    async getSpace(
        client: TwitterApi,
        spaceId: string
    ): Promise<{
        id: string;
        state: string;
        title: string;
        participantCount: number;
        speakerCount: number;
        isTicketed: boolean;
        scheduledStart?: string;
        startedAt?: string;
    } | null> {
        const space = await client.v2.space(spaceId, {
            'space.fields': [
                'state',
                'title',
                'participant_count',
                'is_ticketed',
                'scheduled_start',
                'started_at',
            ],
        });

        if (!space.data) {
            return null;
        }

        return {
            id: space.data.id,
            state: space.data.state,
            title: space.data.title || '',
            participantCount: space.data.participant_count || 0,
            speakerCount: 0, // Not available in this version
            isTicketed: space.data.is_ticketed || false,
            scheduledStart: space.data.scheduled_start,
            startedAt: space.data.started_at,
        };
    }

    /**
     * Get user's Spaces
     */
    async getUserSpaces(
        client: TwitterApi,
        userId: string
    ): Promise<Array<{
        id: string;
        state: string;
        title: string;
    }>> {
        const spaces = await client.v2.spacesByCreators([userId], {
            'space.fields': ['state', 'title'],
        });

        return spaces.data.map(space => ({
            id: space.id,
            state: space.state,
            title: space.title || '',
        }));
    }
}

/**
 * Twitter Analytics Helper
 */
export class TwitterAnalyticsHelper {
    /**
     * Get tweet metrics
     */
    async getTweetMetrics(
        client: TwitterApi,
        tweetId: string
    ): Promise<{
        impressions: number;
        likes: number;
        retweets: number;
        replies: number;
        quotes: number;
        bookmarks: number;
        urlLinkClicks: number;
    }> {
        const tweet = await client.v2.singleTweet(tweetId, {
            'tweet.fields': ['public_metrics', 'non_public_metrics', 'organic_metrics'],
        });

        const publicMetrics = tweet.data.public_metrics || {};
        const nonPublicMetrics = (tweet.data as any).non_public_metrics || {};
        const organicMetrics = (tweet.data as any).organic_metrics || {};

        return {
            impressions: organicMetrics.impression_count || nonPublicMetrics.impression_count || 0,
            likes: (publicMetrics as any).like_count || 0,
            retweets: (publicMetrics as any).retweet_count || 0,
            replies: (publicMetrics as any).reply_count || 0,
            quotes: (publicMetrics as any).quote_count || 0,
            bookmarks: (publicMetrics as any).bookmark_count || 0,
            urlLinkClicks: nonPublicMetrics.url_link_clicks || 0,
        };
    }

    /**
     * Get user metrics
     */
    async getUserMetrics(
        client: TwitterApi,
        userId: string
    ): Promise<{
        followers: number;
        following: number;
        tweets: number;
        listed: number;
    }> {
        const user = await client.v2.user(userId, {
            'user.fields': ['public_metrics'],
        });

        const metrics = user.data.public_metrics || {};

        return {
            followers: metrics.followers_count || 0,
            following: metrics.following_count || 0,
            tweets: metrics.tweet_count || 0,
            listed: metrics.listed_count || 0,
        };
    }
}

// Export helper instances
export const twitterThreadHelper = new TwitterThreadHelper();
export const twitterQuoteTweetHelper = new TwitterQuoteTweetHelper();
export const twitterMediaHelper = new TwitterMediaHelper();
export const twitterPollHelper = new TwitterPollHelper();
export const twitterListsHelper = new TwitterListsHelper();
export const twitterSpacesHelper = new TwitterSpacesHelper();
export const twitterAnalyticsHelper = new TwitterAnalyticsHelper();
