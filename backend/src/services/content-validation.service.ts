import { integrationManager } from '../providers/integration.manager';
import { prisma } from '../database/prisma.client';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ContentValidationOptions {
  platformSpecificContent?: Record<string, { content?: string; settings?: any }>;
  defaultContent: string;
  integrationIds: string[];
}

export class ContentValidationService {
  /**
   * Validate content for multiple platforms
   */
  async validateContent(options: ContentValidationOptions): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validate default content
    if (!options.defaultContent || options.defaultContent.trim().length === 0) {
      result.errors.push('Content cannot be empty');
      result.isValid = false;
    }

    // Validate each platform's content
    for (const integrationId of options.integrationIds) {
      try {
        // Get platform-specific content or use default
        const platformContent = options.platformSpecificContent?.[integrationId];
        const content = platformContent?.content || options.defaultContent;
        
        // Validate content length for this platform
        const validationResult = await this.validatePlatformContent(integrationId, content);
        
        if (!validationResult.isValid) {
          result.isValid = false;
          result.errors.push(...validationResult.errors.map(err => `[${integrationId}] ${err}`));
        }
        
        result.warnings.push(...validationResult.warnings.map(warn => `[${integrationId}] ${warn}`));
      } catch (error: any) {
        result.errors.push(`Failed to validate content for integration ${integrationId}: ${error.message || 'Unknown error'}`);
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * Validate content for a specific platform
   */
  private async validatePlatformContent(integrationId: string, content: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Get the integration from database to determine provider
      const integration = await prisma.integration.findUnique({
        where: { id: integrationId }
      });

      if (!integration) {
        result.errors.push('Integration not found');
        result.isValid = false;
        return result;
      }

      // Get provider for this integration
      const provider = integrationManager.getSocialIntegration(integration.providerIdentifier);
      
      if (!provider) {
        result.errors.push('Unsupported platform');
        result.isValid = false;
        return result;
      }

      // Validate content length
      const maxLength = provider.maxLength();
      if (content.length > maxLength) {
        result.errors.push(`Content exceeds maximum length of ${maxLength} characters`);
        result.isValid = false;
      }

      // Validate hashtags
      const hashtagErrors = this.validateHashtags(content, provider.identifier);
      if (hashtagErrors.length > 0) {
        result.errors.push(...hashtagErrors);
        result.isValid = false;
      }

      // Validate links
      const linkWarnings = this.validateLinks(content);
      result.warnings.push(...linkWarnings);

      // Platform-specific validations
      switch (provider.identifier) {
        case 'instagram':
          this.validateInstagramContent(content, result);
          break;
        case 'youtube':
          this.validateYouTubeContent(content, result);
          break;
        case 'twitter':
          this.validateTwitterContent(content, result);
          break;
      }
    } catch (error: any) {
      result.errors.push(`Validation error: ${error.message || 'Unknown error'}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate hashtags in content
   */
  private validateHashtags(content: string, platform: string): string[] {
    const errors: string[] = [];
    const hashtagRegex = /#[\w]+/g;
    const hashtags = content.match(hashtagRegex) || [];

    // Platform-specific hashtag limits
    const maxHashtags: Record<string, number> = {
      instagram: 30,
      twitter: 10,
      facebook: 20,
      linkedin: 15,
      youtube: 10,
      tiktok: 25
    };

    const maxAllowed = maxHashtags[platform] || 10;
    
    if (hashtags.length > maxAllowed) {
      errors.push(`Too many hashtags (${hashtags.length}). Maximum allowed: ${maxAllowed}`);
    }

    // Check for invalid hashtags
    for (const hashtag of hashtags) {
      if (hashtag.length > 128) {
        errors.push(`Hashtag ${hashtag} is too long (max 128 characters)`);
      }
      
      if (!/^#[\w]+$/.test(hashtag)) {
        errors.push(`Invalid hashtag format: ${hashtag}`);
      }
    }

    return errors;
  }

  /**
   * Validate links in content
   */
  private validateLinks(content: string): string[] {
    const warnings: string[] = [];
    const urlRegex = /https?:\/\/[^\s]+/g;
    const links = content.match(urlRegex) || [];

    if (links.length > 0) {
      warnings.push(`Content contains ${links.length} link(s). Make sure they are appropriate for your audience.`);
    }

    return warnings;
  }

  /**
   * Instagram-specific content validation
   */
  private validateInstagramContent(content: string, result: ValidationResult): void {
    // Check for Instagram-specific restrictions
    if (content.includes('@')) {
      // Check if @ mentions are valid usernames
      const mentionRegex = /@[\w.]+/g;
      const mentions = content.match(mentionRegex) || [];
      
      if (mentions.length > 20) {
        result.warnings.push('Too many @ mentions. Instagram may limit visibility.');
      }
    }
  }

  /**
   * YouTube-specific content validation
   */
  private validateYouTubeContent(content: string, result: ValidationResult): void {
    // YouTube has different validation rules
    if (content.length < 10) {
      result.warnings.push('YouTube descriptions should be more descriptive for better SEO.');
    }
  }

  /**
   * Twitter-specific content validation
   */
  private validateTwitterContent(content: string, result: ValidationResult): void {
    // Twitter has character limit of 280
    if (content.length > 280) {
      result.errors.push('Twitter content exceeds 280 character limit');
    }
  }
}

// Export singleton instance
export const contentValidationService = new ContentValidationService();