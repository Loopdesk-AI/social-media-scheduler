import { SocialProvider } from './base/social.interface';
import { StorageProvider } from './base/storage.interface';
import { InstagramProvider } from './social/instagram.provider';
import { YoutubeProvider } from './social/youtube/youtube.provider';

import { LinkedInProvider } from './social/linkedin/linkedin.provider';
import { FacebookProvider } from './social/facebook/facebook.provider';
import { TwitterProvider } from './social/twitter/twitter.provider';
import { GoogleDriveProvider } from './storage/google-drive/google-drive.provider';
import { DropboxProvider } from './storage/dropbox/dropbox.provider';

/**
 * Integration Manager
 * Central registry for all social media and storage providers
 * 
 * To add a new provider:
 * 1. Create provider folder in providers/social/{platform}/ or providers/storage/{platform}/
 * 2. Implement provider class extending SocialAbstract or BaseStorageProvider
 * 3. Import provider class above
 * 4. Add new instance to providers array below
 * 
 * To remove a provider:
 * 1. Remove from providers array below
 * 2. Delete provider folder from providers/social/{platform}/ or providers/storage/{platform}/
 */
export class IntegrationManager {
  private socialProviders: SocialProvider[] = [
    new InstagramProvider(),
    new YoutubeProvider(),

    new LinkedInProvider(),
    new FacebookProvider(),
    new TwitterProvider(),
  ];

  private storageProviders: StorageProvider[] = [];

  constructor() {
    // Only add storage providers if they are configured
    const googleDriveProvider = new GoogleDriveProvider();
    console.log('Google Drive configured:', googleDriveProvider.isConfigured);
    if (googleDriveProvider.isConfigured) {
      this.storageProviders.push(googleDriveProvider);
    }

    const dropboxProvider = new DropboxProvider();
    console.log('Dropbox configured:', dropboxProvider.isConfigured);
    if (dropboxProvider.isConfigured) {
      this.storageProviders.push(dropboxProvider);
    }

    console.log('Registered storage providers:', this.storageProviders.map(p => p.identifier));
  }

  /**
   * Get all available integrations with metadata
   */
  async getAllIntegrations() {
    return {
      social: await Promise.all(
        this.socialProviders.map(async (p) => ({
          name: p.name,
          identifier: p.identifier,
          scopes: p.scopes,
          editor: p.editor,
        }))
      ),
      storage: await Promise.all(
        this.storageProviders.map(async (p) => ({
          name: p.name,
          identifier: p.identifier,
          scopes: p.scopes,
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
    const provider = this.socialProviders.find((p) => p.identifier === identifier);
    if (!provider) {
      throw new Error(`Social provider not found: ${identifier}`);
    }
    return provider;
  }

  /**
   * Get specific storage integration provider by identifier
   * @param identifier Provider identifier (e.g., 'google-drive', 'dropbox')
   * @returns Provider instance
   */
  getStorageIntegration(identifier: string): StorageProvider {
    const provider = this.storageProviders.find((p) => p.identifier === identifier);
    if (!provider) {
      throw new Error(`Storage provider not found: ${identifier}`);
    }
    return provider;
  }

  /**
   * Get all provider identifiers
   */
  getAllowedSocialsIntegrations(): string[] {
    return this.socialProviders.map((p) => p.identifier);
  }

  /**
   * Get all storage provider identifiers
   */
  getAllowedStorageIntegrations(): string[] {
    return this.storageProviders.map((p) => p.identifier);
  }
}

// Export singleton instance
export const integrationManager = new IntegrationManager();