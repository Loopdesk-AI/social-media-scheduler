import axios from 'axios';

/**
 * LinkedIn Carousel Helper
 * Document and Image Carousels
 */
export class LinkedInCarouselHelper {
    private baseUrl = 'https://api.linkedin.com/v2';

    /**
     * Create a document carousel post
     */
    async postDocumentCarousel(
        authorUrn: string,
        accessToken: string,
        documents: Array<{
            title: string;
            url: string;
            thumbnailUrl?: string;
        }>,
        commentary?: string
    ): Promise<string> {
        const payload = {
            author: authorUrn,
            lifecycleState: 'PUBLISHED',
            specificContent: {
                'com.linkedin.ugc.ShareContent': {
                    shareCommentary: {
                        text: commentary || '',
                    },
                    shareMediaCategory: 'ARTICLE',
                    media: documents.map(doc => ({
                        status: 'READY',
                        description: {
                            text: doc.title,
                        },
                        originalUrl: doc.url,
                        thumbnails: doc.thumbnailUrl ? [{
                            url: doc.thumbnailUrl,
                        }] : undefined,
                    })),
                },
            },
            visibility: {
                'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
            },
        };

        const response = await axios.post(
            `${this.baseUrl}/ugcPosts`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Restli-Protocol-Version': '2.0.0',
                },
            }
        );

        return response.data.id;
    }

    /**
     * Create an image carousel post
     */
    async postImageCarousel(
        authorUrn: string,
        accessToken: string,
        images: Array<{
            uploadedImageUrn: string;
            title?: string;
            description?: string;
        }>,
        commentary?: string
    ): Promise<string> {
        const payload = {
            author: authorUrn,
            lifecycleState: 'PUBLISHED',
            specificContent: {
                'com.linkedin.ugc.ShareContent': {
                    shareCommentary: {
                        text: commentary || '',
                    },
                    shareMediaCategory: 'IMAGE',
                    media: images.map(img => ({
                        status: 'READY',
                        media: img.uploadedImageUrn,
                        title: img.title ? { text: img.title } : undefined,
                        description: img.description ? { text: img.description } : undefined,
                    })),
                },
            },
            visibility: {
                'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
            },
        };

        const response = await axios.post(
            `${this.baseUrl}/ugcPosts`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Restli-Protocol-Version': '2.0.0',
                },
            }
        );

        return response.data.id;
    }
}

/**
 * LinkedIn Events Helper
 */
export class LinkedInEventsHelper {
    private baseUrl = 'https://api.linkedin.com/rest';

    /**
     * Create a LinkedIn Event
     */
    async createEvent(
        organizationUrn: string,
        accessToken: string,
        eventData: {
            name: string;
            description: string;
            startAt: number; // Unix timestamp in milliseconds
            endAt: number;
            timeZone: string; // e.g., "America/Los_Angeles"
            eventType: 'ONLINE' | 'IN_PERSON' | 'HYBRID';
            onlineEventUrl?: string;
            venue?: {
                name: string;
                address: {
                    line1: string;
                    city: string;
                    postalCode: string;
                    country: string;
                };
            };
            coverImageUrn?: string;
        }
    ): Promise<string> {
        const payload: any = {
            organizer: organizationUrn,
            name: {
                localized: {
                    en_US: eventData.name,
                },
                preferredLocale: {
                    language: 'en',
                    country: 'US',
                },
            },
            description: {
                localized: {
                    en_US: eventData.description,
                },
                preferredLocale: {
                    language: 'en',
                    country: 'US',
                },
            },
            startAt: eventData.startAt,
            endAt: eventData.endAt,
            timeZone: eventData.timeZone,
            eventType: eventData.eventType,
        };

        if (eventData.eventType === 'ONLINE' && eventData.onlineEventUrl) {
            payload.onlineEventUrl = eventData.onlineEventUrl;
        }

        if (eventData.eventType !== 'ONLINE' && eventData.venue) {
            payload.venue = eventData.venue;
        }

        if (eventData.coverImageUrn) {
            payload.coverImage = eventData.coverImageUrn;
        }

        const response = await axios.post(
            `${this.baseUrl}/events`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'LinkedIn-Version': '202401',
                },
            }
        );

        return response.data.id;
    }

    /**
     * Get event details
     */
    async getEvent(
        eventId: string,
        accessToken: string
    ): Promise<any> {
        const response = await axios.get(
            `${this.baseUrl}/events/${eventId}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'LinkedIn-Version': '202401',
                },
            }
        );

        return response.data;
    }

    /**
     * Update event
     */
    async updateEvent(
        eventId: string,
        accessToken: string,
        updates: {
            name?: string;
            description?: string;
            startAt?: number;
            endAt?: number;
        }
    ): Promise<boolean> {
        const payload: any = {};

        if (updates.name) {
            payload.name = {
                localized: { en_US: updates.name },
                preferredLocale: { language: 'en', country: 'US' },
            };
        }

        if (updates.description) {
            payload.description = {
                localized: { en_US: updates.description },
                preferredLocale: { language: 'en', country: 'US' },
            };
        }

        if (updates.startAt) payload.startAt = updates.startAt;
        if (updates.endAt) payload.endAt = updates.endAt;

        const response = await axios.patch(
            `${this.baseUrl}/events/${eventId}`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'LinkedIn-Version': '202401',
                },
            }
        );

        return response.status === 200;
    }

    /**
     * Cancel event
     */
    async cancelEvent(
        eventId: string,
        accessToken: string
    ): Promise<boolean> {
        const response = await axios.delete(
            `${this.baseUrl}/events/${eventId}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'LinkedIn-Version': '202401',
                },
            }
        );

        return response.status === 204;
    }
}

