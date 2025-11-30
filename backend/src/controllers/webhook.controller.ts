import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '../utils/logger';
import { prisma } from '../database/prisma.client';

/**
 * Webhook Controller
 * Handles incoming webhooks from social media platforms
 */
export class WebhookController {
    /**
     * Facebook Webhook Verification (GET)
     * Facebook sends this to verify the webhook endpoint
     */
    async verifyFacebookWebhook(req: Request, res: Response) {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        const verifyToken = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || 'social_scheduler_verify';

        if (mode === 'subscribe' && token === verifyToken) {
            logger.info('Facebook webhook verified');
            res.status(200).send(challenge);
        } else {
            logger.warn('Facebook webhook verification failed', { mode, token });
            res.sendStatus(403);
        }
    }

    /**
     * Facebook Webhook Handler (POST)
     * Receives updates about page posts, comments, etc.
     */
    async handleFacebookWebhook(req: Request, res: Response, next: NextFunction) {
        try {
            // Verify signature
            const signature = req.headers['x-hub-signature-256'] as string;
            if (!this.verifyFacebookSignature(req.body, signature)) {
                logger.warn('Invalid Facebook webhook signature');
                return res.sendStatus(403);
            }

            const { object, entry } = req.body;

            if (object !== 'page') {
                return res.sendStatus(200);
            }

            logger.info('Facebook webhook received', { entry });

            // Process each entry
            for (const item of entry) {
                const pageId = item.id;
                const changes = item.changes || [];

                for (const change of changes) {
                    await this.processFacebookChange(pageId, change);
                }
            }

            res.sendStatus(200);
        } catch (error) {
            logger.error('Facebook webhook error', { error });
            next(error);
        }
    }

    /**
     * LinkedIn Webhook Handler
     * Receives updates about share updates, organization changes
     */
    async handleLinkedInWebhook(req: Request, res: Response, next: NextFunction) {
        try {
            // LinkedIn doesn't use signature verification for webhooks
            // Instead, verify the request comes from LinkedIn's IP ranges

            const { eventType, data } = req.body;

            logger.info('LinkedIn webhook received', { eventType, data });

            switch (eventType) {
                case 'SHARE_CREATED':
                    await this.processLinkedInShareCreated(data);
                    break;
                case 'SHARE_UPDATED':
                    await this.processLinkedInShareUpdated(data);
                    break;
                case 'SHARE_DELETED':
                    await this.processLinkedInShareDeleted(data);
                    break;
                default:
                    logger.warn('Unknown LinkedIn webhook event', { eventType });
            }

            res.sendStatus(200);
        } catch (error) {
            logger.error('LinkedIn webhook error', { error });
            next(error);
        }
    }

    /**
     * Twitter Webhook Challenge Response (CRC)
     * Twitter uses Challenge-Response Check for webhook verification
     */
    async verifyTwitterWebhook(req: Request, res: Response) {
        const crcToken = req.query.crc_token as string;

        if (!crcToken) {
            return res.status(400).json({ error: 'Missing crc_token' });
        }

        const consumerSecret = process.env.TWITTER_CLIENT_SECRET || '';
        const hmac = crypto
            .createHmac('sha256', consumerSecret)
            .update(crcToken)
            .digest('base64');

        const responseToken = `sha256=${hmac}`;

        logger.info('Twitter webhook CRC verified');
        res.status(200).json({ response_token: responseToken });
    }

    /**
     * Twitter Webhook Handler
     * Receives updates about tweets, DMs, etc.
     */
    async handleTwitterWebhook(req: Request, res: Response, next: NextFunction) {
        try {
            // Verify signature
            const signature = req.headers['x-twitter-webhooks-signature'] as string;
            if (!this.verifyTwitterSignature(req.body, signature)) {
                logger.warn('Invalid Twitter webhook signature');
                return res.sendStatus(403);
            }

            const events = req.body;

            logger.info('Twitter webhook received', { events });

            // Process tweet events
            if (events.tweet_create_events) {
                for (const tweet of events.tweet_create_events) {
                    await this.processTwitterTweetCreated(tweet);
                }
            }

            // Process favorite events
            if (events.favorite_events) {
                for (const favorite of events.favorite_events) {
                    await this.processTwitterFavorite(favorite);
                }
            }

            res.sendStatus(200);
        } catch (error) {
            logger.error('Twitter webhook error', { error });
            next(error);
        }
    }

    /**
     * Verify Facebook webhook signature
     */
    private verifyFacebookSignature(payload: any, signature: string): boolean {
        if (!signature) return false;

        const appSecret = process.env.FACEBOOK_APP_SECRET || '';
        const expectedSignature = 'sha256=' + crypto
            .createHmac('sha256', appSecret)
            .update(JSON.stringify(payload))
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    }

