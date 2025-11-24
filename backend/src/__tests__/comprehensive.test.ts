// Comprehensive Test Suite for All Providers and Services

import { InstagramProvider } from '../providers/social/instagram.provider';
import { YoutubeProvider } from '../providers/social/youtube/youtube.provider';

import { LinkedInProvider } from '../providers/social/linkedin/linkedin.provider';
import { FacebookProvider } from '../providers/social/facebook/facebook.provider';
import { TwitterProvider } from '../providers/social/twitter/twitter.provider';
import { integrationManager } from '../providers/integration.manager';
import { QueueService } from '../services/queue.service';
import { encrypt, decrypt } from '../services/encryption.service';

describe('Comprehensive Test Suite', () => {

  // ============================================
  // PROVIDER TESTS
  // ============================================

  describe('All Providers Configuration', () => {
    const providers = [
      { Provider: InstagramProvider, identifier: 'instagram', maxLength: 2200 },
      { Provider: YoutubeProvider, identifier: 'youtube', maxLength: 5000 },

      { Provider: LinkedInProvider, identifier: 'linkedin', maxLength: 3000 },
      { Provider: FacebookProvider, identifier: 'facebook', maxLength: 63206 },
      { Provider: TwitterProvider, identifier: 'twitter', maxLength: 280 },
    ];

    providers.forEach(({ Provider, identifier, maxLength }) => {
      describe(`${identifier} Provider`, () => {
        let provider: any;

        beforeEach(() => {
          provider = new Provider();
        });

        it('should have correct identifier', () => {
          expect(provider.identifier).toBe(identifier);
        });

        it('should have correct max length', () => {
          expect(provider.maxLength()).toBe(maxLength);
        });

        it('should have scopes defined', () => {
          expect(provider.scopes).toBeDefined();
          expect(Array.isArray(provider.scopes)).toBe(true);
          expect(provider.scopes.length).toBeGreaterThan(0);
        });

        it('should generate auth URL', async () => {
          const result = await provider.generateAuthUrl();
          expect(result).toHaveProperty('url');
          expect(result).toHaveProperty('state');
          expect(result.url).toBeTruthy();
        });

        it('should have handleErrors method', () => {
          expect(typeof provider.handleErrors).toBe('function');
        });
      });
    });
  });

  // ============================================
  // INTEGRATION MANAGER TESTS
  // ============================================

  describe('Integration Manager', () => {
    it('should return all integrations', async () => {
      const integrations = await integrationManager.getAllIntegrations();
      expect(integrations).toHaveProperty('social');
      expect(Array.isArray(integrations.social)).toBe(true);
      expect(integrations.social.length).toBe(6);
    });

    it('should get Instagram provider', () => {
      const provider = integrationManager.getSocialIntegration('instagram');
      expect(provider).toBeDefined();
      expect(provider.identifier).toBe('instagram');
    });

    it('should get YouTube provider', () => {
      const provider = integrationManager.getSocialIntegration('youtube');
      expect(provider).toBeDefined();
      expect(provider.identifier).toBe('youtube');
    });



    it('should get LinkedIn provider', () => {
      const provider = integrationManager.getSocialIntegration('linkedin');
      expect(provider).toBeDefined();
      expect(provider.identifier).toBe('linkedin');
    });

    it('should get Facebook provider', () => {
      const provider = integrationManager.getSocialIntegration('facebook');
      expect(provider).toBeDefined();
      expect(provider.identifier).toBe('facebook');
    });

    it('should get Twitter provider', () => {
      const provider = integrationManager.getSocialIntegration('twitter');
      expect(provider).toBeDefined();
      expect(provider.identifier).toBe('twitter');
    });

    it('should throw error for unknown provider', () => {
      expect(() => {
        integrationManager.getSocialIntegration('unknown');
      }).toThrow();
    });
  });

  // ============================================
  // ENCRYPTION SERVICE TESTS
  // ============================================

  describe('Encryption Service', () => {
    it('should encrypt and decrypt text', () => {
      const originalText = 'test_access_token_12345';
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);

      expect(encrypted).not.toBe(originalText);
      expect(decrypted).toBe(originalText);
    });

    it('should produce different encrypted values for same input', () => {
      const text = 'test_token';
      const encrypted1 = encrypt(text);
      const encrypted2 = encrypt(text);

      expect(encrypted1).not.toBe(encrypted2);
      expect(decrypt(encrypted1)).toBe(text);
      expect(decrypt(encrypted2)).toBe(text);
    });

    it('should handle long strings', () => {
      const longText = 'a'.repeat(1000);
      const encrypted = encrypt(longText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(longText);
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  describe('Provider Error Handling', () => {
    it('Instagram should handle rate limit errors', () => {
      const provider = new InstagramProvider();
      const errorBody = JSON.stringify({ error: { message: '2207042' } });
      const result = provider.handleErrors(errorBody);

      expect(result).toBeDefined();
      expect(result?.type).toBe('bad-body');
    });

    it('YouTube should handle upload limit errors', () => {
      const provider = new YoutubeProvider();
      const errorBody = JSON.stringify({
        error: { errors: [{ reason: 'uploadLimitExceeded' }] }
      });
      const result = provider.handleErrors(errorBody);

      expect(result).toBeDefined();
      expect(result?.type).toBe('bad-body');
    });



    it('LinkedIn should handle unauthorized errors', () => {
      const provider = new LinkedInProvider();
      const errorBody = JSON.stringify({ message: 'unauthorized' });
      const result = provider.handleErrors(errorBody, 401);

      expect(result).toBeDefined();
      expect(result?.type).toBe('refresh-token');
    });

    it('Facebook should handle duplicate post errors', () => {
      const provider = new FacebookProvider();
      const errorBody = JSON.stringify({
        error: { code: 368, message: 'duplicate' }
      });
      const result = provider.handleErrors(errorBody);

      expect(result).toBeDefined();
      expect(result?.type).toBe('bad-body');
    });

    it('Twitter should handle duplicate content errors', () => {
      const provider = new TwitterProvider();
      const errorBody = JSON.stringify({
        errors: [{ message: 'duplicate content' }]
      });
      const result = provider.handleErrors(errorBody);

      expect(result).toBeDefined();
      expect(result?.type).toBe('bad-body');
    });
  });
});
