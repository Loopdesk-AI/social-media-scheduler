import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

/**
 * Facebook Stories API Helper
 */
export class FacebookStoriesHelper {
    private baseUrl = 'https://graph.facebook.com/v20.0';

    /**
     * Post a photo story to Facebook Page
     */
    async postPhotoStory(
        pageId: string,
        accessToken: string,
        photoUrl: string,
        options?: {
            link?: string;
            linkSticker?: {
                url: string;
                x: number; // 0-1 (percentage)
                y: number; // 0-1 (percentage)
            };
        }
    ): Promise<string> {
        const payload: any = {
            photo_url: photoUrl,
        };

        // Add link sticker if provided
        if (options?.linkSticker) {
            payload.link_sticker = {
                link: options.linkSticker.url,
                x: options.linkSticker.x,
                y: options.linkSticker.y,
            };
        }

        const response = await axios.post(
            `${this.baseUrl}/${pageId}/photo_stories`,
            payload,
            {
                params: { access_token: accessToken },
            }
        );

        return response.data.id;
    }

    /**
     * Post a video story to Facebook Page
     */
    async postVideoStory(
        pageId: string,
        accessToken: string,
        videoUrl: string,
        options?: {
            link?: string;
            linkSticker?: {
                url: string;
                x: number;
                y: number;
            };
        }
    ): Promise<string> {
        const payload: any = {
            video_url: videoUrl,
        };

        if (options?.linkSticker) {
            payload.link_sticker = {
                link: options.linkSticker.url,
                x: options.linkSticker.x,
                y: options.linkSticker.y,
            };
        }

        const response = await axios.post(
            `${this.baseUrl}/${pageId}/video_stories`,
            payload,
            {
                params: { access_token: accessToken },
            }
        );

        return response.data.id;
    }

    /**
     * Get story insights
     */
    async getStoryInsights(
        storyId: string,
        accessToken: string
    ): Promise<{
        reach: number;
        impressions: number;
        taps_forward: number;
        taps_back: number;
        exits: number;
    }> {
        const response = await axios.get(
            `${this.baseUrl}/${storyId}/insights`,
            {
                params: {
                    access_token: accessToken,
                    metric: 'reach,impressions,taps_forward,taps_back,exits',
                },
            }
        );

        const data = response.data.data || [];
        const insights: any = {};

        data.forEach((metric: any) => {
            insights[metric.name] = metric.values[0]?.value || 0;
        });

        return insights;
    }
}

/**
 * Facebook Carousel Helper
 */
export class FacebookCarouselHelper {
    private baseUrl = 'https://graph.facebook.com/v20.0';

    /**
     * Create a carousel post with multiple cards
     */
    async postCarousel(
        pageId: string,
        accessToken: string,
        cards: Array<{
            link: string;
            picture?: string;
            name?: string;
            description?: string;
        }>,
        message?: string
    ): Promise<string> {
        // Create carousel attachment
        const childAttachments = cards.map(card => ({
            link: card.link,
            picture: card.picture,
            name: card.name,
            description: card.description,
        }));

        const response = await axios.post(
            `${this.baseUrl}/${pageId}/feed`,
            {
                message,
                child_attachments: childAttachments,
                multi_share_end_card: false,
            },
            {
                params: { access_token: accessToken },
            }
        );

        return response.data.id;
    }

    /**
     * Create product carousel (for e-commerce)
     */
    async postProductCarousel(
        pageId: string,
        accessToken: string,
        products: Array<{
            id: string; // Product catalog ID
            retailer_item_id: string;
        }>,
        message?: string
    ): Promise<string> {
        const response = await axios.post(
            `${this.baseUrl}/${pageId}/feed`,
            {
                message,
                attached_media: products.map(p => ({
                    product_item_id: p.retailer_item_id,
                })),
            },
            {
                params: { access_token: accessToken },
            }
        );

        return response.data.id;
    }
}

/**
 * Facebook Reels Helper
 */
export class FacebookReelsHelper {
    private baseUrl = 'https://graph.facebook.com/v20.0';

    /**
     * Upload and publish a Reel
     */
    async postReel(
        pageId: string,
        accessToken: string,
        videoUrl: string,
        options: {
            description?: string;
            title?: string;
            coverUrl?: string;
            shareToFeed?: boolean;
            locationId?: string;
        }
    ): Promise<string> {
        // Step 1: Initialize upload session
        const initResponse = await axios.post(
            `${this.baseUrl}/${pageId}/video_reels`,
            {
                upload_phase: 'start',
                video_url: videoUrl,
            },
            {
                params: { access_token: accessToken },
            }
        );

        const videoId = initResponse.data.video_id;

        // Step 2: Finish upload and publish
        const publishResponse = await axios.post(
            `${this.baseUrl}/${pageId}/video_reels`,
            {
                upload_phase: 'finish',
                video_id: videoId,
                description: options.description,
                title: options.title,
                thumb_offset: 0,
                video_state: 'PUBLISHED',
                share_to_feed: options.shareToFeed !== false,
            },
            {
                params: { access_token: accessToken },
            }
        );

        return publishResponse.data.id;
    }

