import { SocialProvider } from './base/social.interface';
import { InstagramProvider } from './social/instagram.provider';
import { YoutubeProvider } from './social/youtube/youtube.provider';
import { TikTokProvider } from './social/tiktok/tiktok.provider';
import { LinkedInProvider } from './social/linkedin/linkedin.provider';
import { FacebookProvider } from './social/facebook/facebook.provider';
import { TwitterProvider } from './social/twitter/twitter.provider';

/**
 * Integration Manager
 * Central registry for all social media and storage providers
 * 
 * To add a new provider:
 * 1. Create provider folder in providers/social/{platform}/
 * 2. Implement provider class extending SocialAbstract
 * 3. Import provider class above
 * 4. Add new instance to providers array below
 * 
 * To remove a provider:
 * 1. Remove from providers array below
 * 2. Delete provider folder from providers/social/{platform}/
 */
export class IntegrationManager {
  private providers: SocialProvider[] = [
    new InstagramProvider(),
    new YoutubeProvider(),
    new TikTokProvider(),
    new LinkedInProvider(),
    new FacebookProvider(),
    new TwitterProvider(),
  ];

  /**
   * Get all available integrations with metadata
   */
  async getAllIntegrations() {
    return {
      social: await Promise.all(
        this.providers.map(async (p) => ({
          name: p.name,
          identifier: p.identifier,
          scopes: p.scopes,
          editor: p.editor,
        }))
      ),
    };
  }

  /**
   * Get specific social integration provider by identifier
   * @param identifier Provider identifier (e.g., 'instagram', 'youtube')
   * @returns Provider instance
   */
  getSocialIntegration(identifier: string): SocialProvider {
    const provider = this.providers.find((p) => p.identifier === identifier);
    if (!provider) {
      throw new Error(`Provider not found: ${identifier}`);
    }
    return provider;
  }

  /**
   * Get all provider identifiers
   */
  getAllowedSocialsIntegrations(): string[] {
    return this.providers.map((p) => p.identifier);
  }
}

// Export singleton instance
export const integrationManager = new IntegrationManager();