    /**
     * Verify Twitter webhook signature
     */
    private verifyTwitterSignature(payload: any, signature: string): boolean {
        if (!signature) return false;

        const consumerSecret = process.env.TWITTER_CLIENT_SECRET || '';
        const expectedSignature = 'sha256=' + crypto
            .createHmac('sha256', consumerSecret)
            .update(JSON.stringify(payload))
            .digest('base64');

        return signature === expectedSignature;
    }

    /**
     * Process Facebook page change
     */
    private async processFacebookChange(pageId: string, change: any) {
        const { field, value } = change;

        logger.info('Processing Facebook change', { pageId, field, value });

        switch (field) {
            case 'feed':
                // Post published, updated, or deleted
                if (value.item === 'post') {
                    await this.updatePostStatus(pageId, value.post_id, 'facebook', 'PUBLISHED');
                }
                break;

            case 'page_access_token':
                // Page access token changed - mark integration for refresh
                await this.markIntegrationForRefresh(pageId, 'facebook');
                break;

            default:
                logger.debug('Unhandled Facebook change field', { field });
        }
    }

    /**
     * Process LinkedIn share created
     */
    private async processLinkedInShareCreated(data: any) {
        const { shareId, author } = data;

        logger.info('LinkedIn share created', { shareId, author });

        // Update post status if we have a matching post
        await this.updatePostStatus(author, shareId, 'linkedin', 'PUBLISHED');
    }

    /**
     * Process LinkedIn share updated
     */
    private async processLinkedInShareUpdated(data: any) {
        const { shareId, author } = data;

        logger.info('LinkedIn share updated', { shareId, author });
    }

    /**
     * Process LinkedIn share deleted
     */
    private async processLinkedInShareDeleted(data: any) {
        const { shareId, author } = data;

        logger.info('LinkedIn share deleted', { shareId, author });

        // Mark post as deleted if we have a matching post
        await this.updatePostStatus(author, shareId, 'linkedin', 'ERROR', 'Post was deleted');
    }

    /**
     * Process Twitter tweet created
     */
    private async processTwitterTweetCreated(tweet: any) {
        const { id_str, user } = tweet;

        logger.info('Twitter tweet created', { tweetId: id_str, userId: user.id_str });

        // Update post status if we have a matching post
        await this.updatePostStatus(user.id_str, id_str, 'twitter', 'PUBLISHED');
    }

    /**
     * Process Twitter favorite
     */
    private async processTwitterFavorite(favorite: any) {
        const { favorited_status } = favorite;

        logger.info('Twitter favorite', { tweetId: favorited_status.id_str });

        // Could update analytics here
    }

    /**
     * Update post status in database
     */
    private async updatePostStatus(
        accountId: string,
        platformPostId: string,
        platform: string,
        status: 'PUBLISHED' | 'ERROR',
        error?: string
    ) {
        try {
            // Find integration
            const integration = await prisma.integration.findFirst({
                where: {
                    internalId: accountId,
                    providerIdentifier: platform,
                    deletedAt: null,
                },
            });

            if (!integration) {
                logger.warn('Integration not found for webhook', { accountId, platform });
                return;
            }

            // Find post by releaseId
            const post = await prisma.post.findFirst({
                where: {
                    integrationId: integration.id,
                    releaseId: platformPostId,
                    deletedAt: null,
                },
            });

            if (!post) {
                logger.debug('Post not found for webhook', { platformPostId, platform });
                return;
            }

            // Update post status
            await prisma.post.update({
                where: { id: post.id },
                data: {
                    state: status,
                    error: error || null,
                    updatedAt: new Date(),
                },
            });

            logger.info('Post status updated via webhook', {
                postId: post.id,
                platformPostId,
                status,
            });
        } catch (error) {
            logger.error('Failed to update post status', {
                accountId,
                platformPostId,
                platform,
                error,
            });
        }
    }

    /**
     * Mark integration for token refresh
     */
    private async markIntegrationForRefresh(accountId: string, platform: string) {
        try {
            await prisma.integration.updateMany({
                where: {
                    internalId: accountId,
                    providerIdentifier: platform,
                    deletedAt: null,
                },
                data: {
                    refreshNeeded: true,
                },
            });

            logger.info('Integration marked for refresh', { accountId, platform });
        } catch (error) {
            logger.error('Failed to mark integration for refresh', {
                accountId,
                platform,
                error,
            });
        }
    }
}