    /**
     * Get Reel insights
     */
    async getReelInsights(
        reelId: string,
        accessToken: string
    ): Promise<{
        plays: number;
        reach: number;
        total_interactions: number;
        likes: number;
        comments: number;
        shares: number;
    }> {
        const response = await axios.get(
            `${this.baseUrl}/${reelId}/insights`,
            {
                params: {
                    access_token: accessToken,
                    metric: 'total_video_views,total_video_views_unique,total_video_interactions,total_video_likes,total_video_comments,total_video_shares',
                },
            }
        );

        const data = response.data.data || [];
        const insights: any = {};

        data.forEach((metric: any) => {
            const name = metric.name.replace('total_video_', '');
            insights[name] = metric.values[0]?.value || 0;
        });

        return {
            plays: insights.views || 0,
            reach: insights.views_unique || 0,
            total_interactions: insights.interactions || 0,
            likes: insights.likes || 0,
            comments: insights.comments || 0,
            shares: insights.shares || 0,
        };
    }
}

/**
 * Facebook Scheduled Publishing Helper
 */
export class FacebookScheduledPublishingHelper {
    private baseUrl = 'https://graph.facebook.com/v20.0';

    /**
     * Schedule a post for future publishing
     */
    async schedulePost(
        pageId: string,
        accessToken: string,
        postData: {
            message?: string;
            link?: string;
            photoUrl?: string;
            videoId?: string;
            scheduledPublishTime: number; // Unix timestamp
        }
    ): Promise<string> {
        const payload: any = {
            published: false,
            scheduled_publish_time: postData.scheduledPublishTime,
        };

        if (postData.message) payload.message = postData.message;
        if (postData.link) payload.link = postData.link;

        let endpoint = `${this.baseUrl}/${pageId}/feed`;

        // Handle different post types
        if (postData.photoUrl) {
            endpoint = `${this.baseUrl}/${pageId}/photos`;
            payload.url = postData.photoUrl;
        } else if (postData.videoId) {
            endpoint = `${this.baseUrl}/${pageId}/videos`;
            payload.file_url = postData.videoId;
        }

        const response = await axios.post(endpoint, payload, {
            params: { access_token: accessToken },
        });

        return response.data.id;
    }

    /**
     * Get scheduled posts
     */
    async getScheduledPosts(
        pageId: string,
        accessToken: string
    ): Promise<Array<{
        id: string;
        message: string;
        scheduled_publish_time: number;
        created_time: string;
    }>> {
        const response = await axios.get(
            `${this.baseUrl}/${pageId}/scheduled_posts`,
            {
                params: {
                    access_token: accessToken,
                    fields: 'id,message,scheduled_publish_time,created_time',
                },
            }
        );

        return response.data.data || [];
    }

    /**
     * Update scheduled post
     */
    async updateScheduledPost(
        postId: string,
        accessToken: string,
        updates: {
            message?: string;
            scheduledPublishTime?: number;
        }
    ): Promise<boolean> {
        const payload: any = {};
        if (updates.message) payload.message = updates.message;
        if (updates.scheduledPublishTime) {
            payload.scheduled_publish_time = updates.scheduledPublishTime;
        }

        const response = await axios.post(
            `${this.baseUrl}/${postId}`,
            payload,
            {
                params: { access_token: accessToken },
            }
        );

        return response.data.success === true;
    }

    /**
     * Delete scheduled post
     */
    async deleteScheduledPost(
        postId: string,
        accessToken: string
    ): Promise<boolean> {
        const response = await axios.delete(
            `${this.baseUrl}/${postId}`,
            {
                params: { access_token: accessToken },
            }
        );

        return response.data.success === true;
    }

    /**
     * Publish scheduled post immediately
     */
    async publishScheduledPost(
        postId: string,
        accessToken: string
    ): Promise<string> {
        const response = await axios.post(
            `${this.baseUrl}/${postId}`,
            {
                is_published: true,
            },
            {
                params: { access_token: accessToken },
            }
        );

        return response.data.id;
    }
}

// Export helper instances
export const facebookStoriesHelper = new FacebookStoriesHelper();
export const facebookCarouselHelper = new FacebookCarouselHelper();
export const facebookReelsHelper = new FacebookReelsHelper();
export const facebookScheduledPublishingHelper = new FacebookScheduledPublishingHelper();