/**
 * LinkedIn Newsletter Helper
 */
export class LinkedInNewsletterHelper {
    private baseUrl = 'https://api.linkedin.com/rest';

    /**
     * Create a newsletter article
     */
    async publishNewsletterArticle(
        authorUrn: string,
        newsletterId: string,
        accessToken: string,
        article: {
            title: string;
            content: string; // HTML content
            thumbnailUrl?: string;
        }
    ): Promise<string> {
        const payload = {
            author: authorUrn,
            newsletter: newsletterId,
            title: {
                localized: {
                    en_US: article.title,
                },
                preferredLocale: {
                    language: 'en',
                    country: 'US',
                },
            },
            content: {
                localized: {
                    en_US: article.content,
                },
                preferredLocale: {
                    language: 'en',
                    country: 'US',
                },
            },
            thumbnail: article.thumbnailUrl,
            lifecycleState: 'PUBLISHED',
        };

        const response = await axios.post(
            `${this.baseUrl}/newsletterArticles`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'LinkedIn-Version': '202401',
                },
            }
        );

        return response.data.id;
    }

    /**
     * Get newsletter subscribers count
     */
    async getNewsletterStats(
        newsletterId: string,
        accessToken: string
    ): Promise<{
        subscriberCount: number;
        articleCount: number;
    }> {
        const response = await axios.get(
            `${this.baseUrl}/newsletters/${newsletterId}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'LinkedIn-Version': '202401',
                },
                params: {
                    projection: '(subscriberCount,articleCount)',
                },
            }
        );

        return {
            subscriberCount: response.data.subscriberCount || 0,
            articleCount: response.data.articleCount || 0,
        };
    }
}

/**
 * LinkedIn Hashtag Helper
 */
export class LinkedInHashtagHelper {
    private baseUrl = 'https://api.linkedin.com/v2';

    /**
     * Get hashtag suggestions based on content
     */
    async getHashtagSuggestions(
        content: string,
        accessToken: string,
        limit: number = 5
    ): Promise<string[]> {
        // Extract existing hashtags from content
        const existingHashtags: string[] = content.match(/#\w+/g) || [];

        // Common LinkedIn hashtags by category
        const suggestions: { [key: string]: string[] } = {
            business: ['#Business', '#Entrepreneurship', '#Leadership', '#Innovation', '#Strategy'],
            tech: ['#Technology', '#AI', '#MachineLearning', '#CloudComputing', '#Cybersecurity'],
            marketing: ['#Marketing', '#DigitalMarketing', '#ContentMarketing', '#SocialMedia', '#Branding'],
            career: ['#Career', '#JobSearch', '#Hiring', '#Networking', '#ProfessionalDevelopment'],
            sales: ['#Sales', '#B2B', '#CustomerSuccess', '#SalesStrategy', '#BusinessDevelopment'],
            hr: ['#HR', '#Recruitment', '#TalentAcquisition', '#EmployeeEngagement', '#WorkplaceCulture'],
        };

        // Simple keyword matching for suggestions
        const keywords = content.toLowerCase();
        let recommended: string[] = [];

        Object.entries(suggestions).forEach(([category, tags]) => {
            if (keywords.includes(category) || tags.some(tag => keywords.includes(tag.toLowerCase().slice(1)))) {
                recommended.push(...tags);
            }
        });

        // Remove duplicates and existing hashtags
        recommended = [...new Set(recommended)].filter(
            tag => !existingHashtags.includes(tag)
        );

        return recommended.slice(0, limit);
    }

    /**
     * Get trending hashtags (mock - LinkedIn doesn't provide this via API)
     */
    async getTrendingHashtags(
        category?: string
    ): Promise<string[]> {
        const trending = {
            general: ['#Leadership', '#Innovation', '#Technology', '#Business', '#Career'],
            tech: ['#AI', '#CloudComputing', '#DataScience', '#Blockchain', '#IoT'],
            business: ['#Entrepreneurship', '#StartUp', '#Growth', '#Strategy', '#Digital Transformation'],
        };

        return trending[category as keyof typeof trending] || trending.general;
    }
}

/**
 * LinkedIn Analytics Helper
 */
export class LinkedInAnalyticsHelper {
    private baseUrl = 'https://api.linkedin.com/v2';

    /**
     * Get organization page analytics
     */
    async getOrganizationAnalytics(
        organizationUrn: string,
        accessToken: string,
        startDate: number,
        endDate: number
    ): Promise<{
        followerGain: number;
        impressions: number;
        engagement: number;
        clickThroughRate: number;
    }> {
        const timeRange = {
            start: startDate,
            end: endDate,
        };

        // Get follower statistics
        const followerResponse = await axios.get(
            `${this.baseUrl}/organizationalEntityFollowerStatistics`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                params: {
                    q: 'organizationalEntity',
                    organizationalEntity: organizationUrn,
                    timeIntervals: `(timeRange:(start:${startDate},end:${endDate}))`,
                },
            }
        );

        // Get share statistics
        const shareResponse = await axios.get(
            `${this.baseUrl}/organizationalEntityShareStatistics`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                params: {
                    q: 'organizationalEntity',
                    organizationalEntity: organizationUrn,
                    timeIntervals: `(timeRange:(start:${startDate},end:${endDate}))`,
                },
            }
        );

        const followerData = followerResponse.data.elements?.[0] || {};
        const shareData = shareResponse.data.elements?.[0] || {};

        return {
            followerGain: followerData.followerGains?.organicFollowerGain || 0,
            impressions: shareData.totalShareStatistics?.impressionCount || 0,
            engagement: shareData.totalShareStatistics?.engagement || 0,
            clickThroughRate: shareData.totalShareStatistics?.clickCount || 0,
        };
    }

    /**
     * Get follower demographics
     */
    async getFollowerDemographics(
        organizationUrn: string,
        accessToken: string
    ): Promise<{
        byCountry: Array<{ country: string; count: number }>;
        byIndustry: Array<{ industry: string; count: number }>;
        bySeniority: Array<{ seniority: string; count: number }>;
    }> {
        const response = await axios.get(
            `${this.baseUrl}/networkSizes/${organizationUrn}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                params: {
                    edgeType: 'CompanyFollowedByMember',
                },
            }
        );

        // Mock data structure - actual API response varies
        return {
            byCountry: [],
            byIndustry: [],
            bySeniority: [],
        };
    }
}

// Export helper instances
export const linkedInCarouselHelper = new LinkedInCarouselHelper();
export const linkedInEventsHelper = new LinkedInEventsHelper();
export const linkedInNewsletterHelper = new LinkedInNewsletterHelper();
export const linkedInHashtagHelper = new LinkedInHashtagHelper();
export const linkedInAnalyticsHelper = new LinkedInAnalyticsHelper();
